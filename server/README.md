# Koa TypeScript 服务器

这是一个使用 Koa 和 TypeScript 构建的 RESTful API 服务器。

## 项目结构

```
server/
├── src/
│   ├── index.ts          # 入口文件
│   ├── config/           # 配置管理
│   │   └── env.ts        # 环境配置
│   ├── database/         # 数据库相关
│   │   └── connection.ts # 数据库连接
│   └── routes/           # 路由文件
│       └── user.ts       # 用户路由示例
├── package.json
├── tsconfig.json
├── env.example           # 环境变量示例
├── .env                  # 环境变量文件（需要创建）
└── README.md
```

## 安装依赖

```bash
cd server
npm install
```

## 运行项目

### 开发模式

```bash
npm run dev
```

### 监听模式（自动重启）

```bash
npm run watch
```

### 生产模式

```bash
npm run build
npm start
```

## API 接口

### 根路径

- `GET /` - 欢迎信息

### 用户接口

- `GET /api/users` - 获取所有用户
- `GET /api/users/:id` - 根据 ID 获取用户
- `POST /api/users` - 创建新用户
- `PUT /api/users/:id` - 更新用户信息
- `DELETE /api/users/:id` - 删除用户

## 示例请求

### 创建用户

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "王五", "email": "wangwu@example.com"}'
```

### 获取所有用户

```bash
curl http://localhost:3000/api/users
```

### 获取特定用户

```bash
curl http://localhost:3000/api/users/1
```

## 环境配置

### 1. 复制环境变量示例文件

```bash
cp env.example .env
```

### 2. 编辑 .env 文件

根据你的实际环境修改配置：

```env
# 服务器配置
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=koa_ts_demo
DB_USER=root
DB_PASSWORD=your_password

# 可选：其他配置
NODE_ENV=development
LOG_LEVEL=info
```

### 3. 环境变量说明

- `PORT` - 服务器端口（默认：3000）
- `DB_HOST` - 数据库主机（默认：localhost）
- `DB_PORT` - 数据库端口（默认：3306）
- `DB_NAME` - 数据库名称（默认：koa_ts_demo）
- `DB_USER` - 数据库用户名（默认：root）
- `DB_PASSWORD` - 数据库密码（默认：空）
- `NODE_ENV` - 运行环境（默认：development）
- `LOG_LEVEL` - 日志级别（默认：info）

### 4. 配置验证

启动服务器时会自动验证环境配置，如果缺少必要的环境变量会显示警告信息。

## 技术栈

- **Koa** - Node.js Web 框架
- **TypeScript** - 类型安全的 JavaScript
- **koa-router** - 路由中间件
- **koa-bodyparser** - 请求体解析
- **koa-cors** - 跨域支持
