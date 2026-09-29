from __future__ import annotations

import os
from pathlib import Path

from pydantic import BaseModel, Field


class ModelConfig(BaseModel):
    name: str = "deepseek-chat"
    temperature: float = Field(default=0.8, ge=0.0, le=2.0)


class Config(BaseModel):
    model: ModelConfig = Field(default_factory=ModelConfig)
    cwd: Path = Field(default_factory=Path.cwd)
    max_turns: int = 20
    developer_instructions: str | None = None

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
