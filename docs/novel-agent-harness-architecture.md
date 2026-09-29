# StoryWeaver 小说 Agent：参考 NiuMa-Harness 的实现架构

> 日期：2026-09-29
> 状态：设计参考文档（与 [`novel-agent-technical-plan.md`](./novel-agent-technical-plan.md) 互补）
> 参考实现：[`/Users/rwr/repo/niuma-harness`](../../niuma-harness)（轻量 Python 异步 Agent CLI）

---

## 1. 能不能用 NiuMa-Harness 这套技术栈写 StoryWeaver？

**可以，但要分清「Agent 内核」和「完整产品」两层。**

| 层次 | NiuMa-Harness 做法 | StoryWeaver 目标 |
|------|-------------------|------------------|
| **Agent 内核**（Think → Tool → Observe 循环） | ✅ 非常适合照搬思路 | 规划、续写、改稿、一致性检查都适用 |
| **工具层**（读/写/搜） | ✅ 思路可映射，工具要换成小说领域 | `get_chapter` 代替 `read_file` |
| **CLI 原型** | ✅ 可先做 `storyweaver-cli` 验证提示与工具 | M0 评测、作者自用脚本 |
| **持久化与版本** | ❌ 只有内存 + 文件，不够 | 需要 PostgreSQL、不可变正文版本（见技术方案） |
| **编辑器与采纳** | ❌ 无 | 需要 Next.js + Tiptap + 差异审阅 |
| **长任务与取消** | ⚠️ 较弱 | 需要 Celery + 事件表 + SSE |

**结论：**

- **NiuMa-Harness 架构** → 用来实现 StoryWeaver 的 **Agent 执行引擎**（`backend/src/storyweaver/agent/`）。
- **StoryWeaver 技术方案** → 用来实现 **产品、数据、编辑器、任务持久化**。

两者不冲突：先用 Harness 模式跑通「模型 + 工具 + 循环」，再接入 FastAPI / PostgreSQL / 前端。

---

## 2. 概念映射：编程 Agent → 小说 Agent

（与 [`novel-agent-technical-plan.md` §4.1](novel-agent-technical-plan.md) 一致，此处对照 NiuMa-Harness 模块。）

| NiuMa-Harness（编程） | StoryWeaver（小说） | 对应模块 |
|----------------------|---------------------|----------|
| `read_file` | 读章节/设定 | `get_chapter` |
| `grep` / `glob` | 搜人物、事件、伏笔 | `search_story` |
| `write_file` / `edit_file` | **不直接写正文** → `propose_changes` | 只创建提案 |
| `shell` | 一般不暴露给模型 | 可选：导出、统计 |
| `web_search` | 考据、时代背景 | `web_research`（可选） |
| `ContextManager` | 作品设定 + 章节 + 证据片段 | `StoryContextManager` |
| `buildSavePayload` | `build_task_context` | 组装本次任务上下文 |
| `mergeRemoteWorkflow` | 版本冲突检测 | 采纳前校验 `baseRevisionId` |
| CLI `main.py` | 作者工作台 / 调试 CLI | `apps/web` + 可选 `cli/` |

**核心原则（StoryWeaver 不变量）：**

> 模型输出默认是 **提案**，不能直接覆盖定稿正文或正式设定。
> 这与 NiuMa-Harness「直接改文件」不同，小说 Agent 的「写工具」必须是 **proposal-only**。

---

## 3. 推荐技术栈（Agent 内核层）

与 NiuMa-Harness 对齐的 **Python Agent 核心**依赖：

| 依赖 | 用途 |
|------|------|
| **openai**（`AsyncOpenAI`） | 兼容 OpenAI API 的模型网关（DeepSeek、自建 gateway 等） |
| **pydantic** | 配置、工具参数、结构化提案（`ChangeItem`）校验 |
| **python-dotenv** | 本地开发：`API_KEY`、`BASE_URL` |
| **tomli** | 项目配置 `.storyweaver/config.toml` |
| **platformdirs** | 用户级配置目录 |
| **tiktoken** | 上下文 token 预算控制 |
| **rich** | CLI / Worker 日志与调试 TUI（可选） |
| **click** | 本地调试 CLI（可选） |

StoryWeaver **产品层**额外需要（见技术方案，此处不展开）：

FastAPI · SQLAlchemy · Alembic · Celery · Redis · PostgreSQL · Next.js · Tiptap

