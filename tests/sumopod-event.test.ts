import { describe, expect, it } from "vitest";
import { normalizeSumoPodCompletedAt } from "../lib/integrations/sumopod-event";

describe("SumoPod payment event timestamps", () => {
  const receivedAt = new Date("2026-08-04T00:17:02.000Z");

  it("uses receipt time when sandbox sends a future settlement timestamp", () => {
    expect(normalizeSumoPodCompletedAt("2026-08-06T00:17:01Z", receivedAt)).toBe(
      "2026-08-04T00:17:02.000Z",
    );
  });

  it("preserves a valid completion time before receipt", () => {
    expect(normalizeSumoPodCompletedAt("2026-08-04T00:16:58Z", receivedAt)).toBe(
      "2026-08-04T00:16:58.000Z",
    );
  });

  it("falls back to receipt time when completion time is absent or malformed", () => {
    expect(normalizeSumoPodCompletedAt(undefined, receivedAt)).toBe(
      "2026-08-04T00:17:02.000Z",
    );
    expect(normalizeSumoPodCompletedAt("invalid", receivedAt)).toBe(
      "2026-08-04T00:17:02.000Z",
    );
  });
});
