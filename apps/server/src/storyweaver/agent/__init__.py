"""StoryWeaver Agent 执行引擎。

- agent.py   ：主循环 Agent.run()
- session.py ：LLMClient + ContextManager
- events.py  ：AgentEvent（给 CLI / SSE 渲染）

调用链：cli.py → Agent.run() → LLMClient → 网关
"""
