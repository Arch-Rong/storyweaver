"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSession } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("请输入用户名。");
      return;
    }
    if (!password) {
      setError("请输入密码。");
      return;
    }

    setPending(true);
    saveSession({
      username: trimmedUsername,
      displayName: trimmedUsername,
    });
    router.replace("/editor");
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="username">用户名</Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="你的笔名或账号"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="本地原型阶段任意密码即可"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "正在进入…" : "进入编辑器"}
      </Button>

      <p className="text-[0.82rem] leading-relaxed text-muted-foreground">
        当前为本地原型，登录状态保存在浏览器中。接入后端后会改为服务端鉴权。
      </p>
    </form>
  );
}
