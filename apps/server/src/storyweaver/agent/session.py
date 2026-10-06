"""一次对话 Session：把 LLM 客户端和上下文管理器绑在一起。

Session = 这次聊天需要的「三件套」：
- config：配置
- client：怎么调模型
- context_manager：记了哪些话

以后加 ToolRegistry 也会挂在这里（和 niuma-harness 一样）。
"""

from __future__ import annotations

from storyweaver.client.llm_client import LLMClient
from storyweaver.config.config import Config
from storyweaver.context.manager import ContextManager


class Session:
    def __init__(self, config: Config) -> None:
        self.config = config
        self.client = LLMClient(config)
        self.context_manager = ContextManager(config)
        self._turn_count = 0
        # 记录 Agent 主循环跑了第几轮（以后多轮 tool call 会用到）

    def increment_turn(self) -> int:
        self._turn_count += 1
        return self._turn_count
