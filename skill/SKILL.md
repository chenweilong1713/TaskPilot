---
name: taskpilot-skill
description: |
  管理和操作 TaskPilot 任务管理系统。当用户提到任务、待办、TaskPilot、任务管理、日程、统计、日历甘特图、创建任务、查询任务、更新任务、删除任务或任何与 TaskPilot 相关的操作时触发此 skill。支持任务的增删改查、按状态/优先级/标签/关键词/截止时间筛选、今日任务、统计分析（概况/饼图/趋势）、日历甘特图等功能。适用于个人任务管理、工作进度跟踪、日程规划等场景。
---

# TaskPilot Skill

通过 `curl` 与 TaskPilot 实例的 REST API 交互，管理你的任务和日程。所有接口需要 Bearer Token 鉴权。

## 配置

在使用 TaskPilot API 之前，需要配置实例地址和访问令牌。

### 环境变量

```bash
export TASKPILOT_URL="http://localhost:3000"
export TASKPILOT_TOKEN="your-bearer-token-here"
```

### 在 JavaScript 中读取配置

```js
const TASKPILOT_URL = process.env.TASKPILOT_URL;
const TASKPILOT_TOKEN = process.env.TASKPILOT_TOKEN;

if (!TASKPILOT_URL || !TASKPILOT_TOKEN) {
  console.error("请先设置 TASKPILOT_URL 和 TASKPILOT_TOKEN 环境变量");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${TASKPILOT_TOKEN}`,
  "Content-Type": "application/json",
};
```

### 验证配置

```bash
# 尝试获取任务列表，验证连接是否正常
curl -s "$TASKPILOT_URL/api/tasks?pageSize=1" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

如果返回正常的 JSON 数据，说明配置正确。

## 执行策略

处理任何 TaskPilot 相关请求时，默认遵循下面的实现方式：

1. 从环境变量读取 `TASKPILOT_URL` 和 `TASKPILOT_TOKEN`
2. 使用 `curl` 调用 TaskPilot API 完成所有操作
3. 解析 JSON 响应时，优先使用 `jq` 工具
4. 除非用户明确要求，否则不要改用其他工具

### 标准执行流程

#### 1. 读取环境变量

```bash
# 确保环境变量已设置
echo "TaskPilot 实例: $TASKPILOT_URL"
```

#### 2. 通用操作用 curl

所有接口统一使用以下 curl 格式：

```bash
curl -s -X <METHOD> "$TASKPILOT_URL/api/<endpoint>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN" \
  -d '<JSON_BODY>'
```

#### 3. JSON 解析用 jq

```bash
# 解析响应中的 ID
TASK_ID=$(echo "$RESPONSE" | jq -r '.id')

# 提取任务列表
echo "$RESPONSE" | jq -r '.items[] | "\(.id) \(.title) \(.status)"'
```

### 操作要求

- 所有请求必须携带 `Authorization: Bearer $TASKPILOT_TOKEN` 头
- POST/PUT 请求必须携带 `Content-Type: application/json` 头
- 创建任务时 `title`、`tag`、`status`、`priority` 为必填字段
- 更新任务使用 `PUT` 方法，支持部分更新（只传需要修改的字段）
- 如果要给用户展示"将如何执行"，优先展示 curl 命令

## 核心功能

### 1. 任务管理

#### 查询任务列表

- **端点**: GET `/api/tasks`
- **支持筛选、分页与排序**

