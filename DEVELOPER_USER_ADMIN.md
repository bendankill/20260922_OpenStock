# 本地开发者用户管理指南

本文档说明如何在本地 Docker 环境中管理 OpenStock 的用户数据（查看账号、重置密码、重命名、删除等）。

> 注意：本工具仅限本机命令行使用，没有 HTTP 接口，也没有网页后台，不支持远程调用。

## 1. MongoDB 用户数据结构

OpenStock 使用 Better Auth 管理认证，数据存储在本机 MongoDB（Docker 容器 `mongodb`，库名 `openstock`）。

| 集合 | 说明 |
|---|---|
| `user` | 用户主记录：`_id`（ObjectId，适配器视图中的 `id` 字符串 = `_id` 的字符串形式）、`username`（规范化登录账号）、`displayUsername`（显示名称）、`name`、`email`（内部合成邮箱）、`createdAt` 等 |
| `account` | 认证账户记录：`userId`（**ObjectId**）、`providerId=credential`、`password`（**密码哈希**）、`accountId` 等 |
| `session` | 登录会话：`userId`（**ObjectId**）、`token`（哈希）、`expiresAt` 等 |
| `watchlists` | 自选股：`userId`（**字符串**）、`symbol`、`company`、`addedAt` |
| `alerts` | 价格提醒：`userId`（**字符串**）、`symbol`、`targetPrice`、`condition`、`active`、`triggered`、`expiresAt` |

> 注意：`user`/`account`/`session` 是 Better Auth 管理的集合，原始文档中以 ObjectId 关联；`watchlists`/`alerts` 是 Mongoose 模型，`userId` 为字符串。用 mongosh 手动查询时要注意这个差异（admin-user.mjs 已自动处理）。

### 账号（Account）规则

- 长度 2-32 个字符；只允许：中文、英文字母（A-Z/a-z）、数字（0-9）
- 禁止：空格、下划线、连字符、`@` 及其他符号
- 注册时：先 trim 首尾空白，再做 NFKC Unicode 归一化，英文字母转小写用于登录唯一性判断（`Alice`、`alice`、`ALICE` 视为同一账号），中文保持原样
- `username` = 规范化后的登录账号；`displayUsername` = 用户注册时输入的原样显示名称
- 内部合成邮箱：`SHA-256(规范化账号)@local.openstock.invalid`，同一账号永远得到同一个值；不暴露在 UI，不作为真实邮箱使用，也不会向它发送任何邮件

### credential 密码哈希

- 密码以 **scrypt 哈希** 形式保存在 `account.password`（格式：`盐:哈希`，与 Better Auth 1.3.25 完全一致）
- 哈希参数：N=16384、r=16、p=1、dkLen=64；密码在哈希前会做 NFKC 归一化
- **数据库绝不保存明文密码**。任何人都无法从哈希反推出原始密码——所以管理员的"重置密码"是设置新密码，而不是"查看旧密码"

## 2. 进入容器执行命令

```bash
docker compose exec openstock node scripts/admin-user.mjs <命令>
```

（在项目根目录 `D:\test\20260922_OpenStock` 下执行 docker compose 命令）

## 3. 命令说明

### list —— 列出所有账号

```bash
docker compose exec openstock node scripts/admin-user.mjs list
```

显示：Account（登录账号）、Display Name（显示名称）、User ID、创建时间。**不输出密码。**

### show —— 查看单个账号详情

```bash
docker compose exec openstock node scripts/admin-user.mjs show Alice
```

显示：`user` 记录、`account` credential 记录（密码只显示哈希，并标记 `PASSWORD HASH - NOT PLAINTEXT`）、session 数量、watchlist 数量、alert 数量。

### reset-password —— 强制重置密码（最重要）

```bash
docker compose exec openstock node scripts/admin-user.mjs reset-password Alice NewPassword123
```

不需要知道旧密码。执行后：

1. 使用与 Better Auth 1.3.25 完全兼容的 scrypt 哈希函数生成新哈希
2. 写入 `account.password`，更新 `updatedAt`
3. 删除该用户所有 session（旧密码立即失效）
4. 自动校验新哈希可被正确验证

### rename —— 修改账号

```bash
docker compose exec openstock node scripts/admin-user.mjs rename Alice AliceNew
```

同步更新：`username`、`displayUsername`、`name`、内部合成邮箱。重命名前会校验新账号格式与唯一性。重命名后旧账号不能登录，新账号正常登录，显示名称同步变化。

### delete —— 删除账号（高危，必须 --yes）

```bash
docker compose exec openstock node scripts/admin-user.mjs delete Alice --yes
```

按 userId 清理：`user`、`account`、`session`、`watchlists`、`alerts`。不误删其他用户数据。缺少 `--yes` 会拒绝执行。

## 4. 直接使用 mongosh 查看数据库

保留 MongoDB root 管理能力（本地专用：root / example）：

```bash
docker compose exec mongodb mongosh -u root -p example --authenticationDatabase admin
```

常用查询：

```js
use openstock
db.user.find()
db.account.find({providerId: "credential"})
db.session.countDocuments()
db.watchlists.find()
db.alerts.find()
```

## 5. 为什么不能读取原始密码

`account.password` 存的是 scrypt 单向哈希。哈希不可逆，这是认证系统的正确设计。作为开发者，你拥有的不是"查看用户旧密码"的能力，而是"强制重置密码"的最高权限——请使用 `reset-password` 命令。

## 6. 安全提醒

- 不要把 `account.password` 直接改成明文：Better Auth 登录时校验的是哈希，改成明文会导致登录失败
- 不要在文档、日志、代码里记录真实密码或 Secret
- `root / example` 仅限本机开发使用，请勿将 27017 端口暴露到公网
