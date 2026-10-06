"""StoryWeaver 命令行入口（CLI = Command Line Interface）。

你执行 `python -m storyweaver.cli` 时，Python 会运行本文件的 main()。

职责（不写业务逻辑，只做「接线」）：
1. 读 .env、加载 Config
2. 创建 Agent，订阅 AgentEvent
3. 把模型的流式文字画到终端（rich）
"""

from __future__ import annotations

import asyncio
# asyncio：Agent / LLMClient 是异步的（async/await），需要事件循环驱动

import sys
from pathlib import Path

import click
# click：解析命令行参数（prompt、--cwd、--help）

from dotenv import load_dotenv
from rich.console import Console

from storyweaver.agent.agent import Agent
from storyweaver.agent.events import AgentEventType
from storyweaver.config.loader import load_config

console = Console()


def _bootstrap_env() -> None:
    """第一步：把 apps/backend/.env 载入进程环境变量。"""
    load_dotenv()


async def _run_prompt(config, message: str) -> int:
    """单次任务模式：命令行里直接带一句话。

    例如：python -m storyweaver.cli "检查第3章设定"
    返回 0 成功，1 表示 API 报错。
    """
    console.print(f"\n[user]>[/user] {message}")
    assistant_streaming = False
    # 标记是否已经开始打印 assistant 行（避免重复打 [assistant] 前缀）

    async with Agent(config) as agent:
        # async with：退出时自动关闭 LLM HTTP 连接
        async for event in agent.run(message):
            # agent.run 是事件流：START → 很多 TEXT_DELTA → TEXT_COMPLETE → END
            if event.type == AgentEventType.TEXT_DELTA:
                content = event.data.get("content", "")
                if not assistant_streaming:
                    console.print("\n[assistant]", end="")
                    assistant_streaming = True
                console.print(content, end="")
                # end=""：不换行，实现打字机效果
            elif event.type == AgentEventType.TEXT_COMPLETE:
                if assistant_streaming:
                    console.print()
                    assistant_streaming = False
            elif event.type == AgentEventType.AGENT_ERROR:
                console.print(f"\n[red]错误: {event.data.get('error')}[/red]")
                return 1

    console.print()
    return 0


async def _run_interactive(config) -> int:
    """交互模式：无命令行参数时，循环读终端输入。

    同一个 Agent 实例贯穿多轮，context 里会累积历史对话。
    """
    console.print("[dim]交互模式，输入 exit 或 /exit 退出[/dim]")
    async with Agent(config) as agent:
        while True:
            try:
                user_input = console.input("\n[user]>[/user] ").strip()
            except (EOFError, KeyboardInterrupt):
                # Ctrl+D / Ctrl+C 优雅退出
                break

            if not user_input:
                continue
            if user_input.lower() in {"exit", "/exit", "quit"}:
                break

            assistant_streaming = False
            async for event in agent.run(user_input):
                # 事件处理与 _run_prompt 相同，可抽公共函数（P0 先重复写）
                if event.type == AgentEventType.TEXT_DELTA:
                    content = event.data.get("content", "")
                    if not assistant_streaming:
                        console.print("\n[assistant]", end="")
                        assistant_streaming = True
                    console.print(content, end="")
                elif event.type == AgentEventType.TEXT_COMPLETE:
                    if assistant_streaming:
                        console.print()
                        assistant_streaming = False
                elif event.type == AgentEventType.AGENT_ERROR:
                    console.print(f"\n[red]错误: {event.data.get('error')}[/red]")

    console.print("\n[dim]再见[/dim]")
    return 0


@click.command()
@click.argument("prompt", required=False)
@click.option(
    "--cwd",
    "-c",
    type=click.Path(exists=True, file_okay=False, path_type=Path),
    help="作品/项目目录（预留给以后读章节文件；P0 仅记录路径）",
)
@click.version_option(version="0.1.0", prog_name="storyweaver")
def main(prompt: str | None, cwd: Path | None) -> None:
    """StoryWeaver 小说 Agent CLI。"""
    _bootstrap_env()

    try:
        config = load_config(cwd=cwd)
    except Exception as exc:
        console.print(f"[red]配置错误: {exc}[/red]")
        sys.exit(1)

    errors = config.validate()
    if errors:
        for error in errors:
            console.print(f"[red]{error}[/red]")
        sys.exit(1)

    console.print("[bold green]StoryWeaver CLI[/bold green]")
    console.print(f"[dim]模型: {config.model_name}[/dim]")
    console.print(f"[dim]网关: {config.base_url}[/dim]")

    if prompt:
        # 有位置参数 → 单次模式
        code = asyncio.run(_run_prompt(config, prompt))
        sys.exit(code)

    # 无参数 → 交互模式
    code = asyncio.run(_run_interactive(config))
    sys.exit(code)


if __name__ == "__main__":
    main()
