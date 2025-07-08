import path from "path";
import fs from "fs";
import { getGitInfo } from "./git-info";
import { MiniProgramType } from "../constants/enum";

// 数据文件路径
const getDataFilePath = (type: string = MiniProgramType.CloudOutpatientMp) => {
  const fileName =
    type === MiniProgramType.CloudMallMp
      ? "mall_upload_records.json"
      : "upload_records.json";
  return path.join(__dirname, "../../data", fileName);
};

// 确保数据目录存在
const ensureDataDir = (type: string = MiniProgramType.CloudOutpatientMp) => {
  const dataDir = path.dirname(getDataFilePath(type));
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

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
  errorMessage?: string; // 错误信息字段，仅在失败时存在
  created_at: string;
  type: string; // 新增type字段
}

// 内存中的数据 - 为每种类型维护独立的数据
const recordsMap: Record<string, UploadRecord[]> = {};
const nextIdMap: Record<string, number> = {};

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
function loadData(type: string = MiniProgramType.CloudOutpatientMp): void {
  try {
    const dataFilePath = getDataFilePath(type);
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, "utf-8");
      const parsed = JSON.parse(data);
      recordsMap[type] = parsed.records || [];
      nextIdMap[type] = parsed.nextId || 1;
    } else {
      recordsMap[type] = [];
      nextIdMap[type] = 1;
    }
  } catch (error) {
    console.error(`加载数据失败 (${type}):`, error);
    recordsMap[type] = [];
    nextIdMap[type] = 1;
  }
}

/**
 * 保存数据到文件
 */
function saveData(type: string = MiniProgramType.CloudOutpatientMp): void {
  try {
    const dataFilePath = getDataFilePath(type);
    const data = {
      records: recordsMap[type] || [],
      nextId: nextIdMap[type] || 1,
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`保存数据失败 (${type}):`, error);
  }
}

/**
 * 记录上传记录
 * @param name 项目名称
 * @param orgName 机构名称
 * @param mode 上传模式 (test/pro)
 * @param status 上传状态 (success/fail)
 * @param version 版本号
 * @param errorMessage 错误信息（仅在失败时）
 * @param type 小程序类型
 */
export async function recordUpload(
  name: string,
  orgName: string,
  mode: "test" | "pro",
  status: "success" | "fail",
  version: string,
  errorMessage?: string,
  type: string = MiniProgramType.CloudOutpatientMp
): Promise<void> {
  try {
    // 确保数据目录存在
    ensureDataDir(type);

    // 确保数据已加载
    if (!recordsMap[type]) {
      loadData(type);
    }

    // 获取 Git 信息
    const gitInfo = await getGitInfo();

    // 创建记录
    const record: UploadRecord = {
      id: nextIdMap[type]++,
      name,
      orgName,
      lastCommitUser: gitInfo.lastCommitUser,
      commit: gitInfo.commit,
      uploadTime: formatDateTime(new Date()),
      mode,
      status,
      version,
      errorMessage: status === "fail" ? errorMessage : undefined,
      created_at: formatDateTime(new Date()),
      type,
    };

    // 添加到内存
    if (!recordsMap[type]) {
      recordsMap[type] = [];
    }
    recordsMap[type].unshift(record); // 添加到开头，最新的在前面

    // 保存到文件
    saveData(type);

    console.log(`上传记录已保存: ${name} - ${status} (${type})`);
  } catch (error) {
    console.error("保存上传记录失败:", error);
    throw error;
  }
}

/**
 * 获取上传记录总数
 * @param type 小程序类型
 * @returns number
 */
export function getUploadRecordsCount(
  type: string = MiniProgramType.CloudOutpatientMp
): number {
  if (!recordsMap[type]) {
    loadData(type);
  }
  return (recordsMap[type] || []).length;
}

/**
 * 获取上传记录列表
 * @param limit 限制返回数量，默认 50
 * @param offset 偏移量，默认 0
 * @param type 小程序类型
 * @returns Array
 */
export function getUploadRecords(
  offset: number = 0,
  limit: number = 50,
  type: string = MiniProgramType.CloudOutpatientMp
): UploadRecord[] {
  if (!recordsMap[type]) {
    loadData(type);
  }
  return (recordsMap[type] || []).slice(offset, offset + limit);
}

/**
 * 根据项目名称获取上传记录
 * @param name 项目名称
 * @param type 小程序类型
 * @returns Array
 */
export function getUploadRecordsByName(
  name: string,
  type: string = MiniProgramType.CloudOutpatientMp
): UploadRecord[] {
  if (!recordsMap[type]) {
    loadData(type);
  }
  return (recordsMap[type] || []).filter((record) => record.name === name);
}

/**
 * 关闭数据库连接（文件系统不需要关闭）
 */
export function closeDatabase(): void {
  // 文件系统不需要关闭连接
  console.log("数据已保存到文件");
}

// 初始化时加载默认数据
loadData(MiniProgramType.CloudOutpatientMp);
loadData(MiniProgramType.CloudMallMp);