---

## 4. 分层架构（对照 NiuMa-Harness）

```
┌─────────────────────────────────────────────────────────────┐
│  apps/web (Next.js)          作者工作台、编辑器、差异采纳    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / SSE
┌──────────────────────────────▼──────────────────────────────┐
│  backend/.../api/            FastAPI 路由、鉴权、任务提交     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│  backend/.../agent/          ★ 与 NiuMa-Harness 同构的一层 ★   │
│    agent.py      Agentic Loop（Think → Act → Observe）        │
│    events.py     TEXT_DELTA / TOOL_CALL / TASK_COMPLETE      │
│    session.py    LLMClient + ContextManager + ToolRegistry    │
└──────┬───────────────────────┬──────────────────────────────┘
       │                       │
┌──────▼──────┐         ┌──────▼──────────────────────────────┐
│ LLMClient   │         │ StoryContextManager + NovelToolRegistry│
│ 流式 + FC   │         │ 读章节 / 搜故事 / 提提案（只读写分离）  │
└─────────────┘         └─────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────┐
│  backend/.../domain/         版本、提案、定稿（与 Agent 解耦） │
│  backend/.../db/             PostgreSQL 持久化                  │
└───────────────────────────────────────────────────────────────┘
```

### 4.1 目录建议（Agent 部分）

在 [`novel-agent-technical-plan.md`](novel-agent-technical-plan.md) §6 基础上，**Agent 子包**可细化为：

```text
backend/src/storyweaver/
  agent/
    agent.py              # 主循环（对照 niuma-harness/agent/agent.py）
    events.py             # 事件类型
    session.py            # Session：client + context + tools
    tasks.py              # 任务类型：outline / continue / revise / check
  client/
    llm_client.py         # AsyncOpenAI 流式 + function calling
    response.py           # StreamEvent 解析
  context/
    manager.py            # 对话历史 + 资料片段 + token 预算
    assembler.py          # 按优先级组装：请求→段落→设定→证据→规划
  tools/
    base.py               # Tool 基类、ToolResult
    registry.py           # 注册与 invoke
    builtin/
      get_chapter.py
      search_story.py
      get_character_state.py
      get_outline.py
      propose_changes.py      # 只写提案表，不碰正文
      report_consistency.py
      propose_memory.py
  prompts/
    system.py             # 全局规则：提案-only、中文、视角约束
    revise.py / outline.py  # 按任务类型的提示
  config/
    config.py
    loader.py
```

---

## 5. Agent 主循环（与 NiuMa-Harness 相同模式）

```text
用户/作者请求（改稿 / 续写 / 检查）
    ↓
StoryContextManager.add_user_message()
    ↓
┌─ for turn in range(max_turns) ─────────────────┐
│  LLMClient.chat_completion(messages, tools)      │
│    → TEXT_DELTA：流式展示给前端                  │
│    → TOOL_CALL：调用 NovelToolRegistry           │
│         · 只读工具：查章节、搜证据               │
│         · 提案工具：写入 change_sets（DB）       │
│    → 工具结果写回 context                        │
│  若无 tool_calls → 结束                          │
└──────────────────────────────────────────────────┘
    ↓
awaiting_review（等待作者采纳）→ completed
```

与 NiuMa-Harness 的差异：

| 点 | NiuMa-Harness | StoryWeaver |
|----|---------------|-------------|
| 写操作 | `write_file` 直接改磁盘 | `propose_changes` 写 DB 提案 |
| 工作目录 | `cwd` 单目录 | `project_id` + 版本 ID |
| 持久化 | 无 | 每步 checkpoint + `agent_runs` |
| 协作锁 | 无 | 可选：编辑锁（后期） |

---

## 6. 小说专用工具设计

### 6.1 只读工具（Agent 可自由调用）

| 工具 | 作用 | 返回必须包含 |
|------|------|--------------|
| `get_chapter` | 读指定版本章节正文 | `revisionId`, `blockIds`, 段落文本 |
| `search_story` | 关键词/实体搜全文 | 命中片段 + 来源版本 + blockId |
| `get_character_state` | 某时间点人物状态与认知 | 事实来源、是否「人物以为」 |
| `get_outline` | 大纲、章节目标、伏笔 | 标注「未来规划，非已发生」 |

### 6.2 提案工具（只创建提案，不改正文）

