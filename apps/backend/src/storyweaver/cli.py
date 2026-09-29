"""StoryWeaver CLI entry point."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import click
from dotenv import load_dotenv
from rich.console import Console

from storyweaver.agent.agent import Agent
from storyweaver.agent.events import AgentEventType
from storyweaver.config.loader import load_config

console = Console()


def _bootstrap_env() -> None:
    load_dotenv()


async def _run_prompt(config, message: str) -> int:
    console.print(f"\n[user]>[/user] {message}")
    assistant_streaming = False

    async with Agent(config) as agent:
        async for event in agent.run(message):
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
                return 1

    console.print()
    return 0


async def _run_interactive(config) -> int:
    console.print("[dim]交互模式，输入 exit 或 /exit 退出[/dim]")
    async with Agent(config) as agent:
        while True:
            try:
                user_input = console.input("\n[user]>[/user] ").strip()
            except (EOFError, KeyboardInterrupt):
                break

            if not user_input:
                continue
            if user_input.lower() in {"exit", "/exit", "quit"}:
                break

            assistant_streaming = False
            async for event in agent.run(user_input):
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
    help="作品/项目目录（可读取 .storyweaver/config.toml 与 STORY.MD）",
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
        code = asyncio.run(_run_prompt(config, prompt))
        sys.exit(code)

    code = asyncio.run(_run_interactive(config))
    sys.exit(code)


if __name__ == "__main__":
    main()
