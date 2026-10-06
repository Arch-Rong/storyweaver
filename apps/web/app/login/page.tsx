import { LoginForm } from "@/components/login/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside
        className="hidden bg-[radial-gradient(circle_at_20%_20%,rgba(47,95,84,0.35),transparent_45%),linear-gradient(160deg,#121820_0%,#1e2733_100%)] text-[#e8ece9] lg:block"
        aria-hidden="true"
      >
        <div className="flex min-h-full max-w-[34rem] flex-col justify-center p-16">
          <p className="mb-10 font-serif text-2xl tracking-wide">StoryWeaver</p>
          <blockquote className="font-serif text-[1.75rem] font-medium leading-[1.65]">
            写作是一场与记忆的谈判。你写下每一个字，都在决定故事将走向何处。
          </blockquote>
          <p className="mt-8 text-[0.95rem] text-[#e8ece9]/70">小说协作工作台</p>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,253,248,0.9),#f4efe4)] p-5 lg:p-12">
        <Card className="w-full max-w-[26rem] shadow-[0_18px_48px_rgba(18,24,32,0.08)]">
          <CardHeader>
            <CardTitle>登录</CardTitle>
            <CardDescription>进入你的写作空间，继续未完成的故事。</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
