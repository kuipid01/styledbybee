import Link from "next/link";

import { galleryImages, site } from "@/lib/site-data";
import LoginSubmitButton from "./login-submit-button";

export default function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative hidden overflow-hidden border-r border-border lg:block">
        <img
          src={galleryImages[0]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/15" />
        <div className="absolute bottom-10 left-10 right-10">
          <p className="eyebrow">{site.tagline}</p>
          <h1 className="mt-4 max-w-xl text-6xl font-semibold leading-[0.95] tracking-[-0.07em]">
            {site.name} admin.
          </h1>
          <p className="mt-6 max-w-md leading-7 text-muted-foreground">
            Manage bookings, services, uploaded style images, and admin access.
          </p>
        </div>
      </section>
      <section className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="text-sm font-medium text-primary">
            Back to site
          </Link>
          <div className="mt-8 rounded-[2rem] border border-border bg-card p-8 shadow-2xl">
            <p className="eyebrow">SECURE ACCESS</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
              Sign in to StyledByBee.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use your database admin account. The first admin is seeded during DB initialization.
            </p>
            <form action="/api/admin/login" method="post" className="mt-8 space-y-5">
              <label className="block text-sm font-semibold">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
                />
              </label>
              <label className="block text-sm font-semibold">
                Password
                <input
                  name="password"
                  type="password"
                  required
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
                />
              </label>
              <ErrorMessage searchParams={searchParams} />
              <LoginSubmitButton />
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

async function ErrorMessage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  if (!params.error) {
    return null;
  }

  return (
    <p className="rounded-2xl border border-red-400/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      Invalid admin credentials or the admin has not been seeded yet.
    </p>
  );
}
