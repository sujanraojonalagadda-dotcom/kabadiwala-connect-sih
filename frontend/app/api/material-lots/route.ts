import { db } from "@/prisma/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const collectorId = url.searchParams.get("collectorId")?.trim();

    if (!collectorId) {
      return Response.json(
        {
          ok: false,
          error: "collectorId is required",
        },
        { status: 400 },
      );
    }

    const rows = await db.orm.public.MaterialLot
      .where({ collectorId })
      .orderBy((lot) => lot.createdAt.desc())
      .all();

    return Response.json({
      ok: true,
      materialLots: rows,
    });
  } catch (error) {
    console.error("GET MATERIAL LOTS ERROR:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const collectorId =
      typeof body.collectorId === "string"
        ? body.collectorId.trim()
        : "";

    const material =
      typeof body.material === "string"
        ? body.material.trim()
        : "";

    const weightKg = Number(body.weightKg);

    const photoUrl =
      typeof body.photoUrl === "string"
        ? body.photoUrl.trim()
        : null;

    if (!collectorId) {
      return Response.json(
        {
          ok: false,
          error: "collectorId is required",
        },
        { status: 400 },
      );
    }

    if (!material) {
      return Response.json(
        {
          ok: false,
          error: "material is required",
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      return Response.json(
        {
          ok: false,
          error: "weightKg must be greater than 0",
        },
        { status: 400 },
      );
    }

    const allowedMaterials = [
      "E_WASTE",
      "PLASTIC",
      "METAL",
      "PAPER",
      "OTHER",
    ];

    if (!allowedMaterials.includes(material)) {
      return Response.json(
        {
          ok: false,
          error: "Invalid material category",
        },
        { status: 400 },
      );
    }

    const plan = db.sql.public.materialLot
      .insert([
        {
          id: crypto.randomUUID(),
          collectorId,
          material,
          weightKg: weightKg.toString(),
          photoUrl,
          description: null,
        },
      ])
      .returning("id")
      .build();

    const result = await db.runtime().query(plan);

    return Response.json(
      {
        ok: true,
        materialLot: result,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE MATERIAL LOT ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}