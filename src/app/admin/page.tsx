import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { bookings, serviceStyles } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import AdminShell from "./admin-shell";

export default async function AdminDashboard() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  let stats = {
    bookings: 0,
    pending: 0,
    services: 0,
  };

  try {
    const [[bookingCount], [pendingCount], [serviceCount]] = await Promise.all([
      db.select({ value: count() }).from(bookings),
      db.select({ value: count() }).from(bookings).where(eq(bookings.status, "pending")),
      db.select({ value: count() }).from(serviceStyles),
    ]);

    stats = {
      bookings: bookingCount.value,
      pending: pendingCount.value,
      services: serviceCount.value,
    };
  } catch {}

  return (
    <AdminShell title="Dashboard">
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Bookings", stats.bookings, "All requests captured from the public booking modal."],
          ["Pending", stats.pending, "Slots waiting for review or deposit confirmation."],
          ["Services", stats.services, "Bookable styles currently stored in Neon."],
        ].map(([label, value, description]) => (
          <article key={label} className="rounded-[1.5rem] border border-[#dfd1bc] bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8a765b]">{label}</p>
            <p className="mt-4 text-4xl font-semibold">{value}</p>
            <p className="mt-3 text-sm leading-6 text-[#675c4c]">{description}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-3">
        <Link
          href="/admin/bookings"
          className="rounded-[1.5rem] border border-[#dfd1bc] bg-[#11100e] p-7 text-white shadow-xl transition hover:-translate-y-1"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-[#d1ad5f]">Operations</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
            Review bookings
          </h2>
          <p className="mt-4 max-w-md leading-7 text-[#c8beb0]">
            Filter by customer, status, date range, and service category with pagination.
          </p>
        </Link>
        <Link
          href="/admin/services"
          className="rounded-[1.5rem] border border-[#dfd1bc] bg-white p-7 shadow-sm transition hover:-translate-y-1"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-[#8a765b]">Catalogue</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
            Manage services
          </h2>
          <p className="mt-4 max-w-md leading-7 text-[#675c4c]">
            Add premium styles with pricing, image URLs, categories, and active states.
          </p>
        </Link>
        <Link
          href="/admin/admins"
          className="rounded-[1.5rem] border border-[#dfd1bc] bg-white p-7 shadow-sm transition hover:-translate-y-1"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-[#8a765b]">Security</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
            Add admins
          </h2>
          <p className="mt-4 max-w-md leading-7 text-[#675c4c]">
            Create database-backed admin accounts without relying on env passwords.
          </p>
        </Link>
      </section>
    </AdminShell>
  );
}
