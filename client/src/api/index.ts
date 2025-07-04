import { request } from "./request";
import { UploadStatus } from "../constants/enum";

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
};

/**
 * 获取患者端小程序列表
 */
export const requestGetCloudOutpatientMpList = () => {
  return request.get<CloudOutpatientMpList>("/api/users/get-project-list");
};

/**
 * 获取上传状态列表
 */
export const requestGetUploadStatuses = () => {
  return request.get<UploadStatusItem[]>("/api/users/get-upload-statuses");
};

/**
 * 上传小程序
 */
export const requestUploadMiniProgram = (
  name: string,
  mode: "test" | "pro"
) => {
  return request.get("/api/users/upload-mini-program", {
    params: { name, mode },
  });
};

/**
 * 获取上传记录
 */
export const requestGetUploadRecords = (page: number, size: number) => {
  return request.get<{
    list: unknown[];
    pagination: {
      page: number;
      size: number;
      total: number;
    };
  }>("/api/users/get-upload-records", {
    params: { page, size },
  });
};
