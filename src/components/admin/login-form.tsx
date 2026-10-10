"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Password</span>
        <input type="password" name="password" required autoFocus autoComplete="current-password" className="field" />
      </label>
      {state?.error && <p className="text-sm text-score-low">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
