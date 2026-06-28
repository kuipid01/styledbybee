"use client";

import { FormEvent, useState } from "react";

import { categories } from "@/lib/site-data";

type ExistingStyle = {
  id?: string;
  slug?: string;
  category: string;
  name: string;
  price: number;
  imageUrl?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export default function ServiceAdminForm({
  initialStyles,
}: {
  initialStyles: ExistingStyle[];
}) {
  const [styles, setStyles] = useState(initialStyles);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  async function submitService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/admin/styles", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      setStatus("error");
      setError("Could not save the service. Check the DB env and try again.");
      return;
    }

    const data = (await response.json()) as { style: ExistingStyle };
    setStyles((current) => [data.style, ...current]);
    setStatus("saved");
    setPreviewUrl("");
    form.reset();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <form
        onSubmit={submitService}
        className="overflow-hidden rounded-[1.75rem] border border-[#d8c6a0] bg-[#11100e] text-white shadow-2xl"
      >
        <div className="grid min-h-60 place-items-end bg-[#201c16]">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-72 w-full object-cover" />
          ) : (
            <div className="w-full p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-[#d1ad5f]">
                Premium service builder
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                Add a bookable style
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#b8b0a4]">
                Paste an image URL to preview the public service card before saving.
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-4 p-6">
          <label className="block text-sm font-medium">
            Category
            <select
              name="category"
              required
              className="mt-2 w-full rounded-2xl border border-[#3b3429] bg-[#0f0f0f] px-4 py-3 text-white outline-none focus:border-[#d1ad5f]"
              defaultValue="Knotless or Box Braids/Twist"
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium">
              Style name
              <input
                name="name"
                required
                placeholder="Smedium"
                className="mt-2 w-full rounded-2xl border border-[#3b3429] bg-[#0f0f0f] px-4 py-3 text-white outline-none focus:border-[#d1ad5f]"
              />
            </label>
            <label className="block text-sm font-medium">
              Price
              <input
                name="price"
                type="number"
                min="1"
                required
                placeholder="90"
                className="mt-2 w-full rounded-2xl border border-[#3b3429] bg-[#0f0f0f] px-4 py-3 text-white outline-none focus:border-[#d1ad5f]"
              />
            </label>
          </div>

          <label className="block text-sm font-medium">
            Upload image
            <input
              name="imageFile"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPreviewUrl(file ? URL.createObjectURL(file) : "");
              }}
              className="mt-2 w-full rounded-2xl border border-[#3b3429] bg-[#0f0f0f] px-4 py-3 text-white outline-none file:mr-4 file:rounded-full file:border-0 file:bg-[#d1ad5f] file:px-4 file:py-2 file:font-semibold file:text-[#0f0f0f] focus:border-[#d1ad5f]"
            />
          </label>

          <label className="block text-sm font-medium">
            Image URL fallback
            <input
              name="imageUrl"
              type="url"
              placeholder="https://media.base44.com/..."
              onChange={(event) => setPreviewUrl(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#3b3429] bg-[#0f0f0f] px-4 py-3 text-white outline-none focus:border-[#d1ad5f]"
            />
          </label>

          <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]">
            <label className="block text-sm font-medium">
              Sort order
              <input
                name="sortOrder"
                type="number"
                defaultValue="0"
                className="mt-2 w-full rounded-2xl border border-[#3b3429] bg-[#0f0f0f] px-4 py-3 text-white outline-none focus:border-[#d1ad5f]"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-[#3b3429] bg-[#0f0f0f] px-4 py-3 text-sm">
              <input name="isActive" type="checkbox" defaultChecked />
              Active
            </label>
          </div>

          {status === "saved" && (
            <p className="rounded-2xl border border-[#d1ad5f]/60 bg-[#d1ad5f]/10 px-4 py-3 text-sm text-[#d1ad5f]">
              Service saved and ready for booking.
            </p>
          )}
          {status === "error" && (
            <p className="rounded-2xl border border-red-400/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            disabled={status === "saving"}
            className="w-full rounded-full bg-[#d1ad5f] px-5 py-4 font-semibold text-[#0f0f0f] transition hover:bg-[#e0bf72] disabled:opacity-60"
          >
            {status === "saving" ? "Saving..." : "Add service"}
          </button>
        </div>
      </form>

      <section className="rounded-[1.75rem] border border-[#d8c6a0] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#8a765b]">
              Current styles
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Service library</h2>
          </div>
          <span className="rounded-full bg-[#11100e] px-4 py-2 text-sm text-white">
            {styles.length}
          </span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {styles.map((style) => (
            <article
              key={style.slug ?? style.id ?? `${style.category}-${style.name}`}
              className="grid grid-cols-[84px_1fr] gap-4 rounded-2xl border border-[#e2d5bf] p-3 transition hover:border-[#d1ad5f]"
            >
              <img
                src={style.imageUrl ?? style.image ?? ""}
                alt=""
                className="h-24 w-20 rounded-xl object-cover"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#8a765b]">
                  {style.category}
                </p>
                <h3 className="mt-1 font-semibold">{style.name}</h3>
                <p className="mt-2 text-xl text-[#a17f34]">GBP {style.price}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
