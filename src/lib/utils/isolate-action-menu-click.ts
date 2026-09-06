import type React from "react";

// Action menus render inside interactive ancestors (a linked activity card, a
// clickable task row), so their clicks must not reach them. Submit buttons stay
// exempt so the form they belong to still submits.
export function isolateActionMenuClick(event: React.MouseEvent<HTMLElement>) {
  event.stopPropagation();

  const isFormSubmit =
    (event.target as HTMLElement)?.getAttribute?.("type") === "submit";

  if (!isFormSubmit) {
    event.preventDefault();
  }
}
