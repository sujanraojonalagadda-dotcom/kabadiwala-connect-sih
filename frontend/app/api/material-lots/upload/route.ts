import { getCurrentUser } from "@/lib/current-user";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const BUCKET_NAME = "material-lot-photos";

export async function POST(request: Request) {
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

    if (currentUser.role !== "COLLECTOR") {
      return Response.json(
        {
          ok: false,
          error: "Only collectors can upload material photos.",
        },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        {
          ok: false,
          error: "Photo file is required.",
        },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return Response.json(
        {
          ok: false,
          error: "Only image files are allowed.",
        },
        { status: 400 },
      );
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return Response.json(
        {
          ok: false,
          error: "Photo must be 10 MB or smaller.",
        },
        { status: 400 },
      );
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const filePath = `${currentUser.id}/${crypto.randomUUID()}.${extension}`;

    const supabase = createServerSupabaseClient();
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("PHOTO UPLOAD ERROR:", uploadError);

      return Response.json(
        {
          ok: false,
          error: uploadError.message,
        },
        { status: 500 },
      );
    }

    return Response.json(
      {
        ok: true,
        bucket: BUCKET_NAME,
        path: filePath,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("PHOTO UPLOAD API ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload photo.",
      },
      { status: 500 },
    );
  }
}
