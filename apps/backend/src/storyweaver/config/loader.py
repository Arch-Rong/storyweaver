from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import tomli

from storyweaver.config.config import Config

logger = logging.getLogger(__name__)

CONFIG_DIR_NAME = ".storyweaver"
CONFIG_FILE_NAME = "config.toml"
STORY_MD_FILE = "STORY.MD"


def _parse_toml(path: Path) -> dict[str, Any]:
    with open(path, "rb") as f:
        return tomli.load(f)


def _find_project_config(cwd: Path) -> Path | None:
    current = cwd.resolve()
    config_file = current / CONFIG_DIR_NAME / CONFIG_FILE_NAME
    return config_file if config_file.is_file() else None


def _read_story_md(cwd: Path) -> str | None:
    story_md = cwd.resolve() / STORY_MD_FILE
    if story_md.is_file():
        return story_md.read_text(encoding="utf-8")
    return None


def load_config(cwd: Path | None = None) -> Config:
    cwd = cwd or Path.cwd()
    config_dict: dict[str, Any] = {"cwd": cwd}

    project_path = _find_project_config(cwd)
    if project_path:
        try:
            config_dict.update(_parse_toml(project_path))
        except Exception as exc:
            logger.warning("跳过无效配置 %s: %s", project_path, exc)

    if "developer_instructions" not in config_dict:
        story_md = _read_story_md(cwd)
        if story_md:
            config_dict["developer_instructions"] = story_md

    return Config(**config_dict)
