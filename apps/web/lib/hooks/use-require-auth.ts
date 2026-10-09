"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { readSessionFromStorage, saveSession, type SessionUser } from "@/lib/auth";

export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = readSessionFromStorage();
    if (!session) {
      router.replace("/login");
      return;
    }

    saveSession(session);
    setUser(session);
    setIsLoading(false);
  }, [router]);

  return { user, isLoading };
}
