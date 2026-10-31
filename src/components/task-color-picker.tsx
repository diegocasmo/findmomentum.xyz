import { useId, type Ref } from "react";
import { Check } from "lucide-react";
import { TASK_COLORS, TASK_COLOR_NAMES } from "@/lib/utils/task-colors";

type TaskColorPickerProps = {
  name: string;
  value: string;
  onChange: (color: string) => void;
  onBlur: () => void;
  inputRef: Ref<HTMLInputElement>;
  disabled?: boolean;
  error?: string;
};

export function TaskColorPicker({
  name,
  value,
  onChange,
  onBlur,
  inputRef,
  disabled,
  error,
}: TaskColorPickerProps) {
  const errorId = useId();
  const selectedColor = TASK_COLORS.find((color) => color === value);

  return (
    <fieldset
      disabled={disabled}
      aria-invalid={!!error}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="sr-only">Color</legend>
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-8 sm:gap-0">
        {TASK_COLORS.map((color, index) => (
          <label
            key={color}
            className="relative flex size-11 shrink-0 items-center justify-center"
          >
            <input
              type="radio"
              name={name}
              value={color}
              checked={value === color}
              onChange={() => onChange(color)}
              onBlur={onBlur}
              ref={
                value === color || (!selectedColor && index === 0)
                  ? inputRef
                  : undefined
              }
              aria-label={TASK_COLOR_NAMES[color]}
              aria-describedby={error ? errorId : undefined}
              className="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
            <span
              aria-hidden="true"
              style={{ backgroundColor: color }}
              className="pointer-events-none flex size-7 items-center justify-center rounded-full peer-checked:ring-2 peer-checked:ring-foreground peer-checked:ring-offset-2 peer-checked:ring-offset-background peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[6px] peer-focus-visible:outline-ring peer-disabled:opacity-50"
            >
              {value === color && (
                <Check
                  className="size-4 rounded-full bg-white p-0.5 text-black"
                  strokeWidth={3}
                />
              )}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
