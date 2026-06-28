import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import AdminShell from "../admin-shell";
import AdminUsersForm from "./admin-users-form";

export default async function AdminUsersPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  let admins: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
  }[] = [];

  try {
    admins = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        isActive: adminUsers.isActive,
        createdAt: adminUsers.createdAt,
      })
      .from(adminUsers)
      .orderBy(asc(adminUsers.email));
  } catch {}

  return (
    <AdminShell title="Admins">
      <AdminUsersForm initialAdmins={admins} />
    </AdminShell>
  );
}
