export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`relative grid rounded-[0.875rem] bg-surface-2 p-[3px] ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-[3px] left-[3px] rounded-[0.6875rem] bg-surface shadow-[0_1px_3px_oklch(0_0_0/0.1),0_0_0_0.5px_oklch(0_0_0/0.04)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.9,0.2,1)] dark:bg-[oklch(0.33_0.01_262)]"
        style={{
          width: `calc((100% - 6px) / ${options.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onKeyDown={(event) => {
              const offset = ['ArrowRight', 'ArrowDown'].includes(event.key)
                ? 1
                : ['ArrowLeft', 'ArrowUp'].includes(event.key)
                  ? -1
                  : 0;
              if (!offset) return;
              event.preventDefault();
              const index = options.indexOf(option);
              const nextIndex = (index + offset + options.length) % options.length;
              const next = options[nextIndex];
              if (next) {
                onChange(next.value);
                event.currentTarget.parentElement?.querySelectorAll('button')[nextIndex]?.focus();
              }
            }}
            onClick={() => onChange(option.value)}
            className={`relative z-10 min-h-10 rounded-[0.6875rem] px-3 py-1.5 text-[0.8125rem] font-medium transition-colors duration-150 ${
              selected
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
