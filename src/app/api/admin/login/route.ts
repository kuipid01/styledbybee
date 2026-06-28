import { NextResponse } from "next/server";

import { createAdminSession, verifyAdminPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.formData();
  const email = String(body.get("email") ?? "");
  const password = String(body.get("password") ?? "");

  if (!(await verifyAdminPassword(email, password))) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), {
      status: 303,
    });
  }

  await createAdminSession(email.toLowerCase());
  return NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
}
