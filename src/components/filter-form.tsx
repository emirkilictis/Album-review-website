"use client";

import Form from "next/form";
import { useRef } from "react";

type Option = { value: string; label: string };

/** GET form that re-submits whenever a select changes (search submits on Enter / blur). */
export function FilterForm({
  action,
  q,
  searchPlaceholder,
  selects,
}: {
  action: string;
  q?: string;
  searchPlaceholder: string;
  selects: { name: string; label: string; value: string; options: Option[] }[];
}) {
  const ref = useRef<HTMLFormElement>(null);
  const submit = () => ref.current?.requestSubmit();

  return (
    <Form ref={ref} action={action} scroll={false} className="flex flex-col gap-3 border-y border-line py-3 sm:flex-row sm:items-center">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Search</span>
        <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 fill-muted">
          <path d="M8.5 3a5.5 5.5 0 1 0 3.4 9.83l3.63 3.64a.75.75 0 1 0 1.06-1.06l-3.63-3.64A5.5 5.5 0 0 0 8.5 3Zm-4 5.5a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" />
        </svg>
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={searchPlaceholder}
          className="field !pl-8"
          onBlur={(e) => e.currentTarget.value !== (q ?? "") && submit()}
        />
      </label>
      {selects.map((s) => (
        <label key={s.name} className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
          <span className="whitespace-nowrap">{s.label}</span>
          <select name={s.name} defaultValue={s.value} onChange={submit} className="field normal-case sm:w-auto">
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button type="submit" className="btn-primary sm:hidden">
        Apply
      </button>
    </Form>
  );
}
