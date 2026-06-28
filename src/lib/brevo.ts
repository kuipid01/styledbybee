import { BrevoClient } from "@getbrevo/brevo";

import { env } from "@/lib/env";

export const brevo = new BrevoClient({
  apiKey: env.BREVO_API_KEY,
});

export async function sendAdminMail({
  subject,
  htmlContent,
  to,
}: {
  subject: string;
  htmlContent: string;
  to: string;
}) {
  return brevo.transactionalEmails.sendTransacEmail({
    subject,
    htmlContent,
    sender: {
      email: env.BREVO_SENDER_EMAIL,
      name: env.BREVO_SENDER_NAME,
    },
    to: [{ email: to }],
  });
}
