import Router from "koa-router";
import { getAllSubProjectInfo } from "../utils/read-project-list";
import { ResponseCode, UploadStatus } from "../constants/enum";
import * as ci from "miniprogram-ci";
import { buildMiniProgram } from "../utils/pack";
import { pullCode } from "../utils/pull-code";
import {
  recordUpload,
  getUploadRecords,
  getUploadRecordsByName,
  getUploadRecordsCount,
} from "../utils/data-storage";

// 用户路由
const userRoutes = new Router({
  prefix: "/api/users", // 路由前缀
});

// 上传任务队列
let uploadList: { name: string; status: UploadStatus }[] = [];

// 更新上传状态的函数
const updateUploadStatus = (name: string, status: UploadStatus) => {
  const uploadIndex = uploadList.findIndex((item) => item.name === name);
  if (uploadIndex !== -1) {
    uploadList[uploadIndex].status = status;
  }
};

// 获取项目列表
userRoutes.get("/get-project-list", async (ctx) => {
  const info = getAllSubProjectInfo();
  ctx.body = {
    code: ResponseCode.Success,
    message: "success",
    data: info,
  };
});

// 获取上传状态列表
userRoutes.get("/get-upload-statuses", async (ctx) => {
  ctx.body = {
    code: ResponseCode.Success,
    message: "success",
    data: uploadList,
  };
  // 如果有成功的状态，则移除
  uploadList = uploadList.filter(
    (item) => item.status !== UploadStatus.Success
  );
});

// 获取上传记录列表
userRoutes.get("/get-upload-records", async (ctx) => {
  try {
    const {
      page = 1,
      size = 20,
      name,
    } = ctx.query as unknown as {
      page?: number;
      size?: number;
      name?: string;
    };

    // 计算偏移量
    const offset = (page - 1) * size;

    let records;
    let total = 0;

    if (name) {
      records = getUploadRecordsByName(name);
      total = records.length;
    } else {
      records = getUploadRecords(size, offset);
      total = getUploadRecordsCount();
    }

    ctx.body = {
      code: ResponseCode.Success,
      message: "success",
      data: {
        list: records,
        pagination: {
          page,
          size,
          total,
        },
      },
    };
  } catch (error) {
    ctx.body = {
      code: ResponseCode.Error,
      message: "获取上传记录失败",
      data: null,
    };
  }
});

// 上传小程序
userRoutes.get("/upload-mini-program", async (ctx) => {
  try {
    const { name, mode } = ctx.query as unknown as {
      name: string;
      mode: "test" | "pro";
    };

    if (!name || !mode) {
      ctx.body = {
        code: ResponseCode.Error,
        message: "缺少必要参数 name 或 mode",
        data: null,
      };
      return;
    }

    // 检查是否正在存在该打包任务
    const existingUpload = uploadList.find((item) => item.name === name);

    // 如果失败了重新打包，状态设为Building
    if (existingUpload && existingUpload.status === UploadStatus.Fail) {
      updateUploadStatus(name, UploadStatus.Building);
    }

    // 添加到打包列表，状态设为Building（只有在不是从pending状态转换过来的情况下才添加）
    if (!existingUpload) {
      uploadList.push({ name, status: UploadStatus.Building });
    }

    // 创建超时Promise（5分钟超时，包含打包和上传时间）
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("上传超时，请稍后重试"));
      }, 5 * 60 * 1000); // 5分钟
    });

    // 创建整个上传流程的Promise
    const uploadProcessPromise = (async () => {
      // 每次拉取最新的代码
      await pullCode();

      // 执行打包
      const result = await buildMiniProgram(name, mode);
      if (!result.success) {
        throw new Error(result.error || "打包失败");
      }

      // 获取打包后的项目列表
      const allInfo = getAllSubProjectInfo();
      const target = allInfo.find((item) => item.name === name);

      if (!target) {
        throw new Error(`未找到项目：${name}`);
      }

      const project = new ci.Project({
        appid: target.appid,
        type: "miniProgram",
        projectPath: target.buildPath,
        privateKeyPath: target.privateKeyPath,
        ignores: ["node_modules/**/*"],
      });

      // 执行上传
      const uploadResult = await ci.upload({
        project,
        version: target.version,
        desc: `ci上传-${mode === "test" ? "测试" : "正式"}环境`,
        setting: {
          minify: true,
        },
        robot: mode === "test" ? 1 : 2,
      });

      return { uploadResult, target };
    })();

    // 使用Promise.race实现超时控制
    const result = (await Promise.race([
      uploadProcessPromise,
      timeoutPromise,
    ])) as {
      uploadResult: unknown;
      target: ReturnType<typeof getAllSubProjectInfo>[0];
    };

    const { uploadResult, target } = result;

    // 更新状态为成功
    updateUploadStatus(name, UploadStatus.Success);

    // 记录上传成功记录
    await recordUpload(name, target.orgName, mode, "success", target.version);

    ctx.body = {
      code: ResponseCode.Success,
      message: "上传成功",
      data: uploadResult,
    };
  } catch (error) {
    console.log(error);

    // 更新状态为失败
    const { name, mode } = ctx.query as unknown as {
      name: string;
      mode: "test" | "pro";
    };
    updateUploadStatus(name, UploadStatus.Fail);

    // 记录上传失败记录
    const allInfo = getAllSubProjectInfo();
    const target = allInfo.find((item) => item.name === name);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (target) {
      await recordUpload(
        name,
        target.orgName,
        mode,
        "fail",
        target.version,
        errorMessage
      );
    } else {
      await recordUpload(
        name,
        "unknown",
        mode,
        "fail",
        "unknown",
        errorMessage
      );
    }

    ctx.body = {
      code: ResponseCode.Error,
      message: "上传失败" + String(error),
      data: null,
    };
  }
});

export { userRoutes };
