import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { serviceStyles } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";

const updateStyleSchema = z.object({
  category: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  price: z.coerce.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.coerce.boolean().optional(),
});

async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

async function uploadStyleImage(imageFile: File) {
  const arrayBuffer = await imageFile.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUri = `data:${imageFile.type || "image/jpeg"};base64,${base64}`;

  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: "styledbybee/services",
    resource_type: "image",
  });

  return uploaded.secure_url;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();

  if (unauthorized) return unauthorized;

  const { id } = await params;
  const contentType = request.headers.get("content-type") ?? "";
  let payload: Record<string, FormDataEntryValue | boolean | undefined> = {};
  let imageFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const maybeFile = formData.get("imageFile");
    imageFile = maybeFile instanceof File && maybeFile.size > 0 ? maybeFile : null;
    payload = {
      category: String(formData.get("category") ?? ""),
      name: String(formData.get("name") ?? ""),
      price: String(formData.get("price") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? "") || undefined,
      sortOrder: String(formData.get("sortOrder") ?? "0"),
      isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    };
  } else {
    payload = await request.json();
  }

  const parsed = updateStyleSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid style payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updateValues = parsed.data;

  if (imageFile) {
    updateValues.imageUrl = await uploadStyleImage(imageFile);
  }

  const [updated] = await db
    .update(serviceStyles)
    .set({
      ...updateValues,
      updatedAt: new Date(),
    })
    .where(eq(serviceStyles.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Style not found" }, { status: 404 });
  }

  return NextResponse.json({ style: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();

  if (unauthorized) return unauthorized;

  const { id } = await params;
  const [deleted] = await db
    .delete(serviceStyles)
    .where(eq(serviceStyles.id, id))
    .returning({ id: serviceStyles.id });

  if (!deleted) {
    return NextResponse.json({ error: "Style not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted });
}
