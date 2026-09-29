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

    def increment_turn(self) -> int:
        self._turn_count += 1
        return self._turn_count
