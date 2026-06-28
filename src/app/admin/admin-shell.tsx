import Link from "next/link";

export default function AdminShell({
  title,
  eyebrow = "StyledByBee Admin",
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#161412]">
      <header className="border-b border-[#ded0b8] bg-white/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#8a765b]">
              {eyebrow}
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em]">{title}</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <Link className="admin-nav-link" href="/admin">
              Dashboard
            </Link>
            <Link className="admin-nav-link" href="/admin/bookings">
              Bookings
            </Link>
            <Link className="admin-nav-link" href="/admin/services">
              Services
            </Link>
            <Link className="admin-nav-link" href="/admin/admins">
              Admins
            </Link>
            <form action="/api/admin/logout" method="post">
              <button className="admin-nav-link">Sign out</button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </main>
  );
}
