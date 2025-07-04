import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // 允许外部访问，显示所有网络接口的IP地址
    port: 5173, // 默认端口
    cors: true, // 启用CORS
    hmr: {
      overlay: true, // 启用热更新覆盖层
    },
  },
});
