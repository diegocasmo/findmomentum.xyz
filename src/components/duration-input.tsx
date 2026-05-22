import type React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MS_PER_MIN, MS_PER_SECOND, formatTimeMMss } from "@/lib/utils/time";
import { MAX_MIN, MAX_SEC } from "@/app/schemas/create-task-schema";

function parseInput(input: string): { minutes: number; seconds: number } {
  const [minutes, seconds] = input.split(":").map(Number);
  return {
    minutes: isNaN(minutes) ? 0 : Math.min(minutes, MAX_MIN),
    seconds: isNaN(seconds) ? 0 : Math.min(seconds, MAX_SEC),
  };
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

  useEffect(() => {
    setInputValue(formatValue(value));
  }, [value]);

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
      const { minutes, seconds } = parseInput(newValue);
      const totalMs = minutes * MS_PER_MIN + seconds * MS_PER_SECOND;
      onChange(totalMs);
    }
  };

  const handleBlur = () => {
    const { minutes, seconds } = parseInput(inputValue);
    const formattedValue = formatTimeMMss(
      minutes * MS_PER_MIN + seconds * MS_PER_SECOND
    );
    setInputValue(formattedValue);
    onChange(minutes * MS_PER_MIN + seconds * MS_PER_SECOND);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const { minutes, seconds } = parseInput(inputValue);
      let totalSeconds = minutes * 60 + seconds;
      const increment = e.shiftKey ? 10 : 1;

      if (e.key === "ArrowUp") {
        totalSeconds = Math.min(
          totalSeconds + increment,
          MAX_MIN * 60 + MAX_SEC
        );
      } else {
        totalSeconds = Math.max(totalSeconds - increment, 0);
      }

      const newMinutes = Math.floor(totalSeconds / 60);
      const newSeconds = totalSeconds % 60;
      const newValue = formatTimeMMss(
        newMinutes * MS_PER_MIN + newSeconds * MS_PER_SECOND
      );
      setInputValue(newValue);
      onChange(newMinutes * MS_PER_MIN + newSeconds * MS_PER_SECOND);
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
