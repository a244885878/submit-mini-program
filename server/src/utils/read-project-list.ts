import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * 获取指定目录下的所有子项目的 package.json 和 .env.development 的信息
 */
export function getAllSubProjectInfo(): Array<{
  projectPath: string;
  name: string;
  version: string;
  orgName: string;
}> {
  const desktopDir = path.join(os.homedir(), "Desktop");

  const parentDirs = [
    path.join(
      desktopDir,
      "code",
      "taozi",
      "cloud-outpatient-mp",
      "apps",
      "cloud-outpatient"
    ),
    path.join(
      desktopDir,
      "code",
      "taozi",
      "cloud-outpatient-mp",
      "apps",
      "internet-hospital"
    ),
  ];

  const results: Array<{
    projectPath: string;
    name: string;
    version: string;
    orgName: string;
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
        if (fs.existsSync(envPath)) {
          const envRaw = fs.readFileSync(envPath, "utf-8");
          const match = envRaw.match(/^VITE_ORG_NAME\s*=\s*(.+)$/m);
          orgName = match ? match[1].trim() : "";
        }

        results.push({ projectPath, name, version, orgName });
      } catch (err) {
        console.warn(`读取失败: ${projectPath}`, err);
      }
    }
  }

  return results;
}
