import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * 更新指定类型项目下所有子项目的版本号
 * @param type 小程序类型
 * @param version 新版本号
 * @returns Promise<void>
 */
export function updateProjectVersions(
  type: string,
  version: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const desktopDir = path.join(os.homedir(), "Desktop");
      const projectRootDir = path.join(desktopDir, "code", "taozi", type);
      const appsDir = path.join(projectRootDir, "apps");

      // 检查项目根目录是否存在
      if (!fs.existsSync(projectRootDir)) {
        reject(new Error(`项目根目录不存在: ${projectRootDir}`));
        return;
      }

      // 检查apps目录是否存在
      if (!fs.existsSync(appsDir)) {
        reject(new Error(`apps目录不存在: ${appsDir}`));
        return;
      }

      // 获取apps目录下的所有子目录
      const appDirs = fs
        .readdirSync(appsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(appsDir, entry.name));

      if (appDirs.length === 0) {
        reject(new Error(`apps目录下没有找到子项目`));
        return;
      }

      // 更新每个子项目的版本号
      for (const appDir of appDirs) {
        const packageJsonPath = path.join(appDir, "package.json");

        if (!fs.existsSync(packageJsonPath)) {
          console.warn(`package.json不存在: ${packageJsonPath}`);
          continue;
        }

        try {
          // 读取package.json
          const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
          const packageJson = JSON.parse(packageJsonContent);

          // 更新版本号
          packageJson.version = version;

          // 写回文件
          fs.writeFileSync(
            packageJsonPath,
            JSON.stringify(packageJson, null, 2) + "\n"
          );

          console.log(`已更新版本号: ${appDir} -> ${version}`);
        } catch (error) {
          console.warn(`更新版本号失败: ${appDir}`, error);
        }
      }

      // 切换到项目根目录
      process.chdir(projectRootDir);

      // 执行git add
      try {
        await execAsync("git add .");
        console.log("已执行 git add");
      } catch (error) {
        reject(new Error(`git add 失败: ${error}`));
        return;
      }

      // 执行git commit
      try {
        await execAsync(`git commit -m "ci更新版本号为${version}"`);
        console.log("已执行 git commit");
      } catch (error) {
        reject(new Error(`git commit 失败: ${error}`));
        return;
      }

      // 执行git push
      try {
        await execAsync("git push");
        console.log("已执行 git push");
      } catch (error) {
        reject(new Error(`git push 失败: ${error}`));
        return;
      }

      resolve();
    } catch (error) {
      reject(new Error(`更新版本号过程中发生错误: ${error}`));
    }
  });
}
