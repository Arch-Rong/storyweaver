from __future__ import annotations

from typing import AsyncGenerator

from storyweaver.agent.events import AgentEvent, AgentEventType
from storyweaver.agent.session import Session
from storyweaver.client.response import StreamEventType
from storyweaver.config.config import Config


class Agent:
    def __init__(self, config: Config) -> None:
        self.config = config
        self.session = Session(config)

    async def run(self, message: str) -> AsyncGenerator[AgentEvent, None]:
        yield AgentEvent.agent_start(message)
        self.session.context_manager.add_user_message(message)

        final_response: str | None = None
        async for event in self._agentic_loop():
            yield event
            if event.type == AgentEventType.TEXT_COMPLETE:
                final_response = event.data.get("content")

        yield AgentEvent.agent_end(final_response)

    async def _agentic_loop(self) -> AsyncGenerator[AgentEvent, None]:
        for _ in range(self.config.max_turns):
            self.session.increment_turn()
            response_text = ""

            async for event in self.session.client.chat_completion(
                self.session.context_manager.get_messages()
            ):
                if event.type == StreamEventType.TEXT_DELTA and event.text_delta:
                    content = event.text_delta.content
                    response_text += content
                    yield AgentEvent.text_delta(content)
                elif event.type == StreamEventType.ERROR:
                    yield AgentEvent.agent_error(event.error or "Unknown error")
                    return

            if response_text:
                self.session.context_manager.add_assistant_message(response_text)
                yield AgentEvent.text_complete(response_text)
            return

    async def __aenter__(self) -> Agent:
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.session.client.close()
