"use client";

import { useFormStatus } from "react-dom";

export default function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="flex w-full items-center justify-center gap-3 rounded-full bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#e2bf71] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
      )}
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}
