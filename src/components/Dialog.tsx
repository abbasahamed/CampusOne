import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        previousFocusRef.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
      previousFocusRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
      previousFocusRef.current?.focus();
    };

    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  if (!open) {
    return <dialog ref={dialogRef} className="hidden" aria-hidden="true" />;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      className="fixed inset-0 m-0 mt-auto max-h-[88dvh] w-full max-w-none rounded-t-[var(--radius-prominent)] border border-divider bg-surface p-0 text-text-primary shadow-[var(--shadow-dialog)] backdrop:bg-[var(--backdrop-scrim)] sm:m-auto sm:max-h-[85dvh] sm:max-w-lg sm:rounded-[var(--radius-prominent)]"
    >
      <div className="flex max-h-[88dvh] flex-col sm:max-h-[85dvh]">
        <div className="flex items-start justify-between gap-4 border-b border-divider px-5 py-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[1.125rem] leading-[1.5rem] font-semibold text-text-primary"
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-[0.875rem] leading-[1.25rem] text-text-secondary"
              >
                {description}
              </p>
            ) : null}
          </div>
          <IconButton label="Close dialog" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden="true" />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-divider px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
