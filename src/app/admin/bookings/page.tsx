import { and, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { bookings } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import AdminShell from "../admin-shell";

type SearchParams = {
  q?: string;
  status?: string;
  category?: string;
  from?: string;
  to?: string;
  page?: string;
  pageSize?: string;
};

const bookingStatuses = ["pending", "confirmed", "completed", "cancelled"];

function currency(value: number) {
  return `£${value.toLocaleString("en-GB")}`;
}

function pageHref(params: SearchParams, page: number) {
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") next.set(key, value);
  }

  next.set("page", String(page));
  return `/admin/bookings?${next.toString()}`;
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const page = Math.max(Number(params.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(params.pageSize ?? 10), 5), 50);
  const offset = (page - 1) * pageSize;
  const filters = [];

  if (params.q) {
    filters.push(
      or(
        ilike(bookings.name, `%${params.q}%`),
        ilike(bookings.email, `%${params.q}%`),
        ilike(bookings.phone, `%${params.q}%`),
        ilike(bookings.serviceName, `%${params.q}%`),
      ),
    );
  }

  if (params.status && bookingStatuses.includes(params.status)) {
    filters.push(eq(bookings.status, params.status));
  }

  if (params.category) {
    filters.push(eq(bookings.serviceCategory, params.category));
  }

  if (params.from) {
    filters.push(gte(bookings.preferredDate, params.from));
  }

  if (params.to) {
    filters.push(lte(bookings.preferredDate, params.to));
  }

  const where = filters.length ? and(...filters) : undefined;
  let rows: (typeof bookings.$inferSelect)[] = [];
  let total = 0;
  let allRows: (typeof bookings.$inferSelect)[] = [];
  let dbError = "";

  try {
    [rows, [{ value: total }], allRows] = await Promise.all([
      db
        .select()
        .from(bookings)
        .where(where)
        .orderBy(desc(bookings.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ value: count() }).from(bookings).where(where),
      db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(500),
    ]);
  } catch {
    dbError = "Bookings will appear here after Neon is connected and db:push has run.";
  }

  const categories = Array.from(new Set(allRows.map((booking) => booking.serviceCategory)));
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const pending = allRows.filter((booking) => booking.status === "pending").length;
  const revenue = allRows.reduce((sum, booking) => sum + booking.price, 0);

  return (
    <AdminShell title="Bookings">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Total bookings", total],
          ["Pending", pending],
          ["Projected value", currency(revenue)],
          ["Page", `${page} / ${totalPages}`],
        ].map(([label, value]) => (
          <article key={label} className="rounded-[1.25rem] border border-[#dfd1bc] bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8a765b]">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
          </article>
        ))}
      </section>

      <form className="mt-6 rounded-[1.5rem] border border-[#dfd1bc] bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto]">
          <label className="text-sm font-medium">
            Search
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Name, email, phone, style"
              className="admin-input"
            />
          </label>
          <label className="text-sm font-medium">
            Status
            <select name="status" defaultValue={params.status ?? ""} className="admin-input">
              <option value="">All statuses</option>
              {bookingStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Category
            <select name="category" defaultValue={params.category ?? ""} className="admin-input">
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            From
            <input name="from" type="date" defaultValue={params.from} className="admin-input" />
          </label>
          <label className="text-sm font-medium">
            To
            <input name="to" type="date" defaultValue={params.to} className="admin-input" />
          </label>
          <label className="text-sm font-medium">
            Size
            <select name="pageSize" defaultValue={String(pageSize)} className="admin-input">
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-full bg-[#11100e] px-5 py-2.5 text-sm font-semibold text-white">
            Apply filters
          </button>
          <Link className="rounded-full border border-[#c9b99f] px-5 py-2.5 text-sm font-semibold" href="/admin/bookings">
            Reset
          </Link>
        </div>
      </form>

      <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#dfd1bc] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f7f1e8] text-xs uppercase tracking-[0.14em] text-[#8a765b]">
              <tr>
                <th className="px-5 py-4">Client</th>
                <th className="px-5 py-4">Style</th>
                <th className="px-5 py-4">Preferred</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eadfce]">
              {rows.map((booking) => (
                <tr key={booking.id} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-semibold">{booking.name}</p>
                    <p className="mt-1 text-[#675c4c]">{booking.email}</p>
                    <p className="text-[#675c4c]">{booking.phone}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{booking.serviceName}</p>
                    <p className="mt-1 text-[#675c4c]">{booking.serviceCategory}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p>{booking.preferredDate}</p>
                    <p className="mt-1 text-[#675c4c]">{booking.preferredTime}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[#11100e] px-3 py-1.5 text-xs font-semibold text-white">
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold">{currency(booking.price)}</td>
                  <td className="max-w-xs px-5 py-4 text-[#675c4c]">{booking.notes || "None"}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[#675c4c]">
                    {dbError || "No bookings match the current filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Link
          href={pageHref(params, Math.max(page - 1, 1))}
          className={`rounded-full border border-[#c9b99f] px-4 py-2 text-sm font-semibold ${
            page <= 1 ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Previous
        </Link>
        <p className="text-sm text-[#675c4c]">
          Showing {rows.length ? offset + 1 : 0}-{offset + rows.length} of {total}
        </p>
        <Link
          href={pageHref(params, Math.min(page + 1, totalPages))}
          className={`rounded-full border border-[#c9b99f] px-4 py-2 text-sm font-semibold ${
            page >= totalPages ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Next
        </Link>
      </div>
    </AdminShell>
  );
}
