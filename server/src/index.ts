import dotenv from "dotenv";
import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import cors from "koa-cors";
import { userRoutes } from "./routes";
import { errorHandler } from "./utils/error-handler";

// 加载环境变量
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

const app = new Koa();
const router = new Router();

// 中间件
app.use(cors());
app.use(bodyParser());
app.use(errorHandler);

// 路由
app.use(userRoutes.routes());
app.use(userRoutes.allowedMethods());

// 根路由
router.get("/", async (ctx) => {
  ctx.body = {
    message: "欢迎使用 submit-mini-program-server 服务器",
    timestamp: new Date().toISOString(),
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

// 错误处理
app.on("error", (err, ctx) => {
  console.error("服务器错误:", err);
});

async function startServer() {
  try {
    // 启动服务器
    app.listen(process.env.PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${process.env.PORT}`);
    });
  } catch (error) {
    console.error("启动服务器失败:", error);
    process.exit(1);
  }
}

startServer();
