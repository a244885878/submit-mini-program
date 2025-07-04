// build-mini-program.ts
import { spawn } from "child_process";
import path from "path";
import os from "os";
import fs from "fs";
import { MiniProgramType } from "../constants/enum";

interface BuildResult {
  success: boolean;
  output: string;
  error?: string;
}

export async function buildMiniProgram(
  name: string,
  mode: "test" | "pro",
  type: string = MiniProgramType.CloudOutpatientMp
): Promise<BuildResult> {
  // 根据type确定项目路径
  const projectName = type;

  // 使用 path.join 和 os.homedir() 确保跨平台兼容性
  const projectDir = path.join(
    os.homedir(),
    "Desktop",
    "code",
    "taozi",
    projectName
  );

  // 检查项目目录是否存在
  if (!fs.existsSync(projectDir)) {
    return {
      success: false,
      output: "",
      error: `项目目录不存在: ${projectDir}`,
    };
  }

  // 检查 package.json 是否存在
  const packageJsonPath = path.join(projectDir, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return {
      success: false,
      output: "",
      error: `package.json 不存在: ${packageJsonPath}`,
    };
  }

  return new Promise<BuildResult>((resolve) => {
    let output = "";
    let processExited = false;
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      console.log(
        `开始构建项目: ${name}, 模式: build, 环境: ${mode}, 类型: ${type}`
      );
      console.log(`项目目录: ${projectDir}`);

      // 使用 Node.js 原生的 child_process.spawn
      const subprocess = spawn(
        "node",
        [
          "./packages/script/launch/index.js",
          name, // 项目名称
          "build", // 构建模式
          mode, // 环境 (test 或 pro)
        ],
        {
          cwd: projectDir,
          stdio: ["pipe", "pipe", "pipe"],
          env: { ...process.env, FORCE_COLOR: "1" },
        }
      );

      // 设置超时时间（10分钟）
      timeoutId = setTimeout(() => {
        if (!processExited) {
          try {
            subprocess.kill("SIGTERM");
          } catch (err) {
            console.error("终止进程失败:", err);
          }
          processExited = true;
          resolve({
            success: false,
            output,
            error: "构建超时（10分钟）",
          });
        }
      }, 10 * 60 * 1000);

      subprocess.stdout?.on("data", (data: Buffer) => {
        const text = data.toString();
        output += text;
        console.log(`[stdout] ${text.trim()}`);
      });

      subprocess.stderr?.on("data", (data: Buffer) => {
        const text = data.toString();
        output += text;
        console.log(`[stderr] ${text.trim()}`);
      });

      subprocess.on("exit", (code, signal) => {
        processExited = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        console.log(`进程退出 - 代码: ${code}, 信号: ${signal}`);

        if (code === 0) {
          resolve({
            success: true,
            output,
          });
        } else {
          resolve({
            success: false,
            output,
            error: `构建失败 - 退出代码: ${code}, 信号: ${signal}`,
          });
        }
      });

      subprocess.on("error", (error) => {
        processExited = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        console.error("子进程启动错误:", error);
        resolve({
          success: false,
          output,
          error: `子进程启动失败: ${error.message}`,
        });
      });
    } catch (err: any) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      console.error("构建过程中发生错误:", err);
      resolve({
        success: false,
        output,
        error: err?.message || "未知错误",
      });
    }
  });
}
