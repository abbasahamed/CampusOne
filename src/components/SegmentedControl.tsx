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
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex flex-wrap gap-0.5 rounded-[var(--radius-control)] bg-surface-secondary p-1 ${className}`}
    >
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
              const offset = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1
                : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0;
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
            className={`min-h-11 rounded-[0.5rem] px-3 py-1.5 text-[0.875rem] font-medium transition-colors duration-150 ${
              selected
                ? 'bg-[var(--color-elevated)] text-text-primary shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
