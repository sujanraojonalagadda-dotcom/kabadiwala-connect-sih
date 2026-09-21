import { db } from "@/prisma/db";

export async function GET() {
  try {
    const plan = db.sql.public.user
      .select("id")
      .limit(1)
      .build();

    await db.runtime().query(plan);

    return Response.json({
      ok: true,
      database: "connected",
    });
  } catch (error) {
    console.error("DATABASE ERROR:", error);

    return Response.json(
      {
        ok: false,
        database: "disconnected",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}