import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { bookings } from "@/db/schema";
import { sendAdminMail } from "@/lib/brevo";
import { env } from "@/lib/env";

const allowedBookingDays = new Set(["Sunday", "Friday", "Saturday"]);

function getDayName(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(date);
}

function isAllowedTime(dateValue: string, timeValue: string) {
  const dayName = getDayName(dateValue);
  const [hourText, minuteText] = timeValue.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!allowedBookingDays.has(dayName) || minute !== 0) {
    return false;
  }

  if (dayName === "Sunday") {
    return hour >= 12 && hour <= 19;
  }

  return hour >= 10 && hour <= 19;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const bookingSchema = z
  .object({
    serviceId: z.string().min(1),
    serviceCategory: z.string().min(1),
    serviceName: z.string().min(1),
    price: z.coerce.number().int().positive(),
    durationMinutes: z.coerce.number().int().positive().nullable().optional(),
    name: z.string().min(2),
    phone: z.string().min(6),
    email: z.string().email(),
    preferredDate: z.string().min(1),
    preferredTime: z.string().min(1),
    notes: z.string().optional().default(""),
  })
  .superRefine((booking, context) => {
    const dayName = getDayName(booking.preferredDate);

    if (!allowedBookingDays.has(dayName)) {
      context.addIssue({
        code: "custom",
        message: "We're only open on: Sunday, Friday, Saturday.",
        path: ["preferredDate"],
      });
    }

    if (!isAllowedTime(booking.preferredDate, booking.preferredTime)) {
      context.addIssue({
        code: "custom",
        message: "Choose an available time slot for the selected day.",
        path: ["preferredTime"],
      });
    }
  });

function formatDuration(minutes?: number | null) {
  if (!minutes) return "";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const parts: string[] = [];

  if (hours) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }

  if (remainingMinutes) {
    parts.push(`${remainingMinutes} mins`);
  }

  return parts.join(" ");
}

function emailShell(content: string) {
  return `
    <div style="margin:0;background:#0d0d0c;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#f5f5f5;">
      <div style="max-width:680px;margin:0 auto;overflow:hidden;border:1px solid #3b3429;border-radius:28px;background:#171614;">
        <div style="padding:30px 30px 24px;border-bottom:1px solid #3b3429;background:linear-gradient(135deg,#191713,#0f0f0f);">
          <p style="margin:0;color:#d1ad5f;font-size:12px;letter-spacing:5px;text-transform:uppercase;">STYLEDBYBEE</p>
          <h1 style="margin:14px 0 0;font-family:Georgia,serif;font-size:34px;line-height:1.05;color:#ffffff;">Booking receipt</h1>
          <p style="margin:12px 0 0;color:#b3ada4;line-height:1.6;">South East London hairstylist · 110, 112 Rye Ln, London SE15 4RZ</p>
        </div>
        ${content}
        <div style="padding:22px 30px;border-top:1px solid #3b3429;color:#8f8679;font-size:12px;line-height:1.7;">
          <p style="margin:0;">Questions? Reply to this email or contact StyledByBee directly.</p>
        </div>
      </div>
    </div>
  `;
}

function detailRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:12px 0;color:#8f8679;font-size:12px;letter-spacing:2px;text-transform:uppercase;">${label}</td>
      <td style="padding:12px 0;color:#f5f5f5;text-align:right;font-weight:600;">${value}</td>
    </tr>
  `;
}

export async function POST(request: Request) {
  const parsed = bookingSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const booking = parsed.data;
  const bookingInsert = {
    serviceId: booking.serviceId,
    serviceCategory: booking.serviceCategory,
    serviceName: booking.serviceName,
    price: booking.price,
    name: booking.name,
    phone: booking.phone,
    email: booking.email,
    preferredDate: booking.preferredDate,
    preferredTime: booking.preferredTime,
    notes: booking.notes,
  };
  const [created] = await db.insert(bookings).values(bookingInsert).returning();
  const safeBooking = {
    serviceCategory: escapeHtml(booking.serviceCategory),
    serviceName: escapeHtml(booking.serviceName),
    name: escapeHtml(booking.name),
    phone: escapeHtml(booking.phone),
    email: escapeHtml(booking.email),
    preferredDate: escapeHtml(booking.preferredDate),
    preferredTime: escapeHtml(booking.preferredTime),
    notes: escapeHtml(booking.notes || "None"),
  };
  const safeDuration = escapeHtml(formatDuration(booking.durationMinutes));
  const serviceLine = `${safeBooking.serviceCategory} - ${safeBooking.serviceName}`;
  const durationRow = safeDuration ? detailRow("Duration", safeDuration) : "";

  await Promise.all([
    sendAdminMail({
      to: env.ADMIN_EMAIL,
      subject: `New StyledByBee booking: ${booking.serviceName}`,
      htmlContent: emailShell(`
        <div style="padding:30px;">
          <p style="margin:0 0 18px;color:#d1ad5f;font-weight:700;">New booking request</p>
          <table role="presentation" style="width:100%;border-collapse:collapse;">
            ${detailRow("Client", safeBooking.name)}
            ${detailRow("Phone", safeBooking.phone)}
            ${detailRow("Email", safeBooking.email)}
            ${detailRow("Service", serviceLine)}
            ${detailRow("Total", `&pound;${booking.price}`)}
            ${durationRow}
            ${detailRow("Preferred", `${safeBooking.preferredDate} at ${safeBooking.preferredTime}`)}
            ${detailRow("Notes", safeBooking.notes)}
          </table>
        </div>
      `),
    }),
    sendAdminMail({
      to: booking.email,
      subject: `StyledByBee booking receipt: ${booking.serviceName}`,
      htmlContent: emailShell(`
        <div style="padding:30px;">
          <p style="margin:0 0 18px;color:#b3ada4;line-height:1.7;">Hi ${safeBooking.name}, your booking request has been received. StyledByBee will confirm your slot once the deposit is secured.</p>
          <div style="margin:22px 0;padding:18px;border:1px solid #a87916;border-radius:18px;background:#3b2a0d;color:#ffc64f;font-weight:800;">
            NOTE: A &pound;20 NON-REFUNDABLE DEPOSIT IS REQUIRED to secure your booking.
          </div>
          <table role="presentation" style="width:100%;border-collapse:collapse;">
            ${detailRow("Service", serviceLine)}
            ${detailRow("Total", `&pound;${booking.price}`)}
            ${detailRow("Deposit due", "&pound;20")}
            ${durationRow}
            ${detailRow("Preferred date", safeBooking.preferredDate)}
            ${detailRow("Preferred time", safeBooking.preferredTime)}
            ${detailRow("Notes", safeBooking.notes)}
          </table>
          <div style="margin-top:24px;padding:18px;border-radius:18px;background:#0f0f0f;color:#b3ada4;line-height:1.7;">
            <strong style="color:#f5f5f5;">Before your appointment</strong><br />
            Please arrive with freshly washed and thoroughly blow-dried hair, free from oils, creams, leave-ins or gels, unless your selected service includes prep.
          </div>
        </div>
      `),
    }),
  ]);

  return NextResponse.json({ booking: created }, { status: 201 });
}
