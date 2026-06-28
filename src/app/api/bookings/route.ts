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

export async function POST(request: Request) {
  const parsed = bookingSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const booking = parsed.data;
  const [created] = await db.insert(bookings).values(booking).returning();
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

  await Promise.all([
    sendAdminMail({
      to: env.ADMIN_EMAIL,
      subject: `New StyledByBee booking: ${booking.serviceName}`,
      htmlContent: `
        <h1>New booking request</h1>
        <p><strong>Service:</strong> ${safeBooking.serviceCategory} - ${safeBooking.serviceName}</p>
        <p><strong>Total:</strong> &pound;${booking.price}</p>
        <p><strong>Name:</strong> ${safeBooking.name}</p>
        <p><strong>Phone:</strong> ${safeBooking.phone}</p>
        <p><strong>Email:</strong> ${safeBooking.email}</p>
        <p><strong>Preferred:</strong> ${safeBooking.preferredDate} at ${safeBooking.preferredTime}</p>
        <p><strong>Notes:</strong> ${safeBooking.notes}</p>
      `,
    }),
    sendAdminMail({
      to: booking.email,
      subject: `StyledByBee booking receipt: ${booking.serviceName}`,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;background:#0f0f0f;color:#f5f5f5;padding:28px;">
          <div style="max-width:620px;margin:0 auto;background:#171614;border:1px solid #3b3429;border-radius:24px;padding:28px;">
            <p style="color:#d1ad5f;letter-spacing:4px;font-size:12px;text-transform:uppercase;margin:0 0 14px;">STYLEDBYBEE</p>
            <h1 style="margin:0 0 12px;font-size:28px;">Booking receipt</h1>
            <p style="color:#b3ada4;line-height:1.6;">Hi ${safeBooking.name}, your booking request has been received. StyledByBee will confirm your slot after the &pound;20 non-refundable deposit is secured.</p>
            <div style="margin-top:24px;border-top:1px solid #3b3429;padding-top:20px;">
              <p><strong>Service:</strong> ${safeBooking.serviceCategory} - ${safeBooking.serviceName}</p>
              <p><strong>Total:</strong> &pound;${booking.price}</p>
              <p><strong>Preferred date:</strong> ${safeBooking.preferredDate}</p>
              <p><strong>Preferred time:</strong> ${safeBooking.preferredTime}</p>
              <p><strong>Deposit due:</strong> &pound;20</p>
              <p><strong>Notes:</strong> ${safeBooking.notes}</p>
            </div>
            <p style="margin-top:24px;color:#d1ad5f;font-weight:bold;">NOTE: A &pound;20 NON-REFUNDABLE DEPOSIT IS REQUIRED to secure your booking.</p>
            <p style="margin-top:24px;color:#b3ada4;">Address: 110, 112 Rye Ln, London SE15 4RZ</p>
          </div>
        </div>
      `,
    }),
  ]);

  return NextResponse.json({ booking: created }, { status: 201 });
}
