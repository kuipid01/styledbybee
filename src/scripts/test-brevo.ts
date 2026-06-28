import "dotenv/config";

import { sendAdminMail } from "@/lib/brevo";
import { env } from "@/lib/env";

async function main() {
  const result = await sendAdminMail({
    to: env.ADMIN_EMAIL,
    subject: "StyledByBee Brevo test",
    htmlContent: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h1>StyledByBee mail test</h1>
        <p>If you received this, Brevo is configured correctly.</p>
        <p>Sent from the local Website Clone Admin project.</p>
      </div>
    `,
  });

  console.log("Brevo test mail sent.");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
