import { useEffect, useRef, useState } from "react";
import type { UploadStatusItem } from "../api";

export const useSSE = (url: string) => {
  const [data, setData] = useState<UploadStatusItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const connectSSE = () => {
      try {
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const parsedData = JSON.parse(event.data);
            if (parsedData.type === "init" || parsedData.type === "update") {
              setData(parsedData.data);
            }
          } catch (parseError) {
            console.error("解析SSE数据失败:", parseError);
          }
        };

        eventSource.onerror = (event) => {
          console.error("SSE连接错误:", event);
          setIsConnected(false);
          setError("连接失败，正在重连...");

          // 自动重连
          setTimeout(() => {
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              connectSSE();
            }
          }, 3000);
        };

        return () => {
          eventSource.close();
        };
      } catch {
        setError("无法建立SSE连接");
        setIsConnected(false);
      }
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [url]);

  return { data, isConnected, error };
};
