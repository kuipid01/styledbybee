import bcrypt from "bcryptjs";
import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";

const adminSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
  isActive: z.coerce.boolean().default(true),
});

async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function GET() {
  const unauthorized = await requireAdmin();

  if (unauthorized) return unauthorized;

  const admins = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      isActive: adminUsers.isActive,
      createdAt: adminUsers.createdAt,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.email));

  return NextResponse.json({ admins });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();

  if (unauthorized) return unauthorized;

  const parsed = adminSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid admin payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = parsed.data;
  const passwordHash = await bcrypt.hash(admin.password, 10);
  const [created] = await db
    .insert(adminUsers)
    .values({
      email: admin.email.toLowerCase(),
      name: admin.name,
      passwordHash,
      isActive: admin.isActive,
    })
    .onConflictDoUpdate({
      target: adminUsers.email,
      set: {
        name: admin.name,
        passwordHash,
        isActive: admin.isActive,
        updatedAt: new Date(),
      },
    })
    .returning({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      isActive: adminUsers.isActive,
      createdAt: adminUsers.createdAt,
    });

  return NextResponse.json({ admin: created }, { status: 201 });
}
