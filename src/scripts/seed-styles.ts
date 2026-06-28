import "dotenv/config";

import { db } from "@/db";
import { serviceStyles } from "@/db/schema";
import { services } from "@/lib/site-data";

async function main() {
  for (const [index, service] of services.entries()) {
    await db
      .insert(serviceStyles)
      .values({
        slug: service.id,
        category: service.category,
        name: service.name,
        price: service.price,
        imageUrl: service.image,
        sortOrder: index,
      })
      .onConflictDoUpdate({
        target: serviceStyles.slug,
        set: {
          category: service.category,
          name: service.name,
          price: service.price,
          imageUrl: service.image,
          sortOrder: index,
          isActive: true,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`Seeded ${services.length} service styles.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
