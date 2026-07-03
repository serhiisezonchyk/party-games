import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Platform } from "react-native";

interface DateOfBirthPickerProps {
  backgroundColor: string;
  borderColor: string;
  maximumDate: Date;
  onChange: (date: Date) => void;
  onDismiss: () => void;
  textColor: string;
  value: Date;
}

export function DateOfBirthPicker({
  maximumDate,
  onChange,
  onDismiss,
  value,
}: DateOfBirthPickerProps) {
  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === "android") {
      onDismiss();
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    onChange(selectedDate);
  }

  return (
    <DateTimePicker
      display={Platform.OS === "ios" ? "spinner" : "default"}
      maximumDate={maximumDate}
      mode="date"
      onChange={handleDateChange}
      value={value}
    />
  );
}
