"""LLM 流式响应的「事件类型」定义（response = API 返回数据的结构）。

client/ 模块分工：
- response.py：定义 StreamEvent 等数据结构（API 层事件）
- llm_client.py：真正发 HTTP 请求，把 OpenAI SDK 的 chunk 转成 StreamEvent

为啥要单独定义 StreamEvent，不直接用 openai 库的对象？
- 上层 Agent 不依赖 openai 包的具体类型，以后换 SDK 或换网关更容易
- 统一事件名：TEXT_DELTA / ERROR / MESSAGE_COMPLETE，和 agent/events.py 对应
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from enum import Enum
from typing import Any


@dataclass
class TextDelta:
    """一小段增量文本（流式输出时，模型一个字一个字吐出来）。"""

    content: str


class StreamEventType(str, Enum):
    """LLMClient 对外抛出的事件类型。"""

    TEXT_DELTA = "text_delta"
    # 又来了一小块文字，CLI 可以边收边打印（打字机效果）

    MESSAGE_COMPLETE = "message_complete"
    # 本轮流结束，可带 finish_reason、token 用量

    ERROR = "error"
    # 请求失败（限流、连不上、model_not_found 等）


@dataclass
class TokenUsage:
    """Token 用量统计（计费、监控用，P0 暂未在 CLI 展示）。"""

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cached_tokens: int = 0


@dataclass
class StreamEvent:
    """LLMClient.chat_completion 产出的单条事件。

    根据 type 不同，只填相关字段：
    - TEXT_DELTA     → text_delta
    - ERROR          → error
    - MESSAGE_COMPLETE → finish_reason, usage
    """

    type: StreamEventType
    text_delta: TextDelta | None = None
    error: str | None = None
    finish_reason: str | None = None
    usage: TokenUsage | None = None


def parse_tool_call_arguments(arguments_str: str) -> dict[str, Any]:
    """把工具调用的 arguments JSON 字符串解析成 dict。

    预留给以后接入 function calling（如 get_chapter）。
    模型返回的 arguments 有时是残缺 JSON，解析失败就包在 raw_arguments 里。
    """
    if not arguments_str:
        return {}
    try:
        return json.loads(arguments_str)
    except json.JSONDecodeError:
        return {"raw_arguments": arguments_str}
