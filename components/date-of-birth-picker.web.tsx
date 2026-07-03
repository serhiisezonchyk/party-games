import type { CSSProperties } from "react";

interface DateOfBirthPickerProps {
  backgroundColor: string;
  borderColor: string;
  maximumDate: Date;
  onChange: (date: Date) => void;
  onDismiss: () => void;
  textColor: string;
  value: Date;
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function DateOfBirthPicker({
  backgroundColor,
  borderColor,
  maximumDate,
  onChange,
  onDismiss,
  textColor,
  value,
}: DateOfBirthPickerProps) {
  return (
    <input
      autoFocus
      max={formatDateOnly(maximumDate)}
      onBlur={onDismiss}
      onChange={(event) => {
        const date = parseDateOnly(event.currentTarget.value);

        if (date) {
          onChange(date);
        }
      }}
      style={{
        ...inputStyle,
        backgroundColor,
        borderColor,
        color: textColor,
      }}
      type="date"
      value={formatDateOnly(value)}
    />
  );
}

const inputStyle: CSSProperties = {
  border: "1px solid",
  borderRadius: 14,
  boxSizing: "border-box",
  font: "inherit",
  minHeight: 48,
  outline: "none",
  padding: "0 14px",
  width: "100%",
};
