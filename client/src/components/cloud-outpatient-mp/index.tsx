import { Button, Form, Select, Skeleton, Tabs, Tag } from "antd";
import styles from "./index.module.scss";
import { useState, useEffect } from "react";
import MyTable from "../my-table";
import {
  requestGetCloudOutpatientMpList,
  requestGetUploadStatuses,
  requestUploadMiniProgram,
  type CloudOutpatientMpList,
  type UploadStatus,
  type UploadStatusItem,
} from "../../api";
import { CloudUploadOutlined } from "@ant-design/icons";

type Form = {
  mode: "test" | "pro";
};

// 表格列表
const List: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<CloudOutpatientMpList>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatusItem[]>([]);
  const timer: unknown = null;

  // 获取上传状态
  const getUploadStatuses = () => {
    requestGetUploadStatuses().then((res) => {
      setUploadStatus(res);
    });
  };

  // 轮询获取上传状态
  const loopGetUploadStatus = () => {
    getUploadStatuses();
    console.log("timer", timer);
    // timer = setInterval(() => {
    //   getUploadStatuses();
    // }, 3000);
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
      render: (
        value: unknown,
        record: CloudOutpatientMpList[0],
        index: number
      ) => {
        const status = uploadStatus.find(
          (item) => item.index === index
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
            onClick={() => requestUploadMiniProgram(record.name, form.mode)}
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
            onClick={() => requestUploadMiniProgram(record.name, form.mode)}
          >
            上传失败
          </Button>
        );

        const returnStatus = (status: UploadStatus) => {
          if (status === "loading") return loading;
          if (status === "pending") return pending;
          if (status === "fail") return fail;
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
  return <div>上传记录</div>;
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
