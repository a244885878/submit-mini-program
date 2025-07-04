import { Button, Form, Select, Skeleton, Tabs, Tag, App, Tooltip } from "antd";
import styles from "./index.module.scss";
import { useState, useEffect } from "react";
import MyTable from "../my-table";
import {
  requestGetCloudOutpatientMpList,
  requestGetUploadRecords,
  requestGetUploadStatuses,
  requestUploadMiniProgram,
  type CloudOutpatientMpList,
  type UploadStatusItem,
  type UploadRecord,
} from "../../api";

import { CloudUploadOutlined } from "@ant-design/icons";
import { UploadStatus } from "../../constants/enum";

type Form = {
  mode: "test" | "pro";
};

// 表格列表
const List: React.FC = () => {
  let timer: unknown = null;
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<CloudOutpatientMpList>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatusItem[]>([]);
  const { message } = App.useApp();
  const [awaitList, setAwaitList] = useState<string[]>([]);

  // 获取上传状态
  const getUploadStatuses = () => {
    requestGetUploadStatuses().then((res) => {
      setUploadStatus(res);
      res.forEach((item) => {
        if (item.status === UploadStatus.Success) {
          message.success(`${item.name}上传成功`);
        }
      });

      // 处理等待队列
      setAwaitList((currentAwaitList) => {
        const newAwaitList = [...currentAwaitList];
        const buildingCount = res.filter(
          (item) => item.status === UploadStatus.Building
        ).length;
        const availableSlots = 3 - buildingCount;
        const itemsToProcess = Math.min(availableSlots, newAwaitList.length);

        if (itemsToProcess > 0) {
          console.log(
            `处理等待队列: 当前构建中=${buildingCount}个, 可用槽位=${availableSlots}, 处理项目数=${itemsToProcess}`
          );
        }

        for (let i = 0; i < itemsToProcess; i++) {
          const nextItem = newAwaitList.shift()!;
          console.log(`开始上传等待队列中的项目: ${nextItem}`);
          // 立即执行上传
          requestUploadMiniProgram(nextItem, form.mode);
        }

        return newAwaitList;
      });
    });
  };

  // 轮询获取上传状态
  const loopGetUploadStatus = () => {
    getUploadStatuses();
    timer = setInterval(() => {
      getUploadStatuses();
    }, 2000);
  };

  useEffect(() => {
    setLoading(true);
    // 获取小程序列表
    requestGetCloudOutpatientMpList()
      .then((res) => {
        setList(res);
      })
      .finally(() => {
        setLoading(false);
      });
    loopGetUploadStatus();
    return () => {
      clearInterval(timer as number);
    };
  }, []);

  // 上传
  const handleUpload = (name: string, mode: Form["mode"]) => {
    const buildingCount = uploadStatus.filter(
      (item) => item.status === UploadStatus.Building
    ).length;
    if (buildingCount >= 3) {
      console.log(`构建队列已满(${buildingCount}个)，将 ${name} 加入等待队列`);
      setAwaitList((prev) => [...prev, name]);
      return;
    }
    console.log(`直接上传: ${name}，当前构建中: ${buildingCount}个`);
    requestUploadMiniProgram(name, mode);
    getUploadStatuses();
  };

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      minWidth: 300,
    },
    {
      title: "机构名称",
      dataIndex: "orgName",
      key: "orgName",
      minWidth: 300,
    },
    {
      title: "版本号",
      dataIndex: "version",
      key: "version",
      minWidth: 200,
      render: (text: string) => {
        return <Tag color="blue">{text}</Tag>;
      },
    },
    {
      title: "操作",
      dataIndex: "handle",
      key: "handle",
      width: 200,
      fixed: "right" as const,
      render: (value: unknown, record: CloudOutpatientMpList[0]) => {
        const status = uploadStatus.find(
          (item) => item.name === record.name
        )?.status;

        const loading = (
          <Button type="primary" icon={<CloudUploadOutlined />} loading>
            上传中
          </Button>
        );
        const pending = (
          <Button type="primary" icon={<CloudUploadOutlined />} loading>
            队列中
          </Button>
        );
        const upload = (
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={() => handleUpload(record.name, form.mode)}
          >
            上传
          </Button>
        );
        const fail = (
          <Button
            type="primary"
            color="danger"
            icon={<CloudUploadOutlined />}
            danger
            onClick={() => handleUpload(record.name, form.mode)}
          >
            上传失败
          </Button>
        );

        const returnStatus = (status: UploadStatus) => {
          if (awaitList.includes(record.name)) return pending;
          if (status === UploadStatus.Building) return loading;
          if (status === UploadStatus.Fail) return fail;
          return upload;
        };

        return <>{returnStatus(status as UploadStatus)}</>;
      },
    },
  ];

  const uploadEnvOptions = [
    { value: "test", label: <span>test</span> },
    { value: "pro", label: <span>pro</span> },
  ];
  const [form, setForm] = useState<Form>({
    mode: "test",
  });

  return (
    <>
      {loading ? (
        <Skeleton active paragraph={{ rows: 20 }} />
      ) : (
        <>
          <Form
            name="basic"
            initialValues={{
              mode: "test",
            }}
            autoComplete="off"
            layout="inline"
          >
            <Form.Item label="分支" name="branch" rules={[{ required: true }]}>
              <span style={{ color: "#999" }}>development</span>
            </Form.Item>
            <Form.Item
              label="上传环境"
              name="mode"
              rules={[{ required: true, message: "请选择上传环境" }]}
            >
              <Select
                options={uploadEnvOptions}
                style={{ width: 150 }}
                onChange={(value) => setForm({ ...form, mode: value })}
              />
            </Form.Item>
          </Form>
          <MyTable
            style={{ marginTop: 10 }}
            columns={columns}
            dataSource={list}
            pagination={false}
            rowKey="appid"
            tableLayout="auto"
          />
        </>
      )}
    </>
  );
};

