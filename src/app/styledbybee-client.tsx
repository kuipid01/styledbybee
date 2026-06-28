"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { categories, galleryImages, guideCards, services, site } from "@/lib/site-data";

type Service = (typeof services)[number] & { durationMinutes?: number | null };
const allowedDayNames = ["Sunday", "Friday", "Saturday"];

function getDayName(dateValue: string) {
  if (!dateValue) return "";

  const date = new Date(`${dateValue}T12:00:00`);
  return new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(date);
}

function isAllowedBookingDate(dateValue: string) {
  return allowedDayNames.includes(getDayName(dateValue));
}

function getTimeSlots(dateValue: string) {
  const dayName = getDayName(dateValue);
  const startHour = dayName === "Sunday" ? 12 : 10;
  const endHour = 19;

  if (!allowedDayNames.includes(dayName)) {
    return [];
  }

  return Array.from({ length: endHour - startHour + 1 }, (_, index) => {
    const hour = startHour + index;
    return `${String(hour).padStart(2, "0")}:00`;
  });
}

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

export default function StyledByBeeClient() {
  const [activeCategory, setActiveCategory] = useState("Knotless or Box Braids/Twist");
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceStyles, setServiceStyles] = useState<Service[]>(services);
  const [stylesLoading, setStylesLoading] = useState(true);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    email: string;
    serviceName: string;
  } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const visibleServices = useMemo(
    () => serviceStyles.filter((service) => service.category === activeCategory),
    [activeCategory, serviceStyles],
  );
  const heroImages = useMemo(() => {
    const images = Array.from(
      new Set(serviceStyles.map((service) => service.image).filter(Boolean)),
    );

    return images.length >= 3 ? images : galleryImages;
  }, [serviceStyles]);

  useEffect(() => {
    let isMounted = true;

    async function loadStyles() {
      const response = await fetch("/api/styles", { cache: "no-store" });

      if (!response.ok) {
        if (isMounted) setStylesLoading(false);
        return;
      }

      const data = (await response.json()) as { styles?: Service[] };

      if (isMounted && data.styles?.length) {
        setServiceStyles(data.styles);
      }

      if (isMounted) {
        setStylesLoading(false);
      }
    }

    loadStyles().catch(() => {
      if (isMounted) setStylesLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(
      () => setHeroIndex((currentIndex) => (currentIndex + 1) % heroImages.length),
      3500,
    );

    return () => window.clearInterval(timer);
  }, [heroImages.length]);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedService) return;

    setStatus("loading");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        serviceId: selectedService.id,
        serviceCategory: selectedService.category,
        serviceName: selectedService.name,
        price: selectedService.price,
        durationMinutes: selectedService.durationMinutes ?? null,
      }),
    });

    if (response.ok) {
      setConfirmedBooking({
        email: String(payload.email ?? ""),
        serviceName: selectedService.name,
      });
      setSelectedService(null);
      setStatus("idle");
      return;
    }

    setStatus("error");
  }

  return (
    <main id="top" className="min-h-screen overflow-x-hidden bg-background text-foreground font-body">
      <Header onBook={() => document.getElementById("services")?.scrollIntoView()} />

      <section id="top" className="relative overflow-hidden px-5 pb-16 pt-28 md:pt-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(209,173,95,0.22),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.95fr_1.05fr] md:items-end">
          <div className="py-10">
            <p className="mb-5 text-xs uppercase tracking-[0.45em] text-primary">{site.tagline}</p>
            <h1 className="font-display text-6xl font-semibold leading-[0.86] tracking-[-0.07em] md:text-8xl">
              {site.headline}
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">
              {site.description}
            </p>
          </div>

          <div className="relative h-[520px] w-full overflow-hidden rounded-[2rem] border border-border shadow-2xl">
            {heroImages.map((image, index) => (
              <img
                key={`${image}-${index}`}
                src={image}
                alt="StyledByBee gallery"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${index === heroIndex ? "opacity-100" : "opacity-0"
                  }`}
              />
            ))}
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
              {heroImages.map((image, index) => (
                <button
                  key={`${image}-dot`}
                  aria-label={`Show gallery image ${index + 1}`}
                  onClick={() => setHeroIndex(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${index === heroIndex ? "w-6 bg-primary" : "w-1.5 bg-white/40"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-primary">Guide</p>
          <h2 className="mb-10 font-display text-4xl tracking-[-0.05em]">Before you book.</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {guideCards.map((card, index) => (
              <img
                key={card.title}
                src={card.image}
                alt={
                  index === 0
                    ? "Braid size guide"
                    : index === 1
                      ? "Braid length chart"
                      : "Booking policies and hair info"
                }
                className="w-full rounded-[1.5rem] object-cover"
              />
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="border-y border-border bg-card/35 px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-primary">Braids &amp; Twists</p>
              <h2 className="mt-3 font-display text-4xl tracking-[-0.05em] md:text-6xl">
                Choose your style.
              </h2>
            </div>
            <p className="max-w-md text-muted-foreground">
              Prices match the referenced braids menu exactly and remain in pounds.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-[280px_1fr]">
            <div className="flex gap-3 overflow-x-hidden md:block md:space-y-2">
              {categories.map((category) => {
                const count = serviceStyles.filter((service) => service.category === category).length;

                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`flex min-w-fit items-center justify-between gap-4 whitespace-nowrap rounded-full border px-5 py-3 text-left text-sm transition md:w-full md:rounded-2xl ${category === activeCategory
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/70"
                      }`}
                  >
                    <span>{category}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{count}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <div id="book" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {stylesLoading ? (
                  <ServiceSkeletonGrid />
                ) : visibleServices.length ? (
                  visibleServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => {
                        setStatus("idle");
                        setSelectedService(service);
                      }}
                      className="group overflow-hidden rounded-[1.5rem] border border-border bg-background text-left transition hover:-translate-y-1 hover:border-primary/70"
                    >
                      <div className="relative flex h-64 items-center justify-center overflow-hidden bg-muted">
                        <img
                          src={service.image}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
                      </div>
                      <div className="p-6">
                        <p className="eyebrow">{service.category}</p>
                        <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">
                          {service.name}
                        </h3>
                        {service.durationMinutes && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {formatDuration(service.durationMinutes)}
                          </p>
                        )}
                        <div className="mt-7 flex items-center justify-between gap-4">
                        <p className="text-3xl text-primary">£{service.price}</p>
                          <span className="rounded-full border border-primary/60 px-5 py-2 text-xs uppercase tracking-[0.35em] text-primary">
                            Book
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-[1.75rem] border border-border bg-background p-8 text-muted-foreground md:col-span-2">
                    Bookings for this category are handled by consultation. Use the contact details below to request availability.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="px-5 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 md:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-primary">Contact</p>
            <h2 className="mt-3 font-display text-5xl tracking-[-0.06em]">
              Visit the atelier.
            </h2>
            <div className="mt-10 grid gap-4 text-muted-foreground">
              <a className="flex gap-3" href={site.mapUrl} target="_blank" rel="noreferrer">
                <span className="text-primary">&#8982;</span>
                {site.address}
              </a>
              <a className="flex gap-3" href={`mailto:${site.email}`}>
                <span className="text-primary">@</span>
                {site.email}
              </a>
              <a className="flex gap-3" href={`tel:${site.phone}`}>
                <span className="text-primary">&#9742;</span>
                {site.phone}
              </a>
              <div className="mt-2 flex gap-3">
                <span className="shrink-0 text-primary">&#9719;</span>
                <div>
                  <p className="mb-1 font-medium text-foreground">Working Hours</p>
                  <p>Friday &amp; Saturday - 10:00am to 7:00pm</p>
                  <p>Sunday - 12:00pm to 7:00pm</p>
                </div>
              </div>
              <a
                className="group relative flex w-fit gap-3"
                href={site.instagram}
                target="_blank"
                rel="noreferrer"
              >
                <span className="text-primary">&#9678;</span>
                Follow the Journey
                <span className="pointer-events-none absolute bottom-8 left-0 hidden w-72 grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-3 shadow-2xl group-hover:grid">
                  {galleryImages.slice(0, 3).map((image) => (
                    <img
                      key={image}
                      src={image}
                      alt="StyledByBee Instagram preview"
                      className="h-20 rounded-xl object-cover"
                    />
                  ))}
                </span>
              </a>
            </div>
          </div>
          <div className="rounded-[2rem] border border-border bg-card p-5">
            <img
              src="https://media.base44.com/images/public/user_6a2b92e2cb4a96ad8e6a7d8a/02687b854_IMG_6393.jpeg"
              alt="StyledByBee braid gallery"
              className="h-96 w-full rounded-[1.5rem] object-cover"
            />
          </div>
        </div>
      </section>

      <footer className="px-5 pb-8">
        <div className="mx-auto mt-16 flex max-w-7xl items-center justify-between border-t border-border pt-6 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          <span>&copy; StyledByBee</span>
          <a
            href="/admin"
            aria-label="Admin login"
            className="rounded-full border border-border p-3 transition hover:border-primary hover:text-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
              <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
            </svg>
          </a>
        </div>
      </footer>

      <button
        onClick={() => document.getElementById("services")?.scrollIntoView()}
        className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-primary/40 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-2xl md:hidden"
      >
        Book
      </button>

      {selectedService && (
        <BookingModal
          service={selectedService}
          status={status}
          onClose={() => setSelectedService(null)}
          onSubmit={submitBooking}
        />
      )}

      {confirmedBooking && (
        <BookingSuccessModal
          booking={confirmedBooking}
          onClose={() => setConfirmedBooking(null)}
        />
      )}
    </main>
  );
}

function ServiceSkeletonGrid() {
  return Array.from({ length: 6 }, (_, index) => (
    <article
      key={index}
      className="overflow-hidden rounded-[1.75rem] border border-border bg-background"
    >
      <div className="h-72 animate-pulse bg-muted" />
      <div className="space-y-4 p-6">
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
        <div className="h-8 w-1/2 animate-pulse rounded-full bg-muted" />
        <div className="mt-7 flex items-center justify-between gap-4">
          <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </article>
  ));
}

function Header({ onBook }: { onBook: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/80 px-5 py-4 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <a href="#top" className="font-display text-xl tracking-[0.28em] text-primary">
          {site.name}
        </a>
        <div className="hidden items-center gap-8 text-xs uppercase tracking-[0.24em] text-muted-foreground md:flex">
          <a href="#services" className="hover:text-primary">Services</a>
          <a href="#book" className="hover:text-primary">Book</a>
          <a href="#contact" className="hover:text-primary">Contact</a>
        </div>
        <button
          onClick={onBook}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Book now
        </button>
      </nav>
    </header>
  );
}

function BookingModal({
  service,
  status,
  onClose,
  onSubmit,
}: {
  service: Service;
  status: "idle" | "loading" | "success" | "error";
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [dateError, setDateError] = useState("");
  const [timeError, setTimeError] = useState("");
  const timeSlots = getTimeSlots(preferredDate);

  function validateAndSubmit(event: FormEvent<HTMLFormElement>) {
    const nextDateError = isAllowedBookingDate(preferredDate)
      ? ""
      : "We're only open on: Sunday, Friday, Saturday.";
    const nextTimeError = timeSlots.includes(preferredTime)
      ? ""
      : "Choose an available time slot for the selected day.";

    setDateError(nextDateError);
    setTimeError(nextTimeError);

    if (nextDateError || nextTimeError) {
      event.preventDefault();
      return;
    }

    onSubmit(event);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/76 px-5 backdrop-blur-xl">
      <form
        onSubmit={validateAndSubmit}
        className="grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl md:grid-cols-[0.7fr_1fr]"
      >
        <div className="relative hidden min-h-[680px] bg-muted md:block">
          <img src={service.image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-7 left-7 right-7">
            <p className="eyebrow">Selected style</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em]">{service.name}</h2>
            <p className="mt-3 text-primary">£{service.price}</p>
            {service.durationMinutes && (
              <p className="mt-2 text-sm text-muted-foreground">
                {formatDuration(service.durationMinutes)}
              </p>
            )}
          </div>
        </div>

        <div className="max-h-[92vh] overflow-y-auto p-6 md:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="eyebrow">SECURE YOUR SLOT</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em] md:text-4xl">
                {service.category}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {service.name} - £{service.price}
                {service.durationMinutes ? ` - ${formatDuration(service.durationMinutes)}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border text-2xl text-muted-foreground hover:text-primary"
            >
              x
            </button>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Field label="Name" name="name" required />
            <Field label="Phone" name="phone" required />
            <Field label="Email" name="email" type="email" required />
            <label className="block text-sm font-semibold">
              Preferred date <span className="text-muted-foreground">(Sunday, Friday, Saturday)</span>
              <input
                name="preferredDate"
                type="date"
                required
                value={preferredDate}
                onChange={(event) => {
                  const nextDate = event.target.value;
                  setPreferredDate(nextDate);
                  setPreferredTime("");
                  setDateError(
                    nextDate && !isAllowedBookingDate(nextDate)
                      ? "We're only open on: Sunday, Friday, Saturday."
                      : "",
                  );
                  setTimeError("");
                }}
                className={`mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-foreground outline-none focus:border-primary ${dateError ? "border-red-500" : "border-border"
                  }`}
              />
              {dateError && <p className="mt-2 text-sm text-red-400">{dateError}</p>}
            </label>
            <label className="block text-sm font-semibold">
              Preferred time
              <select
                name="preferredTime"
                required
                value={preferredTime}
                onChange={(event) => {
                  setPreferredTime(event.target.value);
                  setTimeError("");
                }}
                disabled={!timeSlots.length}
                className={`mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-foreground outline-none focus:border-primary disabled:opacity-50 ${timeError ? "border-red-500" : "border-border"
                  }`}
              >
                <option value="">
                  {timeSlots.length ? "Choose a time" : "Pick an open date first"}
                </option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              {timeError && <p className="mt-2 text-sm text-red-400">{timeError}</p>}
            </label>
            <div className="rounded-2xl border border-border bg-background p-5">
              <p className="eyebrow">TOTAL</p>
              <p className="mt-2 text-3xl text-primary">£{service.price}</p>
            </div>
          </div>

          <p className="mt-5 rounded-2xl border border-primary/70 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
            ! NOTE: A &pound;20 NON-REFUNDABLE DEPOSIT IS REQUIRED to secure your booking.
          </p>

          <label className="mt-5 block text-sm font-semibold">
            Notes
            <textarea
              name="notes"
              placeholder="Hair colour, length preference, or anything we should know"
              className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
            />
          </label>

          {status === "success" && (
            <p className="mt-4 rounded-2xl border border-primary/60 bg-primary/10 px-4 py-3 text-sm text-primary">
              Booking request received. StyledByBee will confirm your slot shortly.
            </p>
          )}
          {status === "error" && (
            <p className="mt-4 rounded-2xl border border-red-400/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Could not submit right now. Please try again or contact StyledByBee directly.
            </p>
          )}

          <button
            disabled={status === "loading"}
            className="mt-5 w-full rounded-full bg-primary px-5 py-4 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {status === "loading" ? "Securing..." : "Secure My Slot"}
          </button>
        </div>
      </form>
    </div>
  );
}

function BookingSuccessModal({
  booking,
  onClose,
}: {
  booking: { email: string; serviceName: string };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/76 px-5 backdrop-blur-xl">
      <div className="animate-booking-pop w-full max-w-lg rounded-[2rem] border border-border bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-primary/50 bg-primary/10 text-3xl text-primary">
          ✓
        </div>
        <p className="eyebrow mt-7">BOOKING PLACED</p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em]">
          Your slot request is in.
        </h2>
        <p className="mt-5 leading-7 text-muted-foreground">
          We sent a booking receipt for <span className="text-foreground">{booking.serviceName}</span>{" "}
          to <span className="text-foreground">{booking.email}</span>. StyledByBee will confirm
          the appointment after the deposit is secured.
        </p>
        <button
          onClick={onClose}
          className="mt-8 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#e2bf71]"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
      />
    </label>
  );
}
