# TaskPilot API 技能文档

通过 `curl` 与 TaskPilot 实例的 REST API 交互。所有接口需要 Bearer Token 鉴权。使用前请先配置 `TASKPILOT_URL` 和 `TASKPILOT_TOKEN` 两个环境变量。

---

## 配置

```bash
export TASKPILOT_URL="http://localhost:3000"
export TASKPILOT_TOKEN="your-bearer-token-here"
```


## ·. 任务管理

### ·.1 查询任务列表（支持筛选与分页）

```bash
curl -s "$TASKPILOT_URL/api/tasks?status=todo&priority=high&keyword=报告&tag=工作&due=today&page=1&pageSize=10&sort=desc" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

**查询参数：**

| 参数 | 类型 | 说明 | 可选值 |
|-------|------|-------------|--------|
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

**响应示例：**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "完成季度报告",
      "tag": "工作",
      "status": "todo",
      "priority": "high",
      "dueTime": "2026-06-20T00:00:00.000Z",
      "startTime": "2026-06-15T00:00:00.000Z",
      "reminderHours": 2,
      "reminded": false,
      "createdAt": "2026-06-10T...",
      "updatedAt": "2026-06-10T..."
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5,
  "availableTags": ["个人", "工作", "学习"],
  "tagDistribution": [
    {"label": "工作", "count": 20, "percent": 48},
    {"label": "个人", "count": 15, "percent": 36}
  ],
  "summary": {
    "total": 42,
    "completed": 10,
    "doing": 5,
    "todo": 27,
    "overdue": 3,
    "completionRate": 24
  }
}
```

### 1.2 创建任务

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

**必填字段：** `title`（标题）、`tag`（标签）、`status`（`todo`/`doing`/`done`）、`priority`（`low`/`medium`/`high`）
**可选字段：** `dueTime`（截止时间，ISO 格式或 null）、`startTime`（开始时间，ISO 格式或 null）、`reminderHours`（提前提醒小时数，>0 或 null）

### 1.3 更新任务

```bash
curl -s -X PUT "$TASKPILOT_URL/api/tasks/<TASK_ID>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN" \
  -d '{
    "title": "完成季度报告 v2",
    "status": "doing"
  }'
```

支持部分更新——只需传入需要修改的字段即可。

### 1.4 删除任务

```bash
curl -s -X DELETE "$TASKPILOT_URL/api/tasks/<TASK_ID>" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

**响应：** `{"ok":true}`

### 1.5 今日任务

```bash
curl -s "$TASKPILOT_URL/api/tasks/today" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

返回截止时间在当天（00:00–23:59）内的任务列表，响应结构与 `GET /api/tasks` 一致（无分页）。

---

## 2. 统计分析

### 2.1 概况统计

```bash
curl -s "$TASKPILOT_URL/api/stats/summary?start=2026-06-01&end=2026-06-30" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

**查询参数（均为可选）：** `start`、`end` — ISO 日期字符串，按截止时间范围过滤。

**响应示例：**
```json
{
  "total": 42,
  "completed": 10,
  "uncompleted": 32,
  "doing": 5,
  "completionRate": 24
}
```

### 2.2 饼图数据（状态分布）

```bash
curl -s "$TASKPILOT_URL/api/stats/pie?start=2026-06-01&end=2026-06-30" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

**响应示例：**
```json
[
  {"status": "todo", "label": "待办", "value": 27},
  {"status": "doing", "label": "进行中", "value": 5},
  {"status": "done", "label": "已完成", "value": 10}
]
```

### 2.3 趋势数据（每日完成任务数）

```bash
curl -s "$TASKPILOT_URL/api/stats/trend?days=7&start=2026-06-01&end=2026-06-07" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

**查询参数：**
| 参数 | 类型 | 说明 |
|-------|------|-------------|
| `days` | number | 回溯天数，`7`（默认）或 `30` |
| `start` | string | 自定义起始日期（ISO 格式） |
| `end` | string | 自定义结束日期（ISO 格式） |

**响应示例：**
```json
[
  {"date": "2026-06-01", "completed": 3},
  {"date": "2026-06-02", "completed": 0},
  {"date": "2026-06-03", "completed": 5}
]
```

---

## 3. 日历甘特图

```bash
curl -s "$TASKPILOT_URL/api/calendar?year=2026&month=6" \
  -H "Authorization: Bearer $TASKPILOT_TOKEN"
```

**查询参数（均为可选，默认当前月份）：**
| 参数 | 类型 | 说明 |
|-------|------|-------------|
| `year` | number | 年份，如 `2026` |
| `month` | number | 月份（1–12） |

**响应示例：**
```json
{
  "year": 2026,
  "month": 6,
  "tasks": [
    {
      "id": "uuid",
      "title": "某跨天任务",
      "tag": "工作",
      "status": "doing",
      "priority": "high",
      "startTime": "2026-06-10T00:00:00.000Z",
      "dueTime": "2026-06-15T00:00:00.000Z",
      "reminderHours": 2,
      "reminded": false
    }
  ]
}
```

跨天任务同时包含 `startTime` 和 `dueTime`。返回与指定月份有重叠的所有任务。

---

## 快速上手：任务增删改查完整流程

```bash

# 2) 创建任务
TASK=$(curl -s -X POST "$TASKPILOT_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"测试任务","tag":"个人","status":"todo","priority":"medium"}')
TASK_ID=$(echo "$TASK" | jq -r '.id')

# 3) 更新状态为"已完成"
curl -s -X PUT "$TASKPILOT_URL/api/tasks/$TASK_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"done"}'

# 4) 查看统计概况
curl -s "$TASKPILOT_URL/api/stats/summary" \
  -H "Authorization: Bearer $TOKEN"

# 5) 删除任务
curl -s -X DELETE "$TASKPILOT_URL/api/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN"
```

> 快速上手中的示例依赖 `jq` 解析 JSON。可通过 `brew install jq` 或 `apt install jq` 安装。
