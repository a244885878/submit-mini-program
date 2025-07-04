import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { message } from "antd";
import { ResponseCode } from "../constants/enum";

export const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// 定义响应数据接口
interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

// 创建 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || baseURL,
  timeout: 1000 * 60 * 5,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token 等认证信息
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response;

    // 如果 code === 200，返回 data
    if (data.code === ResponseCode.Success) {
      return response;
    }

    // 否则显示错误信息
    message.error(data.message || "请求失败");
    return Promise.reject(new Error(data.message || "请求失败"));
  },
  (error) => {
    // 处理网络错误等
    let errorMessage = "网络错误";

    if (
      error.code === "ECONNREFUSED" ||
      error.message.includes("Network Error")
    ) {
      errorMessage = "服务器连接失败，请检查服务器是否正常运行";
    } else if (error.response?.status === 500) {
      errorMessage = "服务器内部错误，请稍后重试";
    } else if (error.response?.status === 404) {
      errorMessage = "请求的资源不存在";
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // 只有在非静默模式下才显示错误消息
    if (!error.config?.silent) {
      message.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// 封装请求方法
export const request = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return instance.get(url, config).then((response) => response.data.data);
  },

  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return instance
      .post(url, data, config)
      .then((response) => response.data.data);
  },

  put: <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return instance
      .put(url, data, config)
      .then((response) => response.data.data);
  },

  delete: <T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return instance.delete(url, config).then((response) => response.data.data);
  },

  patch: <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return instance
      .patch(url, data, config)
      .then((response) => response.data.data);
  },
};

// 导出 axios 实例，以便需要时直接使用
export default instance;
