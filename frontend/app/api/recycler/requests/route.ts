import { db } from "@/prisma/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        {
          ok: false,
          error: "Authentication required.",
        },
        { status: 401 },
      );
    }

    if (currentUser.role !== "RECYCLER") {
      return Response.json(
        {
          ok: false,
          error: "Recycler access required.",
        },
        { status: 403 },
      );
    }

    const recycler = await db.orm.public.Recycler
      .where({ userId: currentUser.id })
      .first();

    if (!recycler) {
      return Response.json(
        {
          ok: false,
          error: "Recycler profile not found.",
        },
        { status: 404 },
      );
    }

    if (recycler.verificationStatus !== "VERIFIED") {
      return Response.json(
        {
          ok: false,
          error: "Recycler is not verified.",
        },
        { status: 403 },
      );
    }

    const requests = await db.orm.public.RecyclingRequest
      .where({ recyclerId: currentUser.id })
      .all();

    const enrichedRequests = await Promise.all(
      requests.map(async (requestItem) => {
        const collector = await db.orm.public.User
          .where({ id: requestItem.collectorId })
          .first();

        const profile = await db.orm.public.Profile
          .where({ userId: requestItem.collectorId })
          .first();

        return {
          ...requestItem,
          collector: collector
            ? {
                id: collector.id,
                phone: collector.phone,
                profile: profile
                  ? {
                      fullName: profile.fullName,
                      language: profile.language,
                    }
                  : null,
              }
            : null,
        };
      }),
    );

    return Response.json({
      ok: true,
      requests: enrichedRequests,
    });
  } catch (error) {
    console.error("GET RECYCLER REQUESTS ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load recycler requests.",
      },
      { status: 500 },
    );
  }
}
