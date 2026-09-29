from __future__ import annotations

import asyncio
from typing import Any, AsyncGenerator

from openai import APIConnectionError, APIError, AsyncOpenAI, RateLimitError

from storyweaver.client.response import StreamEvent, StreamEventType, TextDelta, TokenUsage
from storyweaver.config.config import Config


class LLMClient:
    def __init__(self, config: Config) -> None:
        self.config = config
        self._client: AsyncOpenAI | None = None
        self._max_retries = 3

    def get_client(self) -> AsyncOpenAI:
        if self._client is None:
            self._client = AsyncOpenAI(
                api_key=self.config.api_key,
                base_url=self.config.base_url,
            )
        return self._client

    async def close(self) -> None:
        if self._client:
            await self._client.close()
            self._client = None

    async def chat_completion(
        self,
        messages: list[dict[str, Any]],
        stream: bool = True,
    ) -> AsyncGenerator[StreamEvent, None]:
        client = self.get_client()
        kwargs = {
            "model": self.config.model_name,
            "messages": messages,
            "stream": stream,
            "temperature": self.config.model.temperature,
        }

        for attempt in range(self._max_retries + 1):
            try:
                async for event in self._stream_response(client, kwargs):
                    yield event
                return
            except RateLimitError as exc:
                if attempt < self._max_retries:
                    await asyncio.sleep(2**attempt)
                else:
                    yield StreamEvent(type=StreamEventType.ERROR, error=f"超过速率限制: {exc}")
                    return
            except APIConnectionError as exc:
                if attempt < self._max_retries:
                    await asyncio.sleep(2**attempt)
                else:
                    yield StreamEvent(type=StreamEventType.ERROR, error=f"连接错误: {exc}")
                    return
            except APIError as exc:
                yield StreamEvent(type=StreamEventType.ERROR, error=f"API 错误: {exc}")
                return

    async def _stream_response(
        self,
        client: AsyncOpenAI,
        kwargs: dict[str, Any],
    ) -> AsyncGenerator[StreamEvent, None]:
        response = await client.chat.completions.create(**kwargs)
        finish_reason: str | None = None
        usage: TokenUsage | None = None

        async for chunk in response:
            if getattr(chunk, "usage", None):
                details = getattr(chunk.usage, "prompt_tokens_details", None)
                cached = getattr(details, "cached_tokens", 0) if details else 0
                usage = TokenUsage(
                    prompt_tokens=chunk.usage.prompt_tokens or 0,
                    completion_tokens=chunk.usage.completion_tokens or 0,
                    total_tokens=chunk.usage.total_tokens or 0,
                    cached_tokens=cached or 0,
                )

            if not chunk.choices:
                continue

            choice = chunk.choices[0]
            if choice.finish_reason:
                finish_reason = choice.finish_reason

            if choice.delta.content:
                yield StreamEvent(
                    type=StreamEventType.TEXT_DELTA,
                    text_delta=TextDelta(choice.delta.content),
                )

        yield StreamEvent(
            type=StreamEventType.MESSAGE_COMPLETE,
            finish_reason=finish_reason,
            usage=usage,
        )
