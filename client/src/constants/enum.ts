export enum ResponseCode {
  /**
   * 成功
   */
  Success = 200,
  /**
   * 失败
   */
  Error = 500,
}

export enum UploadStatus {
  /**
   * 队列中
   */
  Pending = "pending",
  /**
   * 构建中
   */
  Building = "building",
  /**
   * 构建成功
   */
  Success = "success",
  /**
   * 构建失败
   */
  Fail = "fail",
}

export enum MiniProgramType {
  /**
   * 云门诊患者端小程序
   */
  CloudOutpatientMp = "cloud-outpatient-mp",
  /**
   * 云商城小程序
   */
  CloudMallMp = "cloud-mall-mp",
}
