import { NextResponse } from "next/server";

import { cloudinary } from "@/lib/cloudinary";
import { env } from "@/lib/env";

export async function GET() {
  const cloudinaryReady = Boolean(cloudinary.config().cloud_name);

  return NextResponse.json({
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    neonConfigured: env.DATABASE_URL.length > 0,
    cloudinaryReady,
    brevoConfigured: env.BREVO_API_KEY.length > 0,
  });
}
