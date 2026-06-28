"use client";

import { FormEvent, useState } from "react";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt?: Date | string;
};

export default function AdminUsersForm({
  initialAdmins,
}: {
  initialAdmins: AdminUser[];
}) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function submitAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        isActive: formData.get("isActive") === "on",
      }),
    });

    if (!response.ok) {
      setStatus("error");
      setError("Could not save admin. Confirm the email and password are valid.");
      return;
    }

    const data = (await response.json()) as { admin: AdminUser };
    setAdmins((current) => [
      data.admin,
      ...current.filter((admin) => admin.email !== data.admin.email),
    ]);
    setStatus("saved");
    form.reset();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <form
        onSubmit={submitAdmin}
        className="rounded-[1.75rem] border border-[#d8c6a0] bg-[#11100e] p-6 text-white shadow-2xl"
      >
        <p className="text-xs uppercase tracking-[0.35em] text-[#d1ad5f]">
          Access control
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Add an admin
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#b8b0a4]">
          Admins can manage bookings, services, uploads, and other admins.
        </p>
        <div className="mt-7 grid gap-4">
          <label className="block text-sm font-medium">
            Name
            <input name="name" required className="admin-dark-input" placeholder="Stephen" />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              required
              className="admin-dark-input"
              placeholder="admin@example.com"
            />
          </label>
          <label className="block text-sm font-medium">
            Temporary password
            <input
              name="password"
              type="password"
              minLength={8}
              required
              className="admin-dark-input"
              placeholder="Minimum 8 characters"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-[#3b3429] bg-[#0f0f0f] px-4 py-3 text-sm">
            <input name="isActive" type="checkbox" defaultChecked />
            Active
          </label>
          {status === "saved" && (
            <p className="rounded-2xl border border-[#d1ad5f]/60 bg-[#d1ad5f]/10 px-4 py-3 text-sm text-[#d1ad5f]">
              Admin saved.
            </p>
          )}
          {status === "error" && (
            <p className="rounded-2xl border border-red-400/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}
          <button
            disabled={status === "saving"}
            className="rounded-full bg-[#d1ad5f] px-5 py-4 font-semibold text-[#0f0f0f] transition hover:bg-[#e0bf72] disabled:opacity-60"
          >
            {status === "saving" ? "Saving..." : "Add admin"}
          </button>
        </div>
      </form>

      <section className="rounded-[1.75rem] border border-[#d8c6a0] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#8a765b]">
              Current admins
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Team access</h2>
          </div>
          <span className="rounded-full bg-[#11100e] px-4 py-2 text-sm text-white">
            {admins.length}
          </span>
        </div>
        <div className="mt-6 space-y-3">
          {admins.map((admin) => (
            <article
              key={admin.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#e2d5bf] p-4"
            >
              <div>
                <p className="font-semibold">{admin.name}</p>
                <p className="mt-1 text-sm text-[#675c4c]">{admin.email}</p>
              </div>
              <span className="rounded-full bg-[#11100e] px-3 py-1.5 text-xs font-semibold text-white">
                {admin.isActive ? "active" : "inactive"}
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
