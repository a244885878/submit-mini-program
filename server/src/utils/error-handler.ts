import { Context, Next } from "koa";
import { ResponseCode } from "../constants/enum";

/**
 * 错误处理中间件
 * 统一处理接口错误，返回标准格式的错误响应
 */
export const errorHandler = async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error("接口错误:", error);

    // 设置状态码
    ctx.status = 500;

    // 返回标准错误格式
    ctx.body = {
      code: ResponseCode.Error,
      message: error instanceof Error ? error.message : "未知错误",
      data: null,
    };
  }
};
