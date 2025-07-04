import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import fs from "fs";

const execAsync = promisify(exec);

/**
 * 获取桌面路径（跨平台兼容）
 * @returns string 桌面路径
 */
function getDesktopPath(): string {
  const platform = os.platform();

  switch (platform) {
    case "win32":
      return path.join(process.env.USERPROFILE || "", "Desktop");
    case "darwin":
      return path.join(process.env.HOME || "", "Desktop");
    case "linux":
      return path.join(process.env.HOME || "", "Desktop");
    default:
      return path.join(process.env.HOME || "", "Desktop");
  }
}

/**
 * 获取当前分支的提交信息
 * @returns Promise<{commit: string, lastCommitUser: string}>
 */
export async function getGitInfo(): Promise<{
  commit: string;
  lastCommitUser: string;
}> {
  try {
    const desktopPath = getDesktopPath();
    const targetDir = path.join(
      desktopPath,
      "code",
      "taozi",
      "cloud-outpatient-mp"
    );

    // 检查目录是否存在
    if (!fs.existsSync(targetDir)) {
      throw new Error(`目标目录不存在: ${targetDir}`);
    }

    // 获取最新的提交信息（第一行）
    const { stdout: commitMessage } = await execAsync(
      "git log -1 --pretty=format:'%s'",
      {
        cwd: targetDir,
        timeout: 5000,
        shell: os.platform() === "win32" ? "cmd.exe" : "/bin/bash",
      }
    );

    // 获取最新的提交者信息
    const { stdout: commitUser } = await execAsync(
      "git log -1 --pretty=format:'%an'",
      {
        cwd: targetDir,
        timeout: 5000,
        shell: os.platform() === "win32" ? "cmd.exe" : "/bin/bash",
      }
    );

    return {
      commit: commitMessage.trim(),
      lastCommitUser: commitUser.trim(),
    };
  } catch (error) {
    console.error("获取 Git 信息失败:", error);
    return {
      commit: "unknown",
      lastCommitUser: "unknown",
    };
  }
}
