import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import './dialog.css';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, onClose, title, description, children, footer }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    const previousFocus = document.activeElement;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.documentElement.style.overflow = previousOverflow;
      const target = previousFocus instanceof HTMLElement && previousFocus.isConnected
        && previousFocus !== document.body
        ? previousFocus
        : document.querySelector<HTMLElement>('main h1');
      target?.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (open) headingRef.current?.focus({ preventScroll: true });
  }, [open, title]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="campus-dialog"
    >
      {open && (
        <div className="dialog-frame">
          <div className="dialog-head">
            <div>
              <h2 ref={headingRef} id={titleId} tabIndex={-1}>{title}</h2>
              {description && <p id={descriptionId}>{description}</p>}
            </div>
            <IconButton label="Close dialog" variant="secondary" onClick={onClose}>
              <X size={19} aria-hidden="true" />
            </IconButton>
          </div>
          <div className="dialog-body">{children}</div>
          {footer && <div className="dialog-foot">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