```bash
curl -s "$TASKPILOT_URL/api/tasks?status=todo&priority=high&keyword=报告&tag=工作&due=today&page=1&pageSize=10&sort=desc" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

**查询参数：**

| 参数 | 类型 | 说明 | 可选值 |
|------|------|------|--------|
| `status` | string | 按状态筛选 | `todo`、`doing`、`done` |
| `priority` | string | 按优先级筛选 | `low`、`medium`、`high` |
| `keyword` | string | 按标题关键词搜索 | 自由文本 |
| `tag` | string | 按标签筛选 | 自由文本 |
| `due` | string | 预设截止时间范围 | `today`、`week`、`all`（默认） |
| `dueStart` | string | 自定义起始日期 | ISO 日期字符串 |
| `dueEnd` | string | 自定义结束日期 | ISO 日期字符串 |
| `page` | number | 页码 | 默认 `1`，最大 `9999` |
| `pageSize` | number | 每页条数 | 默认 `10`，最大 `50` |
| `sort` | string | 优先级排序方向 | `desc`（默认）、`asc` |

**响应说明：**

响应中包含以下关键字段：
- `items`: 任务数组，每个任务包含 `id`、`title`、`tag`、`status`、`priority`、`dueTime`、`startTime`、`reminderHours`、`reminded`、`createdAt`、`updatedAt`
- `total` / `page` / `pageSize` / `totalPages`: 分页信息
- `availableTags`: 所有可用标签列表
- `tagDistribution`: 标签分布统计（含 `label`、`count`、`percent`）
- `summary`: 概况统计（含 `total`、`completed`、`doing`、`todo`、`overdue`、`completionRate`）

#### 创建任务

- **端点**: POST `/api/tasks`
- **必填字段**: `title`（标题）、`tag`（标签）、`status`（状态）、`priority`（优先级）
- **可选字段**: `dueTime`（截止时间）、`startTime`（开始时间）、`reminderHours`（提前提醒小时数）

```bash
curl -s -X POST "$TASKPILOT_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN" \
  -d '{
    "title": "完成季度报告",
    "tag": "工作",
    "status": "todo",
    "priority": "high",
    "dueTime": "2026-06-20T18:00:00.000Z",
    "startTime": "2026-06-15T09:00:00.000Z",
    "reminderHours": 2
  }'
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 | 可选值 |
|------|------|------|------|--------|
| `title` | string | 是 | 任务标题 | 自由文本 |
| `tag` | string | 是 | 标签 | 自由文本 |
| `status` | string | 是 | 状态 | `todo`、`doing`、`done` |
| `priority` | string | 是 | 优先级 | `low`、`medium`、`high` |
| `dueTime` | string | 否 | 截止时间 | ISO 8601 格式或 `null` |
| `startTime` | string | 否 | 开始时间 | ISO 8601 格式或 `null` |
| `reminderHours` | number | 否 | 提前提醒小时数 | 大于 0 的整数或 `null` |

#### 更新任务

- **端点**: PUT `/api/tasks/{task_id}`
- 支持部分更新，只需传入需要修改的字段

```bash
curl -s -X PUT "$TASKPILOT_URL/api/tasks/<TASK_ID>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN" \
  -d '{
    "title": "完成季度报告 v2",
    "status": "doing"
  }'
```

#### 删除任务

- **端点**: DELETE `/api/tasks/{task_id}`

```bash
curl -s -X DELETE "$TASKPILOT_URL/api/tasks/<TASK_ID>" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

**响应：** `{"ok":true}`

#### 今日任务

- **端点**: GET `/api/tasks/today`
- 返回截止时间在当天（00:00–23:59）内的任务列表

```bash
curl -s "$TASKPILOT_URL/api/tasks/today" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

响应结构与 `GET /api/tasks` 一致（无分页）。

### 2. 统计分析

#### 概况统计

- **端点**: GET `/api/stats/summary`
- **参数**: `start`、`end` — ISO 日期字符串，按截止时间范围过滤（均为可选）

```bash
curl -s "$TASKPILOT_URL/api/stats/summary?start=2026-06-01&end=2026-06-30" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

**响应字段：** `total`（总数）、`completed`（已完成）、`uncompleted`（未完成）、`doing`（进行中）、`completionRate`（完成率，百分比数值）

#### 饼图数据（状态分布）

- **端点**: GET `/api/stats/pie`
- **参数**: `start`、`end` — ISO 日期字符串（均为可选）

```bash
curl -s "$TASKPILOT_URL/api/stats/pie?start=2026-06-01&end=2026-06-30" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

**响应：** 数组，每项包含 `status`（状态值）、`label`（中文标签）、`value`（数量）

#### 趋势数据（每日完成任务数）

- **端点**: GET `/api/stats/trend`

```bash
curl -s "$TASKPILOT_URL/api/stats/trend?days=7&start=2026-06-01&end=2026-06-07" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `days` | number | 回溯天数，`7`（默认）或 `30` |
| `start` | string | 自定义起始日期（ISO 格式） |
| `end` | string | 自定义结束日期（ISO 格式） |

**响应：** 数组，每项包含 `date`（日期）和 `completed`（当日完成任务数）

### 3. 日历甘特图

- **端点**: GET `/api/calendar`

```bash
curl -s "$TASKPILOT_URL/api/calendar?year=2026&month=6" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

**查询参数（均为可选，默认当前月份）：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `year` | number | 年份，如 `2026` |
| `month` | number | 月份（1–12） |

