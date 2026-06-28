import "dotenv/config";

import bcrypt from "bcryptjs";

import { db } from "@/db";
import { adminUsers } from "@/db/schema";

const email = "kuipid01@gmail.com";
const password = "Stephen614";

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  await db
    .insert(adminUsers)
    .values({
      email,
      name: "Stephen",
      passwordHash,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: adminUsers.email,
      set: {
        name: "Stephen",
        passwordHash,
        isActive: true,
        updatedAt: new Date(),
      },
    });

  console.log(`Seeded admin ${email}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
