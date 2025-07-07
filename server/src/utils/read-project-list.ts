import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { MiniProgramType } from "../constants/enum";

/**
 * 获取指定目录下的所有子项目的 package.json 和 .env.development 的信息
 * @param type 小程序类型，默认为 cloud-outpatient-mp
 */
export function getAllSubProjectInfo(
  type: string = MiniProgramType.CloudOutpatientMp
): Array<{
  projectPath: string;
  name: string;
  version: string;
  orgName: string;
  appid: string;
  privateKeyPath: string;
  devPath: string;
  buildPath: string;
}> {
  const desktopDir = path.join(os.homedir(), "Desktop");

  // 根据type确定项目路径
  let parentDirs: string[];

  if (type === MiniProgramType.CloudMallMp) {
    parentDirs = [
      path.join(
        desktopDir,
        "code",
        "taozi",
        MiniProgramType.CloudMallMp,
        "apps",
        "cloud-outpatient"
      ),
      path.join(
        desktopDir,
        "code",
        "taozi",
        MiniProgramType.CloudMallMp,
        "apps",
        "internet-hospital"
      ),
    ];
  } else {
    // 默认 cloud-outpatient-mp
    parentDirs = [
      path.join(
        desktopDir,
        "code",
        "taozi",
        MiniProgramType.CloudOutpatientMp,
        "apps",
        "cloud-outpatient"
      ),
      path.join(
        desktopDir,
        "code",
        "taozi",
        MiniProgramType.CloudOutpatientMp,
        "apps",
        "internet-hospital"
      ),
    ];
  }

  const results: Array<{
    projectPath: string;
    name: string;
    version: string;
    orgName: string;
    appid: string;
    privateKeyPath: string;
    devPath: string;
    buildPath: string;
  }> = [];

  for (const parentDir of parentDirs) {
    if (!fs.existsSync(parentDir)) {
      console.warn(`目录不存在: ${parentDir}`);
      continue;
    }

    const subDirs = fs
      .readdirSync(parentDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(parentDir, entry.name));

    for (const projectPath of subDirs) {
      try {
        const pkgPath = path.join(projectPath, "package.json");
        const envPath = path.join(projectPath, ".env.development");

        if (!fs.existsSync(pkgPath)) {
          console.warn(`package.json 不存在: ${pkgPath}`);
          continue;
        }

        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        const name = pkg.name || "";
        const version = pkg.version || "";

        let orgName = "";
        let appid = "";
        let privateKeyPath = "";
        let devPath = "";
        let buildPath = "";

        // 读取 .env.development 文件
        if (fs.existsSync(envPath)) {
          const envRaw = fs.readFileSync(envPath, "utf-8");

          // 读取 VITE_ORG_NAME
          const orgMatch = envRaw.match(/^VITE_ORG_NAME\s*=\s*(.+)$/m);
          orgName = orgMatch ? orgMatch[1].trim() : "";

          // 读取 VITE_WECHAT_APP_ID
          const appidMatch = envRaw.match(/^VITE_WECHAT_APP_ID\s*=\s*(.+)$/m);
          appid = appidMatch ? appidMatch[1].trim() : "";
        }

        // 查找 private.xxxxxxx.key 文件
        try {
          const files = fs.readdirSync(projectPath);
          const privateKeyFile = files.find(
            (file) => file.startsWith("private.") && file.endsWith(".key")
          );
          if (privateKeyFile) {
            privateKeyPath = path.join(projectPath, privateKeyFile);
          }
        } catch (err) {
          console.warn(`查找private key文件失败: ${projectPath}`, err);
        }

        // 检查 dev 目录路径 (dist/dev/mp-weixin)
        const devDirPath = path.join(projectPath, "dist", "dev", "mp-weixin");
        if (fs.existsSync(devDirPath)) {
          devPath = devDirPath;
        }

        // 检查 pro 目录路径 (dist/build/mp-weixin)
        const buildDirPath = path.join(
          projectPath,
          "dist",
          "build",
          "mp-weixin"
        );
        if (fs.existsSync(buildDirPath)) {
          buildPath = buildDirPath;
        }

        results.push({
          projectPath,
          name,
          version,
          orgName,
          appid,
          privateKeyPath,
          devPath,
          buildPath,
        });
      } catch (err) {
        console.warn(`读取失败: ${projectPath}`, err);
      }
    }
  }

  return results;
}
