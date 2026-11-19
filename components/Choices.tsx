"use client";

export function Choice({ on, title, hint, onClick }: { on: boolean; title: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" className="choice" data-on={on} aria-pressed={on} onClick={onClick}>
      <span
        aria-hidden
        className="mt-1 inline-block h-5 w-5 shrink-0 rounded-full border-2 border-spruce"
        style={{ background: on ? "#2F6F5E" : "transparent" }}
      />
      <span>
        <span className="block font-medium">{title}</span>
        {hint && <span className="block text-ink/70" style={{ fontSize: "var(--fs-small)" }}>{hint}</span>}
      </span>
    </button>
  );
}

export function Question({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2>{title}</h2>
      {hint && <p className="prose-line mt-1 text-ink/70">{hint}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
  suffix = "₽",
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-medium">{label}</span>
      {hint && <span className="mb-2 block text-ink/70" style={{ fontSize: "var(--fs-small)" }}>{hint}</span>}
      <span className="flex items-center gap-2">
        <input
          className="field"
          inputMode="numeric"
          value={value ? String(value) : ""}
          placeholder="0"
          onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
        />
        <span aria-hidden>{suffix}</span>
      </span>
    </label>
  );
}
