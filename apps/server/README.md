# StoryWeaver Backend

Python Agent 后端（P0：CLI 原型）。

## 开发

```bash
cd apps/backend
uv venv && source .venv/bin/activate
uv pip install -e .
cp .env.example .env   # 填写 API_KEY、BASE_URL
python -m storyweaver.cli
```
