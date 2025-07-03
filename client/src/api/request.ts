import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { message } from "antd";

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
  timeout: 1000 * 60 * 30,
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
    if (data.code === 200) {
      return response;
    }

    // 否则显示错误信息
    message.error(data.message || "请求失败");
    return Promise.reject(new Error(data.message || "请求失败"));
  },
  (error) => {
    // 处理网络错误等
    const errorMessage =
      error.response?.data?.message || error.message || "网络错误";
    message.error(errorMessage);
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
