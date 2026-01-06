# ZuanAbuse

一个极简的“词条随机 + 自动复制”小站，支持 `min / max / 无所谓` 三档输出。

## 功能
- 按等级随机抽取词条并自动复制到剪贴板
- 记录最近 10 条历史，支持回头复制（默认隐藏）
- 简洁但有未来感的单页 UI

## 数据库
- 表：`zuan`
- 字段：`id` / `text` / `level`
- `level` 取值：`min` / `max`

## SQL
`sql/zuan.sql` 包含表结构与种子数据，可直接导入：

```bash
mysql -u root -p <DB_NAME> < sql/zuan.sql
```

## 启动
安装依赖：

```bash
pnpm install
```

配置环境变量（不要提交 `.env`）：

```bash
NUXT_DB_HOST=localhost
NUXT_DB_USER=root
NUXT_DB_PASSWORD=你的密码
NUXT_DB_DATABASE=你的数据库名
```

启动开发服务：

```bash
pnpm dev --host 127.0.0.1 --port 3000
```

## 接口
`GET /api/zuan?level=all|min|max`

## 备注
- 运行时配置位于 `nuxt.config.ts`，但敏感信息请放在环境变量里。