**响应字段：**
- `year` / `month`: 查询的年月
- `tasks`: 与指定月份有重叠的任务数组，跨天任务同时包含 `startTime` 和 `dueTime`

## 快速上手：任务增删改查完整流程

```bash
# 1) 创建任务
TASK=$(curl -s -X POST "$TASKPILOT_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN" \
  -d '{"title":"测试任务","tag":"个人","status":"todo","priority":"medium"}')
TASK_ID=$(echo "$TASK" | jq -r '.id')
echo "创建任务: $TASK_ID"

# 2) 更新状态为"已完成"
curl -s -X PUT "$TASKPILOT_URL/api/tasks/$TASK_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN" \
  -d '{"status":"done"}' | jq .

# 3) 查看统计概况
curl -s "$TASKPILOT_URL/api/stats/summary" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN" | jq .

# 4) 删除任务
curl -s -X DELETE "$TASKPILOT_URL/api/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

> 快速上手中的示例依赖 `jq` 解析 JSON。可通过 `brew install jq` 或 `apt install jq` 安装。

## 使用场景示例

### 场景 1: 创建待办任务

用户说："帮我创建一个明天下午3点截止的工作任务，优先级高"

```bash
curl -s -X POST "$TASKPILOT_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN" \
  -d '{
    "title": "工作任务",
    "tag": "工作",
    "status": "todo",
    "priority": "high",
    "dueTime": "2026-06-16T15:00:00.000Z"
  }'
```

### 场景 2: 查看今日任务

用户说："我今天有哪些任务要做？"

```bash
curl -s "$TASKPILOT_URL/api/tasks/today" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN" | jq .
```

### 场景 3: 按标签和关键词搜索

用户说："搜索工作标签下包含'报告'的任务"

```bash
curl -s "$TASKPILOT_URL/api/tasks?tag=工作&keyword=报告" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN" | jq .
```

### 场景 4: 批量查看并完成任务

用户说："把所有高优先级的待办任务找出来，看看有哪些"

```bash
curl -s "$TASKPILOT_URL/api/tasks?status=todo&priority=high&pageSize=50" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN" | jq '.items[] | {id, title, tag, dueTime}'
```

### 场景 5: 查看本月统计

用户说："我这个月的任务完成情况怎么样？"

```bash
# 概况
curl -s "$TASKPILOT_URL/api/stats/summary?start=2026-06-01&end=2026-06-30" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN" | jq .

# 趋势
curl -s "$TASKPILOT_URL/api/stats/trend?days=30" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN" | jq .
```

### 场景 6: 查看日历

用户说："显示我这个月的任务日历"

```bash
curl -s "$TASKPILOT_URL/api/calendar?year=2026&month=6" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN" | jq .
```

## 输出格式建议

根据用户需求，灵活返回以下格式：

1. **简要列表**: 用表格展示任务 ID、标题、状态、优先级、截止时间
2. **完整详情**: 展示单个任务的所有字段
3. **统计摘要**: 用文字描述任务的完成率、分布情况等
4. **JSON 格式**: 用户需要编程处理时返回原始 JSON

## 最佳实践

1. **标签命名**: 建议使用统一的标签命名规范，如"工作"、"个人"、"学习"，保持中文一致性
2. **优先级设置**: 按实际紧急程度设置 `low`/`medium`/`high`，避免全部设为 `high` 导致优先级失效
3. **截止时间**: 为有时间要求的任务设置 `dueTime`，便于使用"今日任务"和日历功能
4. **提醒设置**: 对重要任务设置 `reminderHours`，配合 Webhook 提醒功能使用
5. **分页处理**: 任务数量多时注意使用 `page` 和 `pageSize` 参数分页获取
6. **状态流转**: 任务状态按 `todo` → `doing` → `done` 流转，保持工作流清晰

## 注意事项

- 任务 ID 为 UUID 格式，如 `550e8400-e29b-41d4-a716-446655440000`
- 时间字段使用 ISO 8601 格式，如 `2026-06-20T18:00:00.000Z`
- 更新操作使用 `PUT`（非 `PATCH`），支持部分更新——只需传入需要修改的字段
- 删除操作为硬删除，不可恢复，执行前请确认
- `due=today` 筛选的是截止时间在当天 00:00–23:59 的任务
- `due=week` 筛选的是截止时间在当周（周一至周日）的任务
- 日历接口返回与指定月份有交集的所有任务，包括跨月任务
- `reminderHours` 大于 0 且 `reminded` 为 `false` 时，系统会在 `dueTime - reminderHours` 时间点触发提醒
