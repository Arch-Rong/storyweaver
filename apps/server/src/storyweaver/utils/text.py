"""文本相关的小工具（utils = utilities，通用辅助函数）。

本模块目前只做一件事：估算一段文字占多少 Token。
Token 是大模型计费、上下文窗口（能塞多少字）的基本单位；
ContextManager 在记录每条对话时会调用 count_tokens，方便以后做「上下文太长就裁剪」。
"""

import tiktoken
# tiktoken：OpenAI 官方常用的分词库，把字符串切成 token 列表，和 API 计费口径接近


def count_tokens(text: str, model: str = "deepseek-chat") -> int:
    """计算 text 大约有多少个 token。

    Args:
        text: 任意字符串（用户消息、助手回复、system prompt 等）
        model: 当前使用的模型名，不同模型可能用不同分词方式

    Returns:
        token 数量（整数）
    """
    try:
        # 优先：按模型名找「专用」编码器（如 gpt-4 系列）
        encoding = tiktoken.encoding_for_model(model)
    except Exception:
        # 降级：DeepSeek 等自定义模型名不在 tiktoken 内置列表里时会抛错
        # 用 cl100k_base（GPT-3.5/4 常用编码）近似估算，比完全不算强
        encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(text))
    # encode 把文本变成 token id 列表，len(...) 就是 token 个数


# 谁在用？
# - context/manager.py：add_user_message / add_assistant_message 时写入 MessageItem.token_count
# 现在还没做「超预算自动删旧消息」，但先把数字记下来，后面加裁剪逻辑不用改接口。
