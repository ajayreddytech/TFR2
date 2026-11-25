// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ServiceWorkerRegister from "../../src/components/ServiceWorkerRegister";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("ServiceWorkerRegister", () => {
  it("renders nothing visible", () => {
    const { container } = render(<ServiceWorkerRegister />);
    expect(container).toBeEmptyDOMElement();
  });

  it("registers /sw.js in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const register = vi.fn().mockResolvedValue({});
    Object.defineProperty(navigator, "serviceWorker", { value: { register }, configurable: true });
    render(<ServiceWorkerRegister />);
    expect(register).toHaveBeenCalledWith("/sw.js");
    Reflect.deleteProperty(navigator, "serviceWorker");
  });

  it("does not register during development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const register = vi.fn();
    Object.defineProperty(navigator, "serviceWorker", { value: { register }, configurable: true });
    render(<ServiceWorkerRegister />);
    expect(register).not.toHaveBeenCalled();
    Reflect.deleteProperty(navigator, "serviceWorker");
  });

  it("ignores a registration failure without crashing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const register = vi.fn().mockRejectedValue(new Error("blocked"));
    Object.defineProperty(navigator, "serviceWorker", { value: { register }, configurable: true });
    expect(() => render(<ServiceWorkerRegister />)).not.toThrow();
    await Promise.resolve();
    Reflect.deleteProperty(navigator, "serviceWorker");
  });
});
