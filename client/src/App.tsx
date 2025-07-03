import { Menu } from "antd";
import styles from "./app.module.scss";
import { WechatOutlined } from "@ant-design/icons";
import { useState } from "react";
import CloudOutpatientMp from "./components/cloud-outpatient-mp";
import CloudMallMp from "./components/cloud-mall-mp";

const App: React.FC = () => {
  const [currentMenu, setCurrentMenu] = useState<string>("1");

  const menuItems = [
    {
      label: "云门诊患者端小程序",
      key: "1",
      icon: <WechatOutlined />,
      component: <CloudOutpatientMp />,
    },
    {
      label: "云商城小程序",
      key: "2",
      icon: <WechatOutlined />,
      component: <CloudMallMp />,
    },
  ];

  return (
    <div className={styles.appBox}>
      <Menu
        className={styles.menuBox}
        defaultSelectedKeys={["1"]}
        mode="inline"
        items={menuItems}
        onClick={(e) => setCurrentMenu(e.key)}
      />
      <div className={styles.contentBox}>
        {menuItems.find((item) => item.key === currentMenu)?.component}
      </div>
    </div>
  );
};

export default App;
