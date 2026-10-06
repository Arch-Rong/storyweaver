"""对话上下文管理（context = 发给大模型的「聊天记录 + 系统设定」）。

大模型 API 是无状态的：每次请求都要把「之前说过什么」整包再发一遍。
ContextManager 就是内存里的「对话笔记本」，负责：
- 保存 system 提示词（人设与规则）
- 按顺序追加 user / assistant 消息
- 需要调 API 时，组装成 OpenAI 格式的 messages 列表

以后还会在这里做：token 超预算裁剪、插入章节资料片段等。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from storyweaver.config.config import Config
from storyweaver.prompts.system import get_system_prompt
from storyweaver.utils.text import count_tokens


@dataclass
class MessageItem:
    """内存里的一条对话记录（比直接存 dict 更清晰、可扩展）。

    字段说明：
    - role: "user" 或 "assistant"（作者问 / 模型答）
    - content: 文本内容
    - token_count: 本条大约占多少 token（给以后裁剪用）
    - tool_calls: 预留；接入工具调用后，assistant 消息可能带 function call 信息
    """

    role: str
    content: str
    token_count: int | None = None
    tool_calls: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """把 MessageItem 转成 LLM API 能识别的单条 message dict。

        我们内部用 dataclass 存消息（方便挂 token_count 等字段）；
        但 openai 客户端只认「普通字典」列表，所以发送前要 to_dict() 一次。

        普通用户消息示例（输出）::
            {"role": "user", "content": "检查第3章设定"}

        将来带工具调用的 assistant 消息示例（输出）::
            {
              "role": "assistant",
              "content": "我先查一下章节…",
              "tool_calls": [{"id": "call_1", "type": "function", ...}]
            }

        注意：token_count 不会传给 API，那是我们本地记账用的，API 不需要。
        """
        # 最少要有 role + content，这是 OpenAI messages 格式的硬性要求
        result: dict[str, Any] = {"role": self.role, "content": self.content}
        if self.tool_calls:
            # 只有 assistant 在「决定调工具」时才会有 tool_calls
            # 空列表时不写入，避免给 API 传多余字段
            result["tool_calls"] = self.tool_calls
        return result
        # get_messages() 会把多条 to_dict() 结果 + system 拼成完整 messages 数组


class ContextManager:
    """管理一次 Session 内的完整对话上下文。"""

    def __init__(self, config: Config) -> None:
        self.config = config
        # 启动时生成 system 提示词，整个会话复用同一份（除非重启 CLI）
        self._system_prompt = get_system_prompt(config)
        # 只存 user/assistant 历史；system 单独放，get_messages 时再拼到最前面
        self._messages: list[MessageItem] = []

    def add_user_message(self, content: str) -> None:
        """作者（或 CLI 用户）发了一条新消息。"""
        self._messages.append(
            MessageItem(
                role="user",
                content=content,
                token_count=count_tokens(content, self.config.model_name),
            )
        )

    def add_assistant_message(self, content: str) -> None:
        """模型完整回复后，写回历史，下一轮对话模型才能「记得」自己说过什么。"""
        self._messages.append(
            MessageItem(
                role="assistant",
                content=content,
                token_count=count_tokens(content, self.config.model_name),
            )
        )

    def get_messages(self) -> list[dict[str, Any]]:
        """组装即将发给 LLMClient 的 messages 列表。

        顺序固定：
        1. system（固定人设与规则）
        2. 按时间顺序的 user / assistant 交替历史

        Agent 每轮循环都会调用此方法，把「当前完整上下文」交给 API。
        """
        messages: list[dict[str, Any]] = []
        if self._system_prompt:
            messages.append({"role": "system", "content": self._system_prompt})
        for item in self._messages:
            messages.append(item.to_dict())
        return messages


# 谁在用？（调用链）
# cli.py → Agent.run(message)
#   → context_manager.add_user_message(message)     # 先记用户问题
#   → context_manager.get_messages()                # 调 API
#   → context_manager.add_assistant_message(reply)  # 再记模型回答
# 交互模式下多轮对话时，_messages 越来越长，模型就能连着上文聊。
