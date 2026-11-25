// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRecorder } from "../../src/lib/useRecorder";

describe("useRecorder", () => {
  it("reports recording as unsupported when the browser has no microphone API", () => {
    const { result } = renderHook(() => useRecorder(() => {}));
    expect(result.current.supported).toBe(false);
  });

  it("explains that typing is the fallback when recording is not supported", async () => {
    const { result } = renderHook(() => useRecorder(() => {}));
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.error).toMatch(/isn't supported in this browser/);
    expect(result.current.recording).toBe(false);
  });

  it("clears the error when asked", async () => {
    const { result } = renderHook(() => useRecorder(() => {}));
    await act(async () => {
      await result.current.start();
    });
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it("starts with nothing recording or processing", () => {
    const onAudio = vi.fn();
    const { result } = renderHook(() => useRecorder(onAudio));
    expect(result.current).toMatchObject({ recording: false, processing: false, seconds: 0, error: null });
    expect(onAudio).not.toHaveBeenCalled();
  });
});
