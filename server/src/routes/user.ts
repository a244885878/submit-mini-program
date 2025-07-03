import Router from "koa-router";
import { getAllSubProjectInfo } from "../utils/read-project-list";
import { ResponseCode } from "../constants/enum";
import * as ci from "miniprogram-ci";
import { buildMiniProgram } from "../utils/pack";

// 用户路由
const userRoutes = new Router({
  prefix: "/api/users", // 路由前缀
});

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
    data: [],
  };
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
      };
      return;
    }
    await buildMiniProgram(name, mode);

    const allInfo = getAllSubProjectInfo();
    const target = allInfo.find((item) => item.name === name);

    if (!target) {
      ctx.body = {
        code: ResponseCode.Error,
        message: `未找到项目：${name}`,
        data: null,
      };
      return;
    }

    const project = new ci.Project({
      appid: target.appid,
      type: "miniProgram",
      projectPath: target.buildPath,
      privateKeyPath: target.privateKeyPath,
      ignores: ["node_modules/**/*"],
    });

    const uploadResult = await ci.upload({
      project,
      version: target.version,
      desc: `ci上传-${mode === "test" ? "测试" : "正式"}环境`,
      setting: {
        minify: true,
      },
      robot: mode === "test" ? 1 : 2,
    });

    ctx.body = {
      code: ResponseCode.Success,
      message: "上传成功",
      data: uploadResult,
    };
  } catch (error) {
    console.log(error);

    ctx.body = {
      code: ResponseCode.Error,
      message: "上传失败",
      data: null,
    };
  }
});

export { userRoutes };
