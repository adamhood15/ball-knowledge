"use client";

export interface ToggleGroupOption<T extends string> {
  value: T;
  label: string;
}

export function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ToggleGroupOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-accent text-sm tracking-wide text-muted-text">{label}</span>
      <div className="inline-flex w-fit gap-1 rounded-none border-2 border-muted-text/30 bg-background p-1 shadow-[2px_2px_0_0_var(--color-neutral-shadow)]">
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(option.value)}
              className={[
                "rounded-none px-4 py-1.5 text-sm font-medium transition-all duration-150",
                isSelected
                  ? "bg-card-border text-background shadow-[2px_2px_0_0_var(--color-card-border)]"
                  : "text-body-text hover:text-secondary-accent",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
