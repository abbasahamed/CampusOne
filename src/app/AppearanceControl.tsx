import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ThemePreference } from '../lib/theme';

const options = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const;

export function AppearanceControl({
  value,
  onChange,
}: {
  value: ThemePreference;
  onChange: (next: ThemePreference) => void;
}) {
  const disclosure = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];
  const Icon = selected.icon;

  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      const panel = disclosure.current;
      if (panel?.open && event.target instanceof Node && !panel.contains(event.target)) {
        panel.open = false;
      }
    }
    document.addEventListener('pointerdown', dismissOutside);
    return () => document.removeEventListener('pointerdown', dismissOutside);
  }, []);

  function close(restoreFocus = false) {
    if (disclosure.current) disclosure.current.open = false;
    if (restoreFocus) trigger.current?.focus();
  }

  return (
    <details
      ref={disclosure}
      className="appearance"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && disclosure.current?.open) {
          event.stopPropagation();
          close(true);
        }
      }}
    >
      <summary ref={trigger} className="appearance-trigger" aria-label={`Appearance: ${selected.label}`}>
        <Icon size={19} aria-hidden="true" />
        <span className="appearance-desktop-label">Appearance</span>
      </summary>
      <div className="appearance-options" role="group" aria-label="Appearance options">
        {options.map(({ value: option, label, icon: OptionIcon }) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => {
              onChange(option);
              close(true);
            }}
          >
            <OptionIcon size={17} aria-hidden="true" />
            {label}
            {value === option && <Check size={16} className="appearance-check" aria-hidden="true" />}
          </button>
        ))}
      </div>
    </details>
  );
}
