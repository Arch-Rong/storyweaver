"""Agent 核心：Think →（将来 Act）→ Observe 主循环。

当前 P0：只有「调模型 → 流式输出 → 写回上下文」，还没有工具调用。
完整版会在这里：有 tool_calls 就执行工具，结果再喂给模型，循环 max_turns 次。
"""

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
        """处理用户一条输入，对外产出 AgentEvent 流。

        流程：
        1. AGENT_START
        2. 用户消息写入 context
        3. _agentic_loop 调 LLM，转发 TEXT_DELTA / TEXT_COMPLETE / ERROR
        4. AGENT_END
        """
        yield AgentEvent.agent_start(message)
        self.session.context_manager.add_user_message(message)

        final_response: str | None = None
        async for event in self._agentic_loop():
            yield event
            if event.type == AgentEventType.TEXT_COMPLETE:
                final_response = event.data.get("content")

        yield AgentEvent.agent_end(final_response)

    async def _agentic_loop(self) -> AsyncGenerator[AgentEvent, None]:
        """单轮或多轮（有工具时）与模型交互的内层循环。

        P0 简化：调一次 API，拼完全文，写回 assistant 消息，然后 return。
        """
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
            # P0 没有 tool_calls，一轮就结束；有工具时会 continue 下一轮

    async def __aenter__(self) -> Agent:
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.session.client.close()
