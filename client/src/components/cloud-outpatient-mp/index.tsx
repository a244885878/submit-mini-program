import {
  Button,
  Form,
  Select,
  Skeleton,
  Tabs,
  Tag,
  App,
  Tooltip,
  Switch,
  Input,
  Alert,
} from "antd";
import styles from "./index.module.scss";
import { useState, useEffect } from "react";
import MyTable from "../my-table";
import {
  requestGetCloudOutpatientMpList,
  requestGetUploadRecords,
  requestGetUploadStatuses,
  requestUploadMiniProgram,
  requestUpdateVersion,
  type CloudOutpatientMpList,
  type UploadStatusItem,
  type UploadRecord,
} from "../../api";

import { CloudUploadOutlined } from "@ant-design/icons";
import { UploadStatus, MiniProgramType } from "../../constants/enum";

type Form = {
  mode: "test" | "pro";
  updateVersion: boolean;
  version?: string;
};

interface CloudOutpatientMpProps {
  type?: string;
}

// 表格列表
const List: React.FC<CloudOutpatientMpProps> = ({
  type = MiniProgramType.CloudOutpatientMp,
}) => {
  let timer: unknown = null;
  const [loading, setLoading] = useState<boolean>(false);
  const [list, setList] = useState<CloudOutpatientMpList>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatusItem[]>([]);
  const { message } = App.useApp();
  const [awaitList, setAwaitList] = useState<string[]>([]);
  const [formInstance] = Form.useForm();
  const [updateVersionLoading, setUpdateVersionLoading] =
    useState<boolean>(false);

  // 获取上传状态
  const getUploadStatuses = () => {
    requestGetUploadStatuses(type).then((res) => {
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
          // 立即执行上传，使用当前表单的mode
          requestUploadMiniProgram(nextItem, form.mode, type).catch((error) => {
            console.log(`队列项目上传失败: ${nextItem}`, error);
            // 上传失败时，从等待队列中移除
            setAwaitList((prev) => prev.filter((item) => item !== nextItem));
          });
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
    }, 4000);
  };

  // 上传
  const handleUpload = async (
    name: string,
    mode: Form["mode"],
    index: number
  ) => {
    try {
      setList((prev) => {
        const newList = [...prev];
        newList[index].loading = true;
        return newList;
      });

      // 检查是否已在等待队列中
      if (awaitList.includes(name)) {
        console.log(`${name} 已在等待队列中，跳过重复请求`);
        return;
      }

      // 先获取最新的上传状态，确保数据是最新的
      const latestStatuses = await requestGetUploadStatuses(type);
      const currentBuildingCount = latestStatuses.filter(
        (item) => item.status === UploadStatus.Building
      ).length;

      if (currentBuildingCount >= 3) {
        console.log(
          `构建队列已满(${currentBuildingCount}个)，将 ${name} 加入等待队列`
        );
        setAwaitList((prev) => [...prev, name]);
        return;
      }

      console.log(`直接上传: ${name}，当前构建中: ${currentBuildingCount}个`);
      await requestUploadMiniProgram(name, mode, type);
      getUploadStatuses();
    } catch (error) {
      console.log("上传失败:", error);
      // 上传失败时，从等待队列中移除（如果存在）
      setAwaitList((prev) => prev.filter((item) => item !== name));
    } finally {
      setList((prev) => {
        const newList = [...prev];
        newList[index].loading = false;
        return newList;
      });
    }
  };

  // 更新版本号
  const handleUpdateVersion = async () => {
    try {
      setUpdateVersionLoading(true);
      if (form.version === list[0]?.version) {
        message.warning("版本号不能与当前版本号相同");
        return;
      }
      await formInstance.validateFields();
      await requestUpdateVersion(type, form.version!);
      getCloudOutpatientMpList();
      message.success("更新版本号成功");
    } catch (error) {
      console.log("更新版本号失败:", error);
    } finally {
      setUpdateVersionLoading(false);
    }
  };

  // 获取小程序列表
  const getCloudOutpatientMpList = () => {
    setLoading(true);
    requestGetCloudOutpatientMpList(type)
      .then((res) => {
        setList(res);
        // 设置默认版本号为列表第一项的版本号
        if (res.length > 0 && res[0].version) {
          setForm((prev) => ({
            ...prev,
            version: res[0].version,
          }));
          formInstance.setFieldsValue({
            version: res[0].version,
          });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getCloudOutpatientMpList();
    loopGetUploadStatus();
    return () => {
      if (timer) {
        clearInterval(timer as number);
      }
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
            onClick={() => handleUpload(record.name, form.mode, index)}
            loading={record.loading}
          >
            {record.loading ? "请求中" : "上传"}
          </Button>
        );
        const fail = (
          <Button
            type="primary"
            color="danger"
            icon={<CloudUploadOutlined />}
            danger
            onClick={() => handleUpload(record.name, form.mode, index)}
            loading={record.loading}
          >
            {record.loading ? "请求中" : "失败，重试"}
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
    updateVersion: false,
    version: undefined,
  });

  return (
    <>
      {loading ? (
        <Skeleton active paragraph={{ rows: 20 }} />
      ) : (
        <>
          <Form
            form={formInstance}
            name="basic"
            initialValues={{
              mode: "test",
              updateVersion: false,
            }}
            autoComplete="off"
            layout="inline"
            className={styles.form}
          >
            <div className={styles.formItem}>
              <Form.Item label="分支" name="branch">
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
                  onChange={(value) => {
                    setForm({ ...form, mode: value });
                    formInstance.setFieldsValue({ mode: value });
                  }}
                />
              </Form.Item>
            </div>
            <div className={styles.formItem}>
              <Form.Item label="更新版本号" name="updateVersion">
                <Switch
                  onChange={(checked) => {
                    setForm({ ...form, updateVersion: checked });
                    formInstance.setFieldsValue({ updateVersion: checked });
                  }}
                />
              </Form.Item>
              {form.updateVersion && (
                <div className={styles.formItem}>
                  <Form.Item
                    label="版本号"
                    name="version"
                    rules={[
                      { required: true, message: "请输入版本号" },
                      {
                        pattern: /^\d+\.\d+\.\d+$/,
                        message: "版本号格式必须为 x.y.z，如 2.5.0",
                      },
                    ]}
                  >
                    <Input
                      placeholder="请输入版本号"
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm({
                          ...form,
                          version: value,
                        });
                        // 同步到表单实例
                        formInstance.setFieldsValue({
                          version: value,
                        });
                      }}
                    />
                  </Form.Item>
                  <Button
                    type="primary"
                    onClick={() => handleUpdateVersion()}
                    loading={updateVersionLoading}
                  >
                    执行
                  </Button>
                </div>
              )}
            </div>
          </Form>
          <Alert
            message={`切换页面会初始化排队状态，上传时建议不要切换页面。当前等待队列: ${
              awaitList.length
            }个，构建中: ${
              uploadStatus.filter(
                (item) => item.status === UploadStatus.Building
              ).length
            }个`}
            type="warning"
            showIcon
            style={{ marginTop: 10 }}
          />
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
const Records: React.FC<CloudOutpatientMpProps> = ({
  type = MiniProgramType.CloudOutpatientMp,
}) => {
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
      width: 200,
      ellipsis: true, // 省略显示
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
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
    requestGetUploadRecords(currentPage, currentSize, type)
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
  }, [type]);

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

const CloudOutpatientMp: React.FC<CloudOutpatientMpProps> = ({
  type = MiniProgramType.CloudOutpatientMp,
}) => {
  const [currentTab, setCurrentTab] = useState<string>("1");
  const items = [
    { key: "1", label: "小程序列表", component: <List type={type} /> },
    { key: "2", label: "上传记录", component: <Records type={type} /> },
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
