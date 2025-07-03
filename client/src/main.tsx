import { createRoot } from "react-dom/client";
import "./index.scss";
import App from "./App.tsx";
import { App as AntdApp } from "antd";

createRoot(document.getElementById("root")!).render(
  <AntdApp>
    <App />
  </AntdApp>
);