| 工具 | 作用 |
|------|------|
| `propose_outline` | 创建规划提案 |
| `propose_changes` | 创建结构化 `ChangeItem`（段落 replace/insert/delete） |
| `report_consistency_issues` | 带证据的问题列表 |
| `propose_memory_updates` | 定稿候选事实（绑定来源版本） |

### 6.3 作者 API（不由模型直接调用）

- `POST /change-sets/:id/accept` — 采纳修改（版本校验 + 事务）
- `POST /chapters/:id/finalize` — 定稿确认

---

## 7. 配置方式（对照 NiuMa-Harness）

### 7.1 环境变量（`.env`）

```env
API_KEY=sk-xxx
BASE_URL=https://your-gateway/v1
```

### 7.2 项目配置（`.storyweaver/config.toml`）

```toml
[model]
name = "your-model-name"
temperature = 0.8

[agent]
max_turns = 20
max_tool_calls_per_run = 30

[project]
default_language = "zh"
```

### 7.3 作品级指令（`STORY.MD` 或数据库）

类似 NiuMa-Harness 的 `AGENT.MD`，注入 system prompt：

- 叙事视角（第一/第三人称）
- 题材与禁忌
- 是否允许全知叙述透露信息

---

## 8. 实施路线：从 Harness 原型到 StoryWeaver 产品

```mermaid
flowchart LR
    P0[P0: Harness 式 CLI 原型] --> P1[P1: Agent 包进 backend/]
    P1 --> P2[P2: FastAPI + DB 提案表]
    P2 --> P3[P3: Next.js 编辑器 + 采纳]
    P3 --> P4[P4: Celery 长任务 + SSE]
```

| 阶段 | 做什么 | 复用 NiuMa-Harness |
|------|--------|-------------------|
| **P0** | 本地 CLI：`python -m storyweaver.agent "改第8章背叛动机"` | 几乎 1:1 拷贝 agent/client/tools 结构 |
| **P1** | 工具从「读文件」改为「读 DB/API」 | 保留 loop + registry 模式 |
| **P2** | `propose_changes` 写 PostgreSQL；采纳 API | 去掉直接 write_file |
| **P3** | 前端差异展示 + Tiptap | CLI 仅作调试 |
| **P4** | Worker、取消、事件重放 | 参考 Harness 的 debounce/重试思路，加强持久化 |

详细里程碑见 [`novel-agent-technical-plan.md` §13](novel-agent-technical-plan.md)（M0–M4）。

---

## 9. P0 快速启动清单（Harness 式原型）

在 `backend/` 尚未建全之前，可单独建 `backend/` 或临时目录：

```bash
# 1. 创建 Python 环境
cd storyweaver/backend   # 或 tools/novel-agent-cli
uv venv && source .venv/bin/activate

# 2. 安装 Agent 核心依赖
uv pip install openai pydantic python-dotenv rich click tomli platformdirs tiktoken

# 3. 配置
cp .env.example .env   # 填写 API_KEY、BASE_URL

# 4. 运行交互式 Agent（实现后）
python -m storyweaver.cli
# 或单次任务
python -m storyweaver.cli "检查第3章人物年龄是否与前文矛盾"
```

**P0 验收：** 能对固定样章完成一次「带证据的一致性检查」或「局部改稿提案（Markdown 输出）」，不要求数据库。

---

## 10. 与现有文档的关系

| 文档 | 作用 |
|------|------|
| [`novel-agent-technical-plan.md`](novel-agent-technical-plan.md) | 产品范围、DB 设计、API、里程碑（**主方案**） |
| **本文档** | 用 NiuMa-Harness **代码结构**实现 Agent 内核的参考 |
| [`AGENTS.md`](../AGENTS.md) | 开发 Agent 时的强制规则 |
| [`agent-development-standards.md`](agent-development-standards.md) | 技能路由与验收 |

---

## 11. 一句话总结

**可以用 NiuMa-Harness 的分层（CLI → Agent Loop → LLMClient → Tools → Context）作为 StoryWeaver 小说 Agent 的内核骨架；**

**但必须把「写文件」改成「写提案」，并接入 StoryWeaver 的版本化正文与定稿流程，才能成为产品而不是脚本。**

建议路径：**先抄 Harness 跑 P0 CLI → 再迁入 `backend/src/storyweaver/agent/` → 再接 PostgreSQL 与 Next.js 工作台。**
