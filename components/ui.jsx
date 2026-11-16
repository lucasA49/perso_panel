// Briques d'interface réutilisables (Tailwind uniquement)

const cx = (...parts) => parts.filter(Boolean).join(" ");

export function Card({ title, action, className, children }) {
  return (
    <section className={cx("rounded-2xl border border-line bg-surface p-4", className)}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

const BUTTON_VARIANTS = {
  primary: "bg-accent text-accent-ink hover:brightness-110",
  secondary: "border border-line bg-raised text-ink hover:border-muted",
  ghost: "text-muted hover:bg-raised hover:text-ink",
  danger: "text-danger hover:bg-danger/10",
};

export function Button({ variant = "primary", className, type = "button", ...props }) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}

export function IconButton({ label, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted transition",
        "hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-accent",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

const CONTROL =
  "min-h-11 w-full rounded-xl border border-line bg-raised px-3 text-base text-ink placeholder:text-muted/70 " +
  "transition focus:border-accent focus:outline-none";

export function Field({ label, className, children }) {
  return (
    <label className={cx("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export function Input({ className, ...props }) {
  return <input className={cx(CONTROL, className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cx(CONTROL, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        checked ? "bg-accent" : "bg-line"
      )}
    >
      <span
        className={cx(
          "absolute top-1 left-1 size-5 rounded-full bg-white transition-transform",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl border border-line bg-raised p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cx(
            "min-h-9 flex-1 cursor-pointer rounded-lg px-3 text-sm font-semibold transition",
            value === opt.value ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ children }) {
  return (
    <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
      {children}
    </p>
  );
}

// Icônes (SVG en ligne, trait 1.75)
function Icon({ children, className = "size-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export const WalletIcon = (p) => (
  <Icon {...p}>
    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a1 1 0 0 1 1 1v2" />
    <path d="M3 7.5V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H5.5A2.5 2.5 0 0 1 3 7.5Z" />
    <path d="M16.5 13.5h.01" />
  </Icon>
);

export const BellIcon = (p) => (
  <Icon {...p}>
    <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Icon>
);

export const SlidersIcon = (p) => (
  <Icon {...p}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </Icon>
);

export const TrashIcon = (p) => (
  <Icon {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Icon>
);

export const PlusIcon = (p) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
