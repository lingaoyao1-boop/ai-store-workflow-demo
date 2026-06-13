import json
import os
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        if self.path != "/api/deepseek":
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length", "0"))
        payload = json.loads(self.rfile.read(length) or b"{}")
        api_key = self.headers.get("X-DeepSeek-API-Key", "").strip()
        if not api_key:
            api_key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
        if not api_key:
            self._json(400, {
                "error": "未配置 DEEPSEEK_API_KEY",
                "hint": "请点击页面右上角的“API 设置”输入密钥，或通过环境变量配置。",
            })
            return

        request_body = {
            "model": "deepseek-chat",
            "temperature": 0.2,
            "max_tokens": 900,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "你是连锁饮品企业的运营分析助手。必须遵守输入中的企业硬规则，"
                        "不得修改规则计算出的建议补货量。输出简洁中文，包含：今日结论、"
                        "风险清单、店长行动清单、需人工确认事项。不要编造输入之外的数据。"
                    ),
                },
                {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
            ],
        }

        req = urllib.request.Request(
            "https://api.deepseek.com/chat/completions",
            data=json.dumps(request_body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                result = json.loads(response.read())
            self._json(200, {
                "content": result["choices"][0]["message"]["content"],
                "usage": result.get("usage", {}),
                "model": result.get("model", "deepseek-chat"),
            })
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            self._json(exc.code, {"error": "DeepSeek API 请求失败", "detail": detail})
        except Exception as exc:
            self._json(500, {"error": "调用 DeepSeek 时发生错误", "detail": str(exc)})

    def _json(self, status, body):
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8765"))
    host = os.environ.get("HOST", "127.0.0.1")
    print(f"Demo running at http://{host}:{port}")
    ThreadingHTTPServer((host, port), Handler).serve_forever()
