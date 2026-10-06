"""Agent 层事件（给 CLI / 以后的 Web SSE 用）。

两层事件对比：
- client/response.StreamEvent  → LLMClient 底层（贴近 API）
- agent/events.AgentEvent      → 业务层（贴近用户：开始、打字、结束、报错）

CLI 只订阅 AgentEvent，不用关心 openai chunk 怎么解析。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class AgentEventType(str, Enum):
    AGENT_START = "agent_start"
    # 收到用户一句话，任务开始

    AGENT_END = "agent_end"
    # 本轮任务结束，带最终完整回复

    AGENT_ERROR = "agent_error"
    # 调 API 失败等

    TEXT_DELTA = "text_delta"
    # 模型又吐了一小段字 → CLI 边收边 print

    TEXT_COMPLETE = "text_complete"
    # 模型这一轮话说完了（一整段 assistant 回复）


@dataclass
class AgentEvent:
    type: AgentEventType
    data: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def agent_start(cls, message: str) -> AgentEvent:
        return cls(type=AgentEventType.AGENT_START, data={"message": message})

    @classmethod
    def agent_end(cls, response: str | None = None) -> AgentEvent:
        return cls(type=AgentEventType.AGENT_END, data={"response": response})

    @classmethod
    def agent_error(cls, error: str) -> AgentEvent:
        return cls(type=AgentEventType.AGENT_ERROR, data={"error": error})

    @classmethod
    def text_delta(cls, content: str) -> AgentEvent:
        return cls(type=AgentEventType.TEXT_DELTA, data={"content": content})

    @classmethod
    def text_complete(cls, content: str) -> AgentEvent:
        return cls(type=AgentEventType.TEXT_COMPLETE, data={"content": content})
