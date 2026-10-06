"""组装 Config 对象（loader = 加载器）。

和 config.py 的分工：
- config.py：定义 Config 有哪些字段、默认值、校验
- loader.py：启动时创建 Config 实例（目前只设置 cwd）

启动 CLI 时的顺序（cli.py）：
1. load_dotenv()     → .env 载入环境变量（API_KEY、BASE_URL、MODEL_NAME）
2. load_config(cwd)  → 返回 Config（其余项用 config.py 默认值 + .env）
3. config.validate() → 检查密钥是否齐全
4. 传给 Agent / LLMClient
"""

from __future__ import annotations

from pathlib import Path

from storyweaver.config.config import Config


def load_config(cwd: Path | None = None) -> Config:
    """创建 Config 实例。

    Args:
        cwd: 作品/项目目录；None 则用当前终端工作目录。
             预留给以后读章节文件等工具；P0 只保存路径，不读额外配置文件。

    配置来源：
    - .env：API_KEY、BASE_URL、MODEL_NAME（由 Config 属性从 os.environ 读取）
    - config.py 默认值：temperature、max_turns、默认 model.name 等
    """
    return Config(cwd=cwd or Path.cwd())
