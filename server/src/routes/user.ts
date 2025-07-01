import Router from "koa-router";
// import { Context } from "koa";
import { getAllSubProjectInfo } from "../utils/read-project-list";
import { ResponseCode } from "../constants/enum";

// 用户路由
const userRoutes = new Router({
  prefix: "/api/users", // 路由前缀
});

// 获取项目列表
userRoutes.get("/get-project-list", async (ctx) => {
  const info = getAllSubProjectInfo();
  ctx.body = {
    code: ResponseCode.Success,
    message: "success",
    data: info,
  };
});

export { userRoutes };