// 上传记录
const Records: React.FC = () => {
  const [list, setList] = useState<UploadRecord[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    size: number;
    total: number;
  }>({
    page: 1,
    size: 20,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      minWidth: 200,
    },
    {
      title: "机构名称",
      dataIndex: "orgName",
      key: "orgName",
      minWidth: 200,
    },
    {
      title: "最后提交人",
      dataIndex: "lastCommitUser",
      key: "lastCommitUser",
      width: 150,
    },
    {
      title: "提交commit",
      dataIndex: "commit",
      key: "commit",
      minWidth: 200,
      ellipsis: true, // 省略显示
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "上传时间",
      dataIndex: "uploadTime",
      key: "uploadTime",
      minWidth: 200,
    },
    {
      title: "上传环境",
      dataIndex: "mode",
      key: "mode",
      width: 150,
    },
    {
      title: "上传状态",
      dataIndex: "status",
      key: "status",
      minWidth: 150,
      render: (text: string, record: UploadRecord) => {
        return (
          <>
            {text === UploadStatus.Fail ? (
              <Tooltip
                title={
                  text === UploadStatus.Fail
                    ? "失败原因：" + record.errorMessage || "未知原因"
                    : ""
                }
              >
                <Tag color="red">失败</Tag>
              </Tooltip>
            ) : (
              <Tag color="green">成功</Tag>
            )}
          </>
        );
      },
    },
    {
      title: "上传版本号",
      dataIndex: "version",
      key: "version",
      width: 150,
      render: (text: string) => {
        return <Tag color="blue">{text}</Tag>;
      },
    },
  ];

  const getRecords = (page?: number, size?: number) => {
    const currentPage = page ?? pagination.page;
    const currentSize = size ?? pagination.size;
    setLoading(true);
    requestGetUploadRecords(currentPage, currentSize)
      .then((res) => {
        setList(res.list as UploadRecord[]);
        setPagination({
          page: res.pagination.page,
          size: res.pagination.size,
          total: res.pagination.total,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getRecords();
  }, []);

  return (
    <>
      {loading ? (
        <Skeleton active paragraph={{ rows: 20 }} />
      ) : (
        <MyTable
          style={{ marginTop: 10 }}
          columns={columns}
          dataSource={list}
          rowKey="id"
          tableLayout="auto"
          pagination={{
            current: pagination.page,
            pageSize: pagination.size,
            total: pagination.total,
            onChange: (page, size) => {
              setPagination({ page, size, total: pagination.total });
              getRecords(page, size);
            },
          }}
        />
      )}
    </>
  );
};

const CloudOutpatientMp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>("1");
  const items = [
    { key: "1", label: "小程序列表", component: <List /> },
    { key: "2", label: "上传记录", component: <Records /> },
  ];

  return (
    <div className={styles.tabBox}>
      <Tabs
        className={styles.tabList}
        defaultActiveKey="1"
        items={items}
        onChange={(key) => setCurrentTab(key)}
      />
      <div className={styles.contentBox}>
        {items.find((item) => item.key === currentTab)?.component}
      </div>
    </div>
  );
};

export default CloudOutpatientMp;
