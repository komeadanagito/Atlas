# Atlas

个人时间轴。健身、学习等是独立功能，先不做。

```
apps/web          前端
apps/api          时间轴 API（SQLite）
packages/shared   共用类型
```

## 开发

```bash
npm install
npm run dev:api
npm run dev:web
```

浏览器打开 Vite 提示的地址。时间轴数据来自 `apps/api/data/atlas.sqlite`。