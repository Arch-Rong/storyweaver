"""封装 OpenAI 兼容 API 的异步客户端（真正「打电话」给模型网关）。

输入：ContextManager 拼好的 messages 列表
输出：StreamEvent 异步流（TEXT_DELTA 一段段文字 + 最后 MESSAGE_COMPLETE）

密钥和网关地址来自 Config（.env），模型名、温度来自 Config.model。
"""

from __future__ import annotations

import asyncio
from typing import Any, AsyncGenerator

from openai import APIConnectionError, APIError, AsyncOpenAI, RateLimitError

from storyweaver.client.response import StreamEvent, StreamEventType, TextDelta, TokenUsage
from storyweaver.config.config import Config


class LLMClient:
    """一次 Session 内复用同一个 HTTP 连接池，用完要 close()。"""

    def __init__(self, config: Config) -> None:
        self.config = config
        self._client: AsyncOpenAI | None = None
        # 延迟创建：只有第一次 chat 时才连网关，避免 import 时就报错
        self._max_retries = 3
        # 限流/断线时最多重试 3 次，间隔 1s、2s、4s（指数退避）

    def get_client(self) -> AsyncOpenAI:
        """单例式获取 AsyncOpenAI 客户端。"""
        if self._client is None:
            self._client = AsyncOpenAI(
                api_key=self.config.api_key,
                base_url=self.config.base_url,
            )
        return self._client

    async def close(self) -> None:
        """释放连接；Agent 的 async with 退出时会调。"""
        if self._client:
            await self._client.close()
            self._client = None

    async def chat_completion(
        self,
        messages: list[dict[str, Any]],
        stream: bool = True,
    ) -> AsyncGenerator[StreamEvent, None]:
        """发起一次对话补全，以事件流形式产出结果。

        Args:
            messages: OpenAI 格式，含 system / user / assistant
            stream: 默认 True，边生成边返回（CLI 打字机效果）

        Yields:
            StreamEvent：多个 TEXT_DELTA，最后 MESSAGE_COMPLETE 或 ERROR
        """
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
                # 429 太快：等一会再试
                if attempt < self._max_retries:
                    await asyncio.sleep(2**attempt)
                else:
                    yield StreamEvent(type=StreamEventType.ERROR, error=f"超过速率限制: {exc}")
                    return
            except APIConnectionError as exc:
                # 网络断了：同样退避重试
                if attempt < self._max_retries:
                    await asyncio.sleep(2**attempt)
                else:
                    yield StreamEvent(type=StreamEventType.ERROR, error=f"连接错误: {exc}")
                    return
            except APIError as exc:
                # 业务错误（如 model_not_found）：不重试，直接 ERROR
                yield StreamEvent(type=StreamEventType.ERROR, error=f"API 错误: {exc}")
                return

    async def _stream_response(
        self,
        client: AsyncOpenAI,
        kwargs: dict[str, Any],
    ) -> AsyncGenerator[StreamEvent, None]:
        """解析 OpenAI 流式 chunk，转成我们的 StreamEvent。

        网关每次推一小块 JSON（chunk），可能只有几个字；
        循环里把 delta.content 包装成 TEXT_DELTA 往上抛。
        """
        response = await client.chat.completions.create(**kwargs)
        finish_reason: str | None = None
        usage: TokenUsage | None = None

        async for chunk in response:
            # 有些 chunk 只带 usage，不带文字
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
