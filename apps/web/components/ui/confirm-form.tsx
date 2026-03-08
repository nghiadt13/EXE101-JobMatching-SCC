'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PendingButton } from '@/components/ui/pending-button';
import type { ButtonProps } from '@/components/ui/button';

type ConfirmFormProps = {
  title: string;
  description?: string;
  confirmLabel?: string;
  action: (formData: FormData) => Promise<void>;
  triggerLabel: string;
  triggerVariant?: ButtonProps['variant'];
  triggerSize?: ButtonProps['size'];
  hiddenInputs?: Record<string, string>;
};

export function ConfirmForm({
  title,
  description,
  confirmLabel = 'Confirm',
  action,
  triggerLabel,
  triggerVariant = 'danger',
  triggerSize = 'sm',
  hiddenInputs = {},
}: ConfirmFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerSize}
        onClick={() => dialogRef.current?.showModal()}
      >
        {triggerLabel}
      </Button>
      <dialog
        ref={dialogRef}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl backdrop:bg-zinc-900/40"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        {description ? <p className="mt-2 text-sm text-zinc-600">{description}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => dialogRef.current?.close()}
          >
            Cancel
          </Button>
          <form action={action}>
            {Object.entries(hiddenInputs).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <PendingButton
              variant={triggerVariant === 'danger' ? 'danger' : 'default'}
              size="sm"
              type="submit"
              pendingText="Deleting…"
              onClick={() => dialogRef.current?.close()}
            >
              {confirmLabel}
            </PendingButton>
          </form>
        </div>
      </dialog>
    </>
  );
}
