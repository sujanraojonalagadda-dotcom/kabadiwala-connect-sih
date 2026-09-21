import { cookies } from "next/headers";

import { db } from "@/prisma/db";
import {
  DEV_SESSION_COOKIE_NAME,
  verifyDevSession,
} from "@/lib/dev-session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(DEV_SESSION_COOKIE_NAME)?.value;

  const session = verifyDevSession(sessionValue);

  if (!session) {
    return null;
  }

  const user = await db.orm.public.User
    .where({ id: session.userId })
    .select("id", "phone", "role")
    .first();

  return user ?? null;
}
