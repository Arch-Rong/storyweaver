import { GuestLayout } from "@/components/common/layout";
import { LoginForm } from "@/components/login/LoginForm";

export default function LoginPage() {
  return (
    <GuestLayout
      footer={
        <p className="text-[11px] leading-relaxed text-muted-foreground/45">
          写作是一场与记忆的谈判
        </p>
      }
    >
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-20 sm:px-8">
        <div className="w-full max-w-[19rem]">
          <div className="mb-10 text-center">
            <p className="text-[11px] font-medium tracking-[0.22em] text-primary">STORYWEAVER</p>
            <div className="login-brand-line" aria-hidden="true" />
            <h1 className="mt-6 text-xl font-medium tracking-tight text-foreground">登录</h1>
            <p className="mt-2 text-sm text-muted-foreground">继续你未完成的故事</p>
          </div>

          <LoginForm />
        </div>
      </main>
    </GuestLayout>
  );
}
