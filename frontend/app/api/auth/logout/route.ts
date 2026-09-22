import { cookies } from "next/headers";

import { DEV_SESSION_COOKIE_NAME } from "@/lib/dev-session";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: DEV_SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  return Response.json({ ok: true });
}
