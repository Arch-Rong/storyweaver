"""运行配置的数据结构（config = configuration，程序怎么跑、用什么模型）。

config/ 模块分两个文件：
- config.py：字段定义、默认值、校验（Pydantic）
- loader.py：启动时 `load_config()` 创建 Config 实例

设计原则：
- 密钥与网关：apps/backend/.env（不进 Git）
- 模型名：.env 的 MODEL_NAME，或下方 model.name 默认值
- 其余参数：本文件默认值；要改可后续再加环境变量或配置文件
"""

from __future__ import annotations

import os
from pathlib import Path

from pydantic import BaseModel, Field


class ModelConfig(BaseModel):
    """与「调哪个模型、怎么生成」相关的子配置。"""

    name: str = "deepseek-chat"
    # 默认模型名；.env 里 MODEL_NAME 可覆盖

    temperature: float = Field(default=0.8, ge=0.0, le=2.0)
    # 创造性：0 更稳，越高越发散；ge/le 限制在 0～2


class Config(BaseModel):
    """StoryWeaver 一次 CLI/Session 所需的全部配置。"""

    model: ModelConfig = Field(default_factory=ModelConfig)

    cwd: Path = Field(default_factory=Path.cwd)
    # 作品目录；CLI --cwd 可指定，预留给以后读章节等工具

    max_turns: int = 20
    # Agent 主循环上限（接入工具调用后会用到）

    @property
    def api_key(self) -> str | None:
        return os.environ.get("API_KEY")

    @property
    def base_url(self) -> str | None:
        return os.environ.get("BASE_URL")

    @property
    def model_name(self) -> str:
        return os.environ.get("MODEL_NAME") or self.model.name

    def validate(self) -> list[str]:
        errors: list[str] = []
        if not self.api_key:
            errors.append("未找到 API_KEY，请在 apps/backend/.env 中配置")
        if not self.base_url:
            errors.append("未找到 BASE_URL，请在 apps/backend/.env 中配置")
        return errors
