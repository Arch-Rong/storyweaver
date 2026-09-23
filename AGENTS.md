# StoryWeaver Agent 开发规范

本文件适用于 `/Users/rwr/repo/storyweaver` 下的所有任务。子目录中的 `AGENTS.md` 可以补充更具体的规则；未明确覆盖的内容以本文件为准。

## 项目定位

StoryWeaver 是面向作者的小说协作 Agent，核心能力是规划、续写、局部改稿、版本管理和一致性检查。系统的目标是让作者保持最终控制权，因此模型生成的内容默认是提案，不能直接覆盖正文或正式设定。

详细方案见 [docs/novel-agent-technical-plan.md](docs/novel-agent-technical-plan.md)，团队规范见 [docs/agent-development-standards.md](docs/agent-development-standards.md)。

## 工程基线

- 前端使用 pnpm、Turborepo、TypeScript、Next.js App Router、React 和 Tiptap；后端使用 Python、uv、FastAPI、Pydantic、SQLAlchemy、Alembic 和 Celery。
- Python API 与 Worker 共用后端领域模块；Redis 只负责 Celery 调度，PostgreSQL 是任务、事件、正文和事实的权威存储。
- 修改前先查看目标包的 `package.json`、`tsconfig.json`、ESLint 配置和相邻实现。
- 依赖版本以锁文件和实际 `package.json` 为准。涉及库、框架、SDK、API 或 CLI 的问题，先用 Context7 查询对应版本文档；若当前环境没有 Context7，再读取官方文档并说明这一点。
- 优先复用已有共享组件与类型。不要为了一个页面重复实现基础组件，也不要未经需求引入新的状态管理、队列、向量数据库或 Agent 框架。
- 浏览器组件只处理交互和展示；密钥、模型调用、数据库写入、权限校验和版本校验必须在服务端执行。
- 领域规则放在可测试的独立 Python 模块中，不把版本、定稿、事实和提案规则散落在 React 组件或 API 路由中。

## 小说数据不变量

- 正文版本不可变。编辑、采纳、恢复都创建新版本；不能原地覆盖历史版本。
- 工作稿、定稿正文、未来大纲、AI 提案和候选记忆必须明确区分。候选事实只有在作者定稿时才进入正式事实。
- 事实必须记录来源版本；涉及人物认知时同时记录场景时间和知情范围。不能把模型推测当作世界事实。
- 采纳修改时校验作品归属、基础版本、目标段落内容哈希和 `canonEpoch`。发生冲突返回可解释的 409 结果，让作者刷新或重新生成。
- 正文采纳、定稿确认和事实更新使用事务；模型调用、向量化和长时间任务不能放在数据库事务内等待。
- 任务、提案、定稿和队列处理都使用幂等键。重试不能重复插入文字、重复确认事实或重复产生副作用。
- Agent 工具默认只读。写操作只能创建提案或候选记忆；正式正文和正式事实由作者触发的领域 API 修改。

## Agent 实现规则

- 每个任务保存输入版本、定稿快照、提示版本、模型配置、预算、状态和步骤检查点；不要只依赖浏览器会话。
- 工具返回必须带来源版本和定位信息。生成上下文按“作者请求 → 目标段落 → 硬性设定 → 相关证据 → 摘要/规划”的顺序组装，并标明每类资料的身份。
- 为 Agent 设置调用次数、token、耗时和自动修订预算。达到预算时保存已有结果并返回未解决问题，不无限循环。
- 任务状态至少区分 `queued`、`running`、`awaiting_review`、`completed`、`failed` 和 `cancelled`。等待作者审阅时释放 Worker。
- 模型输出先经过 schema 校验和领域校验，再写入数据库。拒绝任意 HTML、任意路径、任意作品 ID 和未授权工具参数。
- 记录请求、模型、提示版本、检索来源和用量；日志中不要输出 API key、cookie、完整私密正文或敏感个人信息。

## 前端与编辑器规则

- Tiptap 文档 JSON 是正文的权威编辑格式；纯文本、Markdown 和检索片段都是派生格式。
- 段落或块使用稳定 ID。修改提案引用版本和块 ID，不能只依赖字符偏移。
- 改稿必须显示差异、修改理由和证据来源。作者可以逐项采纳、拒绝、撤销和恢复。
- 自动保存不能覆盖较新的版本；使用版本号或内容哈希检测并发编辑。
- 页面刷新或 SSE 断开后可以恢复任务状态和事件游标，不能要求模型重新执行只是为了恢复 UI。

## 开发流程

1. 先读相关代码、方案文档和配置，列出影响范围与不变量。
2. 先实现领域类型、校验和服务端规则，再接入页面和 Agent 提示。
3. 对并发、重试、取消、版本冲突和权限边界写有意义的测试。
4. 修改完成后运行与变更相匹配的验证：前端使用 `pnpm lint`、`pnpm check-types`，后端使用 `uv run ruff check`、`uv run mypy` 和 `uv run pytest`（后端目录建立后）；文档变更至少运行 Prettier 检查和 `git diff --check`。
5. 最终说明改了什么、为什么、验证命令及仍未验证的风险。没有新鲜命令输出时，不声称测试或构建通过。

## 技能使用路由

项目专用技能位于 [`skills/storyweaver-development/SKILL.md`](skills/storyweaver-development/SKILL.md)。根据任务按需使用全局技能：

| 任务                                   | 技能                             |
| -------------------------------------- | -------------------------------- |
| React/Next.js 页面、数据获取、性能     | `vercel-react-best-practices`    |
| 页面视觉重做或新增产品界面             | `frontend-design`                |
| 本地 Web 页面交互与回归                | `webapp-testing`                 |
| 遇到 bug、测试失败或异常行为           | `systematic-debugging`           |
| 任务完成前的测试、构建、差异和需求核对 | `verification-before-completion` |
| 完成较大功能或准备合并前               | `requesting-code-review`         |
| 修改或创建 Codex 技能                  | `skill-creator`                  |

不要为了普通文档编辑、简单重命名或只读检查强行加载不相关技能。技能只补充本规范，不改变用户的目标、权限或确认要求。

## 禁止事项

- 不把 API key、数据库密码、用户正文或调试日志提交到 Git。
- 不在未经作者确认时把模型提案写入定稿正文或正式事实。
- 不通过删除历史版本、清空数据库或重写 Git 历史来“修复”问题。
- 不绕过类型检查、lint、权限校验、版本校验或任务预算来让流程看起来成功。
- 不因为某个单次案例就增加全局规则；先确认它是可复现的不变量，再补充最小规则和测试。
