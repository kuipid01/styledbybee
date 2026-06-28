import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { serviceStyles } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { services } from "@/lib/site-data";
import AdminShell from "../admin-shell";
import ServiceAdminForm from "./service-admin-form";

type AdminStyle = {
  id: string;
  slug: string;
  category: string;
  name: string;
  price: number;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
};

export default async function AdminServicesPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  let initialStyles: AdminStyle[] = services.map((service, index) => ({
    ...service,
    id: service.id,
    imageUrl: service.image,
    slug: service.id,
    sortOrder: index,
    isActive: true,
  }));

  try {
    const dbStyles = await db
      .select()
      .from(serviceStyles)
      .orderBy(asc(serviceStyles.sortOrder), asc(serviceStyles.name));

    if (dbStyles.length) {
      initialStyles = dbStyles.map((style) => ({
        id: style.id,
        slug: style.slug,
        category: style.category,
        name: style.name,
        price: style.price,
        imageUrl: style.imageUrl,
        isActive: style.isActive,
        sortOrder: style.sortOrder,
      }));
    }
  } catch {}

  return (
    <AdminShell title="Services">
      <ServiceAdminForm initialStyles={initialStyles} />
    </AdminShell>
  );
}
