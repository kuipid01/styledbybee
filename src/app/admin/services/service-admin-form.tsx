"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { categories } from "@/lib/site-data";

type ExistingStyle = {
  id: string;
  slug?: string;
  category: string;
  name: string;
  price: number;
  durationMinutes?: number | null;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
};

export default function ServiceAdminForm({
  initialStyles,
}: {
  initialStyles: ExistingStyle[];
}) {
  const [styles, setStyles] = useState(initialStyles);
  const [editingStyle, setEditingStyle] = useState<ExistingStyle | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [styleToDelete, setStyleToDelete] = useState<ExistingStyle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const activeCount = useMemo(
    () => styles.filter((style) => style.isActive).length,
    [styles],
  );
  const categoryOptions = useMemo(
    () => Array.from(new Set([...categories, ...styles.map((style) => style.category)])).sort(),
    [styles],
  );
  const visibleStyles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return styles.filter((style) => {
      const matchesCategory = categoryFilter === "All" || style.category === categoryFilter;
      const matchesQuery =
        !normalizedQuery ||
        style.name.toLowerCase().includes(normalizedQuery) ||
        style.category.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [categoryFilter, query, styles]);

  async function submitService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const endpoint = editingStyle
      ? `/api/admin/styles/${editingStyle.id}`
      : "/api/admin/styles";
    const response = await fetch(endpoint, {
      method: editingStyle ? "PATCH" : "POST",
      body: formData,
    });

    if (!response.ok) {
      setStatus("error");
      setError("Could not save the service. Check the fields and try again.");
      toast.error("Could not save service");
      return;
    }

    const data = (await response.json()) as { style: ExistingStyle };
    setStyles((current) => {
      if (editingStyle) {
        return current.map((style) => (style.id === data.style.id ? data.style : style));
      }

      return [data.style, ...current];
    });
    setStatus("saved");
    toast.success(editingStyle ? "Service updated" : "Service created");
    closeEditor();
    form.reset();
  }

  async function toggleStyle(style: ExistingStyle) {
    const response = await fetch(`/api/admin/styles/${style.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !style.isActive }),
    });

    if (!response.ok) {
      setStatus("error");
      setError("Could not update style status.");
      toast.error("Could not update status");
      return;
    }

    const data = (await response.json()) as { style: ExistingStyle };
    setStyles((current) =>
      current.map((item) => (item.id === data.style.id ? data.style : item)),
    );
    toast.success(data.style.isActive ? "Service is visible" : "Service is hidden");
  }

  async function deleteStyle(style: ExistingStyle) {
    setIsDeleting(true);
    const response = await fetch(`/api/admin/styles/${style.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setIsDeleting(false);
      setStatus("error");
      setError("Could not delete the style.");
      toast.error("Could not delete service");
      return;
    }

    setStyles((current) => current.filter((item) => item.id !== style.id));
    setStyleToDelete(null);
    setIsDeleting(false);
    toast.success("Service deleted");

    if (editingStyle?.id === style.id) {
      closeEditor();
    }
  }

  function openCreateEditor() {
    setEditingStyle(null);
    setPreviewUrl("");
    setStatus("idle");
    setError("");
    setShowEditor(true);
  }

  function startEditing(style: ExistingStyle) {
    setEditingStyle(style);
    setPreviewUrl(style.imageUrl);
    setStatus("idle");
    setError("");
    setShowEditor(true);
  }

  function closeEditor() {
    setEditingStyle(null);
    setPreviewUrl("");
    setStatus("idle");
    setError("");
    setShowEditor(false);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Total styles", styles.length],
          ["Visible styles", activeCount],
          ["Categories", categoryOptions.length],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-[#e2d5bf] bg-white p-5 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-[#8a765b]">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#11100e]">
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-[1.75rem] border border-[#d8c6a0] bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#8a765b]">
              Service library
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Manage catalogue</h2>
            <p className="mt-2 text-sm text-[#675c4c]">
              Add, style, hide, or remove services shown on the booking page.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateEditor}
            className="rounded-full bg-[#11100e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a241b]"
          >
            Add style
          </button>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_260px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search services"
            className="rounded-2xl border border-[#d8cbb8] px-4 py-3 outline-none focus:border-[#a17f34]"
          />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-2xl border border-[#d8cbb8] px-4 py-3 outline-none focus:border-[#a17f34]"
          >
            <option>All</option>
            {categoryOptions.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {visibleStyles.map((style) => (
            <article
              key={style.id}
              className={`overflow-hidden rounded-2xl border transition ${
                style.isActive
                  ? "border-[#e2d5bf] hover:-translate-y-0.5 hover:border-[#d1ad5f] hover:shadow-lg"
                  : "border-[#eadfce] bg-[#faf7f1] opacity-70"
              }`}
            >
              <div className="grid grid-cols-[104px_1fr] gap-4 p-3">
                <img
                  src={style.imageUrl}
                  alt=""
                  className="h-32 w-26 rounded-xl bg-[#11100e] object-cover"
                />
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#8a765b]">
                      {style.category}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        style.isActive
                          ? "bg-[#e9f7df] text-[#3f6f1c]"
                          : "bg-[#f3e3df] text-[#9b2d1f]"
                      }`}
                    >
                      {style.isActive ? "Live" : "Hidden"}
                    </span>
                  </div>
                  <h3 className="mt-2 truncate text-lg font-semibold">{style.name}</h3>
                  <p className="mt-2 text-2xl text-[#a17f34]">GBP {style.price}</p>
                  <p className="mt-1 text-xs text-[#675c4c]">
                    Sort {style.sortOrder}
                    {style.durationMinutes ? ` · ${formatDuration(style.durationMinutes)}` : ""}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 border-t border-[#eadfce] text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => startEditing(style)}
                  className="px-3 py-3 transition hover:bg-[#faf7f1]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => toggleStyle(style)}
                  className="border-x border-[#eadfce] px-3 py-3 transition hover:bg-[#faf7f1]"
                >
                  {style.isActive ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={() => setStyleToDelete(style)}
                  className="px-3 py-3 text-red-700 transition hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>

        {!visibleStyles.length && (
          <div className="mt-6 rounded-2xl border border-dashed border-[#d8cbb8] p-8 text-center text-[#675c4c]">
            No services match the current filters.
          </div>
        )}
      </section>

      {showEditor && (
        <ServiceEditorModal
          categoryOptions={categoryOptions}
          editingStyle={editingStyle}
          error={error}
          previewUrl={previewUrl}
          status={status}
          onClose={closeEditor}
          onPreviewChange={setPreviewUrl}
          onSubmit={submitService}
        />
      )}

      {styleToDelete && (
        <DeleteStyleDialog
          isDeleting={isDeleting}
          style={styleToDelete}
          onCancel={() => {
            if (!isDeleting) {
              setStyleToDelete(null);
            }
          }}
          onConfirm={() => deleteStyle(styleToDelete)}
        />
      )}
    </div>
  );
}

function ServiceEditorModal({
  categoryOptions,
  editingStyle,
  error,
  previewUrl,
  status,
  onClose,
  onPreviewChange,
  onSubmit,
}: {
  categoryOptions: string[];
  editingStyle: ExistingStyle | null;
  error: string;
  previewUrl: string;
  status: "idle" | "saving" | "saved" | "error";
  onClose: () => void;
  onPreviewChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm">
      <form
        key={editingStyle?.id ?? "create"}
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[1.75rem] border border-[#d8c6a0] bg-[#11100e] p-5 text-white shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#3b3429] pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#d1ad5f]">
              {editingStyle ? "Editing service" : "New service"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              {editingStyle ? editingStyle.name : "Add a bookable style"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#3b3429] text-xl text-[#b8b0a4] transition hover:border-[#d1ad5f] hover:text-white"
          >
            x
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-[#3b3429] bg-[#201c16]">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="h-52 w-full object-cover" />
            ) : (
              <div className="grid h-52 place-items-center px-4 text-center text-xs uppercase tracking-[0.2em] text-[#8f8679]">
                Image preview
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <label className="block text-sm font-medium">
              Category
              <select
                name="category"
                required
                className="admin-dark-input"
                defaultValue={editingStyle?.category ?? "Knotless or Box Braids/Twist"}
              >
                {categoryOptions.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-medium">
                Style name
                <input
                  name="name"
                  required
                  placeholder="Smedium"
                  defaultValue={editingStyle?.name}
                  className="admin-dark-input"
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
                  defaultValue={editingStyle?.price}
                  className="admin-dark-input"
                />
              </label>
              <label className="block text-sm font-medium">
                Duration minutes
                <input
                  name="durationMinutes"
                  type="number"
                  min="1"
                  placeholder="180"
                  defaultValue={editingStyle?.durationMinutes ?? ""}
                  className="admin-dark-input"
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block text-sm font-medium">
                Upload image
                <input
                  name="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    onPreviewChange(file ? URL.createObjectURL(file) : editingStyle?.imageUrl ?? "");
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
                  defaultValue={editingStyle?.imageUrl}
                  onChange={(event) => onPreviewChange(event.target.value)}
                  className="admin-dark-input"
                />
              </label>
            </div>

            <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]">
              <label className="block text-sm font-medium">
                Sort order
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={editingStyle?.sortOrder ?? 0}
                  className="admin-dark-input"
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-[#3b3429] bg-[#0f0f0f] px-4 py-3 text-sm">
                <input
                  name="isActive"
                  type="checkbox"
                  defaultChecked={editingStyle?.isActive ?? true}
                />
                Active
              </label>
            </div>

            {status === "error" && (
              <p className="rounded-2xl border border-red-400/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            <button
              disabled={status === "saving"}
              className="rounded-full bg-[#d1ad5f] px-5 py-4 font-semibold text-[#0f0f0f] transition hover:bg-[#e0bf72] disabled:opacity-60"
            >
              {status === "saving"
                ? "Saving..."
                : editingStyle
                  ? "Update service"
                  : "Add service"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function formatDuration(minutes: number) {
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

function DeleteStyleDialog({
  isDeleting,
  style,
  onCancel,
  onConfirm,
}: {
  isDeleting: boolean;
  style: ExistingStyle;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.75rem] border border-[#d8c6a0] bg-white p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.28em] text-[#8a765b]">
          Confirm delete
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
          Delete {style.name}?
        </h2>
        <p className="mt-3 leading-6 text-[#675c4c]">
          This removes the style from the service library and public booking
          page. This action cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-full border border-[#c9b99f] px-5 py-3 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
