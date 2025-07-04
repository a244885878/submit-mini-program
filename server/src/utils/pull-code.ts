import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import fs from "fs";
import { MiniProgramType } from "../constants/enum";

const execAsync = promisify(exec);

/**
 * 获取桌面路径（跨平台兼容）
 * @returns string 桌面路径
 */
function getDesktopPath(): string {
  const platform = os.platform();

  switch (platform) {
    case "win32":
      // Windows: 使用 USERPROFILE 环境变量
      return path.join(process.env.USERPROFILE || "", "Desktop");
    case "darwin":
      // macOS: 使用 HOME 环境变量
      return path.join(process.env.HOME || "", "Desktop");
    case "linux":
      // Linux: 使用 HOME 环境变量
      return path.join(process.env.HOME || "", "Desktop");
    default:
      // 其他平台默认使用 HOME
      return path.join(process.env.HOME || "", "Desktop");
  }
}

/**
 * 检查目录是否存在
 * @param dirPath 目录路径
 * @returns boolean
 */
function directoryExists(dirPath: string): boolean {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * 拉取代码的方法
 * 进入桌面 code/taozi/cloud-outpatient-mp 或 cloud-mall-mp 目录，执行git pull命令
 * @param type 小程序类型，默认为 cloud-outpatient-mp
 * @returns Promise<void> 成功返回Promise.resolve，失败返回Promise.reject
 */
export async function pullCode(
  type: string = MiniProgramType.CloudOutpatientMp
): Promise<void> {
  try {
    // 构建目标目录路径（跨平台兼容）
    const desktopPath = getDesktopPath();
    const projectName = type;
    const targetDir = path.join(desktopPath, "code", "taozi", projectName);

    // 检查目录是否存在
    if (!directoryExists(targetDir)) {
      throw new Error(`目标目录不存在: ${targetDir}`);
    }

    // 执行git pull命令（跨平台兼容）
    const { stdout, stderr } = await execAsync("git pull", {
      cwd: targetDir, // 设置工作目录
      timeout: 30000, // 30秒超时
      shell: os.platform() === "win32" ? "cmd.exe" : "/bin/bash", // 跨平台shell配置
    });

    // 如果有错误输出，抛出错误
    if (stderr && !stderr.includes("Already up to date")) {
      throw new Error(`Git pull failed: ${stderr}`);
    }

    console.log(`Git pull successful (${type}):`, stdout);
    return Promise.resolve();
  } catch (error) {
    console.error(`Git pull failed (${type}):`, error);
    return Promise.reject(error);
  }
}

/**
 * 检查目录是否存在并且是git仓库
 * @param type 小程序类型，默认为 cloud-outpatient-mp
 * @returns Promise<boolean>
 */
export async function checkGitRepository(
  type: string = MiniProgramType.CloudOutpatientMp
): Promise<boolean> {
  try {
    const desktopPath = getDesktopPath();
    const projectName = type;
    const targetDir = path.join(desktopPath, "code", "taozi", projectName);

    // 检查目录是否存在
    if (!directoryExists(targetDir)) {
      console.error(`目录不存在: ${targetDir}`);
      return false;
    }

    // 检查是否是git仓库
    const { stdout } = await execAsync("git status", {
      cwd: targetDir,
      timeout: 5000,
      shell: os.platform() === "win32" ? "cmd.exe" : "/bin/bash", // 跨平台shell配置
    });

    return true;
  } catch (error) {
    console.error(
      `Not a valid git repository or directory does not exist (${type}):`,
      error
    );
    return false;
  }
}
