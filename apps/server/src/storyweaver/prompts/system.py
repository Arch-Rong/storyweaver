"""大模型「系统提示词」模板（prompts = 发给模型的指令文案）。

prompts/ 目录专门放各类提示词，不和业务逻辑混在一起：
- system.py：全局 system 角色设定（每次对话都会带上）
- 以后可扩展：revise.py（改稿专用）、outline.py（大纲专用）等

system 消息在 API 里 role="system"，用来定调：你是谁、能做什么、不能做什么。
"""

from __future__ import annotations

from storyweaver.config.config import Config


def get_system_prompt(config: Config) -> str:
    """拼出完整的 system 提示词字符串。

    调用时机：ContextManager 初始化时调用一次，结果缓存在 _system_prompt 里。
    每次请求大模型时，这条内容会作为 messages 的第一条（role=system）发出去。

    Args:
        config: 运行配置（P0 主要用固定人设；cwd 等留给后续扩展）

    Returns:
        多段文字用空行拼接后的 system prompt
    """
    parts = [
        # 第 1 段：固定「人设 + 行为准则」，所有用户、所有任务共用
        """你是 StoryWeaver，一位中文小说写作协作助手。

你的职责：
- 帮助作者规划情节、续写段落、局部改稿、检查设定一致性
- 回答要具体、有条理，优先给出可执行的写作建议
- 区分「已发生事实」「作者规划」「你的建议」，不要把推测当成已定稿剧情
- 若缺少章节正文或设定，明确说明还需要作者提供什么

当前阶段是 CLI 原型：你还不能直接修改作品文件，只能给出分析与修改建议。""",
    ]

    return "\n\n".join(parts)


# 谁在用？
# context/manager.py → get_messages() 里：
#   messages = [{"role": "system", "content": self._system_prompt}, ...用户/助手历史...]
