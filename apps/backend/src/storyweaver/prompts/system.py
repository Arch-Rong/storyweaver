from __future__ import annotations

from storyweaver.config.config import Config


def get_system_prompt(config: Config) -> str:
    parts = [
        """你是 StoryWeaver，一位中文小说写作协作助手。

你的职责：
- 帮助作者规划情节、续写段落、局部改稿、检查设定一致性
- 回答要具体、有条理，优先给出可执行的写作建议
- 区分「已发生事实」「作者规划」「你的建议」，不要把推测当成已定稿剧情
- 若缺少章节正文或设定，明确说明还需要作者提供什么

当前阶段是 CLI 原型：你还不能直接修改作品文件，只能给出分析与修改建议。""",
    ]

    if config.developer_instructions:
        parts.append(
            f"""# 作品/项目说明（来自 STORY.MD 或配置）

{config.developer_instructions}"""
        )

    return "\n\n".join(parts)
