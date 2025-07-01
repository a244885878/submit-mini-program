import Router from "koa-router";
// import { Context } from "koa";

// 创建用户路由
const userRoutes = new Router({
  prefix: "/api/users", // 路由前缀
});

// 获取患者端小程序列表
// userRoutes.get("/getUsers", async (ctx: Context) => {
//   try {
//     ctx.body = {
//       success: true,
//       data: users,
//       message: "获取用户列表成功",
//     };
//   } catch (error) {
//     ctx.status = 500;
//     ctx.body = {
//       success: false,
//       message: "获取用户列表失败",
//       error: error instanceof Error ? error.message : "未知错误",
//     };
//   }
// });

export { userRoutes };
