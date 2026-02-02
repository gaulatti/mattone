import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Handle click outside (on backdrop)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    // If the click target is the dialog itself (the backdrop area in some browsers/implementations extends to the dialog element bounds when using native backdrop but here we rely on the dialog dimensions).
    // Actually, with native dialog, clicking the ::backdrop pseudo-element registers as a click on the dialog element itself.
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  if (typeof document === 'undefined') return null;

  // We render the Portal always, but control visibility via dialog.showModal()
  // Actually, to keep it clean, we can conditonally render if not open, BUT showModal needs the ref to be present.
  // Better to render if isOpen is true.

  if (!isOpen) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className='
        backdrop:bg-black/50 dark:backdrop:bg-black/70 backdrop:backdrop-blur-sm
        bg-white dark:bg-dark-sand
        text-text-primary dark:text-text-primary
        rounded-xl shadow-xl
        p-0 m-auto
        w-full max-w-lg
        border border-sand/10 dark:border-sand/20
        outline-none
      '
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      <div className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-medium leading-6'>{title}</h3>
          <button
            type='button'
            onClick={onClose}
            className='text-text-secondary hover:text-text-primary transition-colors focus:outline-none'
            aria-label='Close'
          >
            <X size={20} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </dialog>,
    document.body
  );
}
