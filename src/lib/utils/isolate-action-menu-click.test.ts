import { describe, it, expect, vi } from "vitest";
import type React from "react";

import { isolateActionMenuClick } from "./isolate-action-menu-click";

function createClickEvent(targetType: string | null) {
  const event = {
    stopPropagation: vi.fn(),
    preventDefault: vi.fn(),
    target: { getAttribute: () => targetType },
  };

  return {
    event: event as unknown as React.MouseEvent<HTMLElement>,
    stopPropagation: event.stopPropagation,
    preventDefault: event.preventDefault,
  };
}

describe("isolateActionMenuClick", () => {
  it("stops the click and its default for a non-submit target", () => {
    const { event, stopPropagation, preventDefault } =
      createClickEvent("button");

    isolateActionMenuClick(event);

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("keeps the default for a submit target so the form submits", () => {
    const { event, stopPropagation, preventDefault } =
      createClickEvent("submit");

    isolateActionMenuClick(event);

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("stops the click when the target exposes no type attribute", () => {
    const { event, stopPropagation, preventDefault } = createClickEvent(null);

    isolateActionMenuClick(event);

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });
});
