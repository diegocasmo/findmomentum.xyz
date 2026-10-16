import type React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { MS_PER_MIN, MS_PER_SECOND, formatTimeMMss } from "@/lib/utils/time";
import { MAX_MIN, MAX_SEC } from "@/app/schemas/create-task-schema";

function parseInputMs(input: string): number {
  const [minutes, seconds] = input.split(":").map(Number);
  return (
    (isNaN(minutes) ? 0 : Math.min(minutes, MAX_MIN)) * MS_PER_MIN +
    (isNaN(seconds) ? 0 : Math.min(seconds, MAX_SEC)) * MS_PER_SECOND
  );
}

const formatValue = (value: number) =>
  value === 0 ? "" : formatTimeMMss(value);

type DurationInputProps = React.ComponentProps<"input"> & {
  value: number;
  onChange: (value: number) => void;
};

export function DurationInput({
  value,
  onChange,
  ...field
}: DurationInputProps) {
  const [inputValue, setInputValue] = useState(formatValue(value));
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(formatValue(value));
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.replace(/[^\d:]/g, "");

    if (newValue.length > 5) return;

    if (
      newValue.length === 2 &&
      !newValue.includes(":") &&
      // Make sure user is typing rather than deleting
      newValue.length > inputValue.length
    ) {
      newValue += ":";
    }

    setInputValue(newValue);

    if (newValue.length === 5) {
      onChange(parseInputMs(newValue));
    }
  };

  const handleBlur = () => {
    const totalMs = parseInputMs(inputValue);
    setInputValue(formatTimeMMss(totalMs));
    onChange(totalMs);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      let totalSeconds = parseInputMs(inputValue) / MS_PER_SECOND;
      const increment = e.shiftKey ? 10 : 1;

      if (e.key === "ArrowUp") {
        totalSeconds = Math.min(
          totalSeconds + increment,
          MAX_MIN * 60 + MAX_SEC
        );
      } else {
        totalSeconds = Math.max(totalSeconds - increment, 0);
      }

      const totalMs = totalSeconds * MS_PER_SECOND;
      setInputValue(formatTimeMMss(totalMs));
      onChange(totalMs);
    }
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={inputValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      placeholder="MM:ss"
      maxLength={5}
      {...field}
    />
  );
}
