"use client";

import { ChevronDown, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearSession, type SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

type HeaderProps = {
  user: SessionUser;
  brandLabel?: string;
  brandHref?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  onLogout?: () => void;
};

export function Header({
  user,
  brandLabel = "STORYWEAVER",
  brandHref,
  leading,
  trailing,
  className,
  onLogout,
}: HeaderProps) {
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);

  function handleLogout() {
    if (onLogout) {
      onLogout();
      setLogoutOpen(false);
      return;
    }

    clearSession();
    setLogoutOpen(false);
    router.replace("/login");
  }

  const brandClassName =
    "shrink-0 text-xs font-medium tracking-widest text-primary transition-colors hover:text-primary/80";

  return (
    <>
      <header
        className={cn(
          "glass-toolbar flex flex-wrap items-center justify-between gap-4 px-5 py-2.5 sm:px-8",
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {brandHref ? (
            <Link href={brandHref} className={brandClassName}>
              {brandLabel}
            </Link>
          ) : (
            <p className={brandClassName}>{brandLabel}</p>
          )}

          {leading ? (
            <>
              <div className="h-3.5 w-px shrink-0 bg-border" aria-hidden="true" />
              <div className="flex min-w-0 flex-1 items-center gap-4">{leading}</div>
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {trailing}
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1 px-2.5">
                {user.displayName}
                <ChevronDown className="size-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>当前账号</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLogoutOpen(true)}>
                <LogOut className="size-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认退出？</DialogTitle>
            <DialogDescription>
              退出后本地草稿仍会保留。下次用相同用户名登录即可继续编辑。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              取消
            </Button>
            <Button onClick={handleLogout}>退出登录</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
