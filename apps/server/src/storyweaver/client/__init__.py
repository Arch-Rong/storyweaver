"""StoryWeaver 大模型 API 客户端。

- response.py：StreamEvent 等数据结构
- llm_client.py：LLMClient，发 chat/completions 请求

上层 agent/agent.py 通过 Session.client 调用，不直接碰 openai 库。
"""
