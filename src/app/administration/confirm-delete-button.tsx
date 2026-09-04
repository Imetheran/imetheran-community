"use client";

type ConfirmDeleteButtonProps = {
  label: string;
  confirmMessage: string;
  className?: string;
  disabled?: boolean;
};

export function ConfirmDeleteButton({
  label,
  confirmMessage,
  className,
  disabled = false,
}: ConfirmDeleteButtonProps) {
  return (
    <button
      className={className}
      type="submit"
      disabled={disabled}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
