import { request } from "./request";
import { UploadStatus, MiniProgramType } from "../constants/enum";

export type CloudOutpatientMpList = {
  projectPath: string;
  name: string;
  version: string;
  orgName: string;
  appid: string;
  privateKeyPath: string;
  devPath: string;
  buildPath: string;
}[];

export type UploadStatusItem = {
  name: string;
  status: UploadStatus;
};

// 上传记录类型定义
export type UploadRecord = {
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
  errorMessage?: string;
  type: string;
};

/**
 * 获取小程序列表
 * @param type 小程序类型，默认为 MiniProgramType.CloudOutpatientMp
 */
export const requestGetCloudOutpatientMpList = (
  type: string = MiniProgramType.CloudOutpatientMp
) => {
  return request.get<CloudOutpatientMpList>("/api/users/get-project-list", {
    params: { type },
  });
};

/**
 * 获取上传状态列表
 * @param type 小程序类型，默认为 MiniProgramType.CloudOutpatientMp
 */
export const requestGetUploadStatuses = (
  type: string = MiniProgramType.CloudOutpatientMp
) => {
  return request.get<UploadStatusItem[]>("/api/users/get-upload-statuses", {
    params: { type },
  });
};

/**
 * 上传小程序
 * @param name 项目名称
 * @param mode 上传模式
 * @param type 小程序类型，默认为 MiniProgramType.CloudOutpatientMp
 */
export const requestUploadMiniProgram = (
  name: string,
  mode: "test" | "pro",
  type: string = MiniProgramType.CloudOutpatientMp
) => {
  return request.get("/api/users/upload-mini-program", {
    params: { name, mode, type },
  });
};

/**
 * 获取上传记录
 * @param page 页码
 * @param size 每页大小
 * @param type 小程序类型，默认为 MiniProgramType.CloudOutpatientMp
 */
export const requestGetUploadRecords = (
  page: number,
  size: number,
  type: string = MiniProgramType.CloudOutpatientMp
) => {
  return request.get<{
    list: unknown[];
    pagination: {
      page: number;
      size: number;
      total: number;
    };
  }>("/api/users/get-upload-records", {
    params: { page, size, type },
  });
};
