import {
  Table,
  type TableProps,
  ConfigProvider,
  Empty,
  type GetProp,
} from "antd";
import { useEffect, useState, useRef } from "react";
import styles from "./index.module.scss";

type MyTableProps<T> = TableProps<T>;

/* 空数据组件 */
const renderEmpty: GetProp<typeof ConfigProvider, "renderEmpty"> = () => {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description="暂无数据"
      style={{
        margin: "auto",
        padding: "40px 0",
      }}
    />
  );
};

/* 表格组件 */
function MyTableComponent<T extends object = object>(props: MyTableProps<T>) {
  const [headerHeight, setHeaderHeight] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (tableRef.current) {
        const headerElement =
          tableRef.current.querySelector(".ant-table-thead");
        if (headerElement) {
          setHeaderHeight(headerElement.clientHeight);
        }
      }
    };

    updateHeaderHeight();
    // 监听窗口大小变化，重新计算表头高度
    window.addEventListener("resize", updateHeaderHeight);

    // 组件卸载时执行
    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  return (
    <ConfigProvider renderEmpty={renderEmpty}>
      <div
        className={styles.tableBox}
        ref={tableRef}
        style={{ minHeight: "300px" }}
      >
        {(() => {
          const hasData = props.dataSource && props.dataSource.length > 0;
          return (
            <Table<T>
              {...props}
              scroll={
                hasData
                  ? {
                      x: true,
                      y: headerHeight
                        ? `calc(100% - ${headerHeight}px)`
                        : "100%",
                    }
                  : undefined
              }
              tableLayout={hasData ? "fixed" : undefined}
            />
          );
        })()}
      </div>
    </ConfigProvider>
  );
}

MyTableComponent.displayName = "MyTable";

const MyTable = MyTableComponent as <T extends object = object>(
  props: MyTableProps<T>
) => React.ReactElement;

export default MyTable;
