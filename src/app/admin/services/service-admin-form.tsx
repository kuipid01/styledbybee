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
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [styleToDelete, setStyleToDelete] = useState<ExistingStyle | null>(null);
  const activeCount = useMemo(
    () => styles.filter((style) => style.isActive).length,
    [styles],
  );

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
    setPreviewUrl("");
    setEditingStyle(null);
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
    const response = await fetch(`/api/admin/styles/${style.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setStatus("error");
      setError("Could not delete the style.");
      toast.error("Could not delete service");
      return;
    }

    setStyles((current) => current.filter((item) => item.id !== style.id));
    setStyleToDelete(null);
    toast.success("Service deleted");

    if (editingStyle?.id === style.id) {
      setEditingStyle(null);
      setPreviewUrl("");
    }
  }

  function startEditing(style: ExistingStyle) {
    setEditingStyle(style);
    setPreviewUrl(style.imageUrl);
    setStatus("idle");
    setError("");
  }

  function cancelEditing() {
    setEditingStyle(null);
    setPreviewUrl("");
    setStatus("idle");
    setError("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <form
        key={editingStyle?.id ?? "create"}
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
                {editingStyle ? "Edit style" : "Add a bookable style"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#b8b0a4]">
                Upload from your device or paste an image URL. Images are saved through Cloudinary.
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
              className="admin-dark-input"
              defaultValue={editingStyle?.category ?? "Knotless or Box Braids/Twist"}
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
          </div>

          <label className="block text-sm font-medium">
            Upload image
            <input
              name="imageFile"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPreviewUrl(file ? URL.createObjectURL(file) : editingStyle?.imageUrl ?? "");
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
              onChange={(event) => setPreviewUrl(event.target.value)}
              className="admin-dark-input"
            />
          </label>

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

          <div className="flex gap-3">
            <button
              disabled={status === "saving"}
              className="flex-1 rounded-full bg-[#d1ad5f] px-5 py-4 font-semibold text-[#0f0f0f] transition hover:bg-[#e0bf72] disabled:opacity-60"
            >
              {status === "saving"
                ? "Saving..."
                : editingStyle
                  ? "Update service"
                  : "Add service"}
            </button>
            {editingStyle && (
              <button
                type="button"
                onClick={cancelEditing}
                className="rounded-full border border-[#3b3429] px-5 py-4 font-semibold text-white"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      <section className="rounded-[1.75rem] border border-[#d8c6a0] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#8a765b]">
              Current styles
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Service library</h2>
            <p className="mt-2 text-sm text-[#675c4c]">
              {activeCount} active / {styles.length} total
            </p>
          </div>
          <span className="rounded-full bg-[#11100e] px-4 py-2 text-sm text-white">
            CRUD
          </span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {styles.map((style) => (
            <article
              key={style.id}
              className={`rounded-2xl border p-3 transition ${
                style.isActive
                  ? "border-[#e2d5bf] hover:border-[#d1ad5f]"
                  : "border-[#eadfce] bg-[#faf7f1] opacity-70"
              }`}
            >
              <div className="grid grid-cols-[84px_1fr] gap-4">
                <img
                  src={style.imageUrl}
                  alt=""
                  className="h-24 w-20 rounded-xl object-cover"
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8a765b]">
                    {style.category}
                  </p>
                  <h3 className="mt-1 font-semibold">{style.name}</h3>
                  <p className="mt-2 text-xl text-[#a17f34]">GBP {style.price}</p>
                  <p className="mt-1 text-xs text-[#675c4c]">
                    Sort {style.sortOrder} · {style.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => startEditing(style)}
                  className="rounded-full border border-[#c9b99f] px-3 py-2 text-sm font-semibold"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => toggleStyle(style)}
                  className="rounded-full border border-[#c9b99f] px-3 py-2 text-sm font-semibold"
                >
                  {style.isActive ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={() => setStyleToDelete(style)}
                  className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {styleToDelete && (
        <DeleteStyleDialog
          style={styleToDelete}
          onCancel={() => setStyleToDelete(null)}
          onConfirm={() => deleteStyle(styleToDelete)}
        />
      )}
    </div>
  );
}

function DeleteStyleDialog({
  style,
  onCancel,
  onConfirm,
}: {
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
            className="flex-1 rounded-full border border-[#c9b99f] px-5 py-3 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
