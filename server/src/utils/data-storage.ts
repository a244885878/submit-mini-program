import path from "path";
import fs from "fs";
import { getGitInfo } from "./git-info";

// 数据文件路径
const DATA_FILE_PATH = path.join(__dirname, "../../data/upload_records.json");

// 确保数据目录存在
const dataDir = path.dirname(DATA_FILE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 数据结构
interface UploadRecord {
  id: number;
  name: string;
  orgName: string;
  lastCommitUser: string;
  commit: string;
  uploadTime: string;
  mode: "test" | "pro";
  status: "success" | "fail";
  version: string;
  created_at: string;
}

// 内存中的数据
let records: UploadRecord[] = [];
let nextId = 1;

/**
 * 格式化时间为 YYYY-MM-DD HH:MM:SS 格式
 * @param date Date 对象或时间字符串
 * @returns string
 */
function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 从文件加载数据
 */
function loadData(): void {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const data = fs.readFileSync(DATA_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      records = parsed.records || [];
      nextId = parsed.nextId || 1;
    }
  } catch (error) {
    console.error("加载数据失败:", error);
    records = [];
    nextId = 1;
  }
}

/**
 * 保存数据到文件
 */
function saveData(): void {
  try {
    const data = {
      records,
      nextId,
    };
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("保存数据失败:", error);
  }
}

/**
 * 记录上传记录
 * @param name 项目名称
 * @param orgName 机构名称
 * @param mode 上传模式 (test/pro)
 * @param status 上传状态 (success/fail)
 * @param version 版本号
 */
export async function recordUpload(
  name: string,
  orgName: string,
  mode: "test" | "pro",
  status: "success" | "fail",
  version: string
): Promise<void> {
  try {
    // 获取 Git 信息
    const gitInfo = await getGitInfo();

    // 创建记录
    const record: UploadRecord = {
      id: nextId++,
      name,
      orgName,
      lastCommitUser: gitInfo.lastCommitUser,
      commit: gitInfo.commit,
      uploadTime: formatDateTime(new Date()),
      mode,
      status,
      version,
      created_at: formatDateTime(new Date()),
    };

    // 添加到内存
    records.unshift(record); // 添加到开头，最新的在前面

    // 保存到文件
    saveData();

    console.log(`上传记录已保存: ${name} - ${status}`);
  } catch (error) {
    console.error("保存上传记录失败:", error);
    throw error;
  }
}

/**
 * 获取上传记录总数
 * @returns number
 */
export function getUploadRecordsCount(): number {
  return records.length;
}

/**
 * 获取上传记录列表
 * @param limit 限制返回数量，默认 50
 * @param offset 偏移量，默认 0
 * @returns Array
 */
export function getUploadRecords(
  limit: number = 50,
  offset: number = 0
): UploadRecord[] {
  return records.slice(offset, offset + limit);
}

/**
 * 根据项目名称获取上传记录
 * @param name 项目名称
 * @returns Array
 */
export function getUploadRecordsByName(name: string): UploadRecord[] {
  return records.filter((record) => record.name === name);
}

/**
 * 关闭数据库连接（文件系统不需要关闭）
 */
export function closeDatabase(): void {
  // 文件系统不需要关闭连接
  console.log("数据已保存到文件");
}

// 初始化时加载数据
loadData();
