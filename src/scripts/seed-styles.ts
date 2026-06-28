import "dotenv/config";

import { db } from "@/db";
import { serviceStyles } from "@/db/schema";
import { galleryImages, services } from "@/lib/site-data";

type Base44Service = {
  category?: string | null;
  duration_minutes?: number | null;
  price?: number | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  name?: string | null;
  active?: boolean | null;
  sort_order?: number | null;
};

type SeedService = {
  id: string;
  category: string;
  name: string;
  price: number;
  durationMinutes: number | null;
  image: string;
};

const base44ServicesUrl =
  "https://base44.app/api/apps/6a2b93d3255a6144de5bc3aa/entities/Service?sort=sort_order";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getSeedServices(): Promise<SeedService[]> {
  try {
    const response = await fetch(base44ServicesUrl, {
      headers: {
        Accept: "application/json",
        "X-App-Id": "6a2b93d3255a6144de5bc3aa",
      },
    });

    if (!response.ok) {
      throw new Error(`Base44 returned ${response.status}`);
    }

    const base44Services = (await response.json()) as Base44Service[];

    if (!base44Services.length) {
      throw new Error("Base44 returned no services");
    }

    return base44Services
      .filter((service) => service.active !== false)
      .map((service, index) => {
        const category = (service.category || "Uncategorized").trim();
        const name = (service.name || "Untitled").trim();

        return {
          id: slugify(`${category}-${name}-${index}`),
          category,
          name,
          price: Math.round(Number(service.price || 0)),
          durationMinutes: service.duration_minutes
            ? Math.round(Number(service.duration_minutes))
            : null,
          image:
            service.image_url ||
            service.image_urls?.[0] ||
            galleryImages[index % galleryImages.length],
        };
      })
      .filter((service) => service.price > 0);
  } catch (error) {
    console.warn("Could not fetch Base44 services. Falling back to local mock data.");
    console.warn(error);
    return services.map((service) => ({
      id: service.id,
      category: service.category,
      name: service.name,
      price: service.price,
      durationMinutes: null,
      image: service.image,
    }));
  }
}

async function main() {
  const seedServices = await getSeedServices();

  for (const [index, service] of seedServices.entries()) {
    await db
      .insert(serviceStyles)
      .values({
        slug: service.id,
        category: service.category,
        name: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
        imageUrl: service.image,
        sortOrder: index,
      })
      .onConflictDoUpdate({
        target: serviceStyles.slug,
        set: {
          category: service.category,
          name: service.name,
          price: service.price,
          durationMinutes: service.durationMinutes,
          imageUrl: service.image,
          sortOrder: index,
          isActive: true,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`Seeded ${seedServices.length} service styles.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
