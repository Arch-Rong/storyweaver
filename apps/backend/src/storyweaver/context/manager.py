from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from storyweaver.config.config import Config
from storyweaver.prompts.system import get_system_prompt
from storyweaver.utils.text import count_tokens


@dataclass
class MessageItem:
    role: str
    content: str
    token_count: int | None = None
    tool_calls: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {"role": self.role, "content": self.content}
        if self.tool_calls:
            result["tool_calls"] = self.tool_calls
        return result


class ContextManager:
    def __init__(self, config: Config) -> None:
        self.config = config
        self._system_prompt = get_system_prompt(config)
        self._messages: list[MessageItem] = []

    def add_user_message(self, content: str) -> None:
        self._messages.append(
            MessageItem(
                role="user",
                content=content,
                token_count=count_tokens(content, self.config.model_name),
            )
        )

    def add_assistant_message(self, content: str) -> None:
        self._messages.append(
            MessageItem(
                role="assistant",
                content=content,
                token_count=count_tokens(content, self.config.model_name),
            )
        )

    def get_messages(self) -> list[dict[str, Any]]:
        messages: list[dict[str, Any]] = []
        if self._system_prompt:
            messages.append({"role": "system", "content": self._system_prompt})
        for item in self._messages:
            messages.append(item.to_dict())
        return messages
