# Atlas

个人时间轴。React 前端 + Hono API，账号、会话和日程统一保存在 PostgreSQL。

## 开发

需要 Node.js 22.15+、npm，以及 PostgreSQL 17+（如 Supabase）。

1. 将根目录 `.env.example` 复制为 `.env`，设置数据库连接串 `DATABASE_URL`。不要提交真实凭据。
2. 执行 `npm install`。
3. 分别执行 `npm run dev:api` 和 `npm run dev:web`，打开 `http://localhost:5173`。Vite 的 `/api` 代理保持浏览器请求同源。

API 启动时检查连接并创建 PostgreSQL 表，数据库不可用则退出，不会回退到 SQLite。
旧 `apps/api/data/` SQLite 文件及附属文件保持原样，不读取、不导入、不删除。旧账号不迁移，请重新注册；不再预置演示管理员。

## 登录

- 用户名 2–30 位字母、数字、中文、下划线或连字符，大小写不敏感；密码 8–128 位。
- 注册成功自动登录；浏览器使用 HttpOnly、SameSite=Lax Cookie，数据库仅保存会话令牌的 SHA-256 摘要，会话有效期 30 天。
- 修改密码需原密码，成功后撤销全部设备会话并重新登录。暂不提供邮件验证或忘记密码。
- 所有日程查询、修改和删除都按当前用户隔离。网络故障显示重试；退出只有服务端撤销成功才清除前端状态。
- 登录/注册采用每分钟 60 次的进程级共享限流，单进程小规模部署使用；多实例部署应替换成共享存储限流并明确可信代理边界。

## 生产

设置 `NODE_ENV=production` 和 HTTPS `APP_ORIGIN`，在同一站点反代 `/api` 到 API。生产 Cookie 使用 Secure。
写请求必须携带匹配 `APP_ORIGIN` 的 Origin；不支持任意跨域前端，不开放 wildcard CORS。开发额外允许 `http://127.0.0.1:5173`。
PostgreSQL 使用独立账号、最小权限及定期备份。

## 验证

- `npm test`：前后端单元测试，无真实 PG 配置时集成测试会明确跳过。
- `npm run build`：前端类型检查和打包。
- `npx tsc -p apps/api/tsconfig.json --noEmit`：后端类型检查。
- 设置 `TEST_DATABASE_URL` 后执行 `npm run test -w @atlas/api`：真实 PG 用户隔离、CRUD、修改密码与会话撤销测试。必须使用独立的、名称以 `_test` 结尾的数据库，不能指向应用数据库；测试清理仅删除自身创建的用户。