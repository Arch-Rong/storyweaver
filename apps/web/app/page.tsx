import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE, parseSession } from "@/lib/auth";

export default async function RootPage() {
  const cookieStore = await cookies();
  const session = parseSession(cookieStore.get(SESSION_COOKIE)?.value);

  redirect(session ? "/home" : "/login");
}
