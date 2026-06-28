import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { serviceStyles } from "@/db/schema";
import { services } from "@/lib/site-data";

export async function GET() {
  try {
    const styles = await db
      .select({
        id: serviceStyles.slug,
        category: serviceStyles.category,
        name: serviceStyles.name,
        price: serviceStyles.price,
        durationMinutes: serviceStyles.durationMinutes,
        image: serviceStyles.imageUrl,
      })
      .from(serviceStyles)
      .where(eq(serviceStyles.isActive, true))
      .orderBy(asc(serviceStyles.sortOrder), asc(serviceStyles.name));

    return NextResponse.json({
      source: "database",
      styles,
    });
  } catch {
    return NextResponse.json({
      source: "fallback",
      styles: services,
    });
  }
}
