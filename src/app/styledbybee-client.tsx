"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { categories, galleryImages, guideCards, services, site } from "@/lib/site-data";

type Service = (typeof services)[number];
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
    <main id="top" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Header onBook={() => document.getElementById("services")?.scrollIntoView()} />

      <section className="relative overflow-hidden px-5 pb-20 pt-28 md:pt-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_8%,rgba(209,173,95,0.18),transparent_34%),linear-gradient(90deg,#0f0f0f,#11100e_52%,#0f0f0f)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.86fr_1.14fr]">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card/70 px-4 py-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Friday to Sunday appointments
            </div>
            <p className="eyebrow mt-10">{site.tagline}</p>
            <h1 className="mt-6 max-w-3xl text-[4rem] font-semibold leading-[0.94] tracking-[-0.07em] md:text-[7rem]">
              {site.headline}
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              {site.description}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => document.getElementById("services")?.scrollIntoView()}
                className="rounded-full bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground transition hover:bg-[#e2bf71]"
              >
                Book a style
              </button>
              <a
                href="#contact"
                className="rounded-full border border-border px-7 py-4 text-center text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                View contact
              </a>
            </div>
            <div className="mt-12 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["GBP 20", "deposit"],
                ["Peckham", "location"],
                ["3 days", "weekly slots"],
              ].map(([value, label]) => (
                <div key={label} className="border-l border-border pl-4">
                  <p className="text-xl font-semibold text-primary">{value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_0.38fr]">
            <div className="relative h-[430px] overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl md:h-[560px]">
              <img
                src={galleryImages[heroIndex]}
                alt="StyledByBee gallery"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="eyebrow">Featured finish</p>
                <div className="mt-4 flex gap-2">
                  {galleryImages.map((_, index) => (
                    <button
                      key={index}
                      aria-label={`Show gallery image ${index + 1}`}
                      onClick={() => setHeroIndex(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        index === heroIndex ? "w-8 bg-primary" : "w-2 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden gap-4 md:grid">
              {galleryImages.slice(1, 4).map((image, index) => (
                <button
                  key={image}
                  onClick={() => setHeroIndex(index + 1)}
                  className="overflow-hidden rounded-[1.5rem] border border-border bg-card transition hover:border-primary"
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">GUIDE</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
                Before you book.
              </h2>
            </div>
            <p className="max-w-md leading-7 text-muted-foreground">
              Quick references for sizing, length, deposits, preparation, and hair recommendations.
            </p>
          </div>
          <div className="mt-12 grid items-start gap-6 md:grid-cols-3">
            {guideCards.map((card, index) => (
              <article
                key={card.title}
                className="group overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-xl shadow-black/20"
              >
                <img
                  src={card.image}
                  alt={card.title}
                  className={`w-full object-cover transition duration-500 group-hover:scale-[1.03] ${
                    index === 1 ? "h-[540px]" : "h-[420px]"
                  }`}
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="border-b border-border bg-card/35 px-5 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[300px_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">BRAIDS &amp; TWISTS</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
              Choose your style.
            </h2>
            <p className="mt-5 leading-7 text-muted-foreground">
              Browse live styles from the database. Every card opens the booking modal.
            </p>
            <div className="mt-8 flex gap-3 overflow-x-auto pb-2 lg:block lg:space-y-3">
              {categories.map((category) => {
                const count = serviceStyles.filter((service) => service.category === category).length;

                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`flex min-w-fit items-center justify-between gap-4 whitespace-nowrap rounded-full border px-5 py-3 text-left text-sm transition lg:w-full lg:rounded-2xl ${
                      category === activeCategory
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/70 hover:text-foreground"
                    }`}
                  >
                    <span>{category}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{count}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {visibleServices.length} styles in {activeCategory}
              </p>
              <a href="/admin/services" className="hidden text-sm text-primary hover:text-[#e2bf71] md:block">
                Manage services
              </a>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                    className="group overflow-hidden rounded-[1.75rem] border border-border bg-background text-left shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-primary/80"
                  >
                    <div className="relative flex h-72 items-center justify-center overflow-hidden bg-muted">
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
                      <div className="mt-7 flex items-center justify-between gap-4">
                        <p className="text-3xl text-primary">GBP {service.price}</p>
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
      </section>

      <section id="contact" className="px-5 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">CONTACT</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
              Visit the atelier.
            </h2>
            <p className="mt-5 max-w-md leading-7 text-muted-foreground">
              Secure a slot online, then follow deposit instructions to confirm your appointment.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <a className="rounded-[1.5rem] border border-border bg-card p-6 hover:border-primary" href={site.mapUrl}>
              <p className="eyebrow">Location</p>
              <p className="mt-4 text-lg leading-7 text-muted-foreground">{site.address}</p>
            </a>
            <div className="rounded-[1.5rem] border border-border bg-card p-6">
              <p className="eyebrow">Working hours</p>
              <p className="mt-4 text-muted-foreground">Friday &amp; Saturday - 10:00am to 7:00pm</p>
              <p className="mt-2 text-muted-foreground">Sunday - 12:00pm to 7:00pm</p>
            </div>
            <a className="rounded-[1.5rem] border border-border bg-card p-6 hover:border-primary" href={`mailto:${site.email}`}>
              <p className="eyebrow">Email</p>
              <p className="mt-4 text-lg text-muted-foreground">{site.email}</p>
            </a>
            <a className="rounded-[1.5rem] border border-border bg-card p-6 hover:border-primary" href={`tel:${site.phone}`}>
              <p className="eyebrow">Phone</p>
              <p className="mt-4 text-lg text-muted-foreground">{site.phone}</p>
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <p className="eyebrow">{site.name}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href={site.instagram} className="hover:text-primary">Instagram</a>
            <a href="/admin" className="hover:text-primary">Admin</a>
          </div>
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
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/82 px-5 py-4 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <a href="#top" className="text-lg font-semibold tracking-[0.28em] text-primary md:text-xl">
          {site.name}
        </a>
        <div className="hidden items-center gap-10 text-xs uppercase tracking-[0.35em] text-muted-foreground md:flex">
          <a href="#services" className="hover:text-primary">Services</a>
          <a href="#services" className="hover:text-primary">Book</a>
          <a href="#contact" className="hover:text-primary">Contact</a>
        </div>
        <button
          onClick={onBook}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#e2bf71]"
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
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">{service.name}</h2>
            <p className="mt-3 text-primary">GBP {service.price}</p>
          </div>
        </div>

        <div className="max-h-[92vh] overflow-y-auto p-6 md:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="eyebrow">SECURE YOUR SLOT</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] md:text-4xl">
                {service.category}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {service.name} - GBP {service.price}
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
                className={`mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-foreground outline-none focus:border-primary ${
                  dateError ? "border-red-500" : "border-border"
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
                className={`mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-foreground outline-none focus:border-primary disabled:opacity-50 ${
                  timeError ? "border-red-500" : "border-border"
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
              <p className="mt-2 text-3xl text-primary">GBP {service.price}</p>
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
        <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
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
