import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Browser APIs that jsdom leaves out but charts, motion and media queries need.
if (typeof window !== "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
  }
  window.scrollTo = () => {};
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  if (typeof window !== "undefined") vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
