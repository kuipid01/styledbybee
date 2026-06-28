import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { serviceStyles } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";

const styleSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  price: z.coerce.number().int().positive(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function GET() {
  const unauthorized = await requireAdmin();

  if (unauthorized) {
    return unauthorized;
  }

  const styles = await db
    .select()
    .from(serviceStyles)
    .orderBy(asc(serviceStyles.sortOrder), asc(serviceStyles.name));

  return NextResponse.json({ styles });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();

  if (unauthorized) {
    return unauthorized;
  }

  const contentType = request.headers.get("content-type") ?? "";
  let payload: Record<string, FormDataEntryValue | boolean> = {};
  let imageFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    payload = {
      category: String(formData.get("category") ?? ""),
      name: String(formData.get("name") ?? ""),
      price: String(formData.get("price") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? ""),
      sortOrder: String(formData.get("sortOrder") ?? "0"),
      isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    };
    const maybeFile = formData.get("imageFile");
    imageFile = maybeFile instanceof File && maybeFile.size > 0 ? maybeFile : null;
  } else {
    payload = await request.json();
  }

  const parsed = styleSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid style payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const style = parsed.data;
  let imageUrl = style.imageUrl || "";

  if (imageFile) {
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${imageFile.type || "image/jpeg"};base64,${base64}`;
    const uploaded = await cloudinary.uploader.upload(dataUri, {
      folder: "styledbybee/services",
      resource_type: "image",
    });
    imageUrl = uploaded.secure_url;
  }

  if (!imageUrl) {
    return NextResponse.json(
      { error: "Provide an image URL or upload an image file." },
      { status: 400 },
    );
  }

  const baseSlug = slugify(`${style.category}-${style.name}`);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const [created] = await db
    .insert(serviceStyles)
    .values({
      slug,
      category: style.category,
      name: style.name,
      price: style.price,
      imageUrl,
      sortOrder: style.sortOrder,
      isActive: style.isActive,
    })
    .returning();

  return NextResponse.json({ style: created }, { status: 201 });
}
