import { request } from "./request";

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

export type UploadStatus =
  | "complete"
  | "loading"
  | "fail"
  | "success"
  | "pending";

export type UploadStatusItem = {
  index: number;
  name: string;
  status: UploadStatus;
  message?: string;
  timestamp: number;
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
