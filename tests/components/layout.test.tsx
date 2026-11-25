// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RootLayout, { metadata, viewport } from "../../src/app/layout";
import Page from "../../src/app/page";

describe("root layout metadata", () => {
  it("names the app and links the web manifest", () => {
    expect(metadata.title).toBe("TheFoodRelationship");
    expect(metadata.manifest).toBe("/manifest.json");
    expect(metadata.applicationName).toBe("TheFoodRelationship");
  });

  it("sets a responsive viewport and theme colour", () => {
    expect(viewport.width).toBe("device-width");
    expect(viewport.themeColor).toBe("#0a1410");
  });

  it("does not auto-link telephone numbers", () => {
    expect(metadata.formatDetection).toEqual({ telephone: false });
  });
});

describe("RootLayout", () => {
  it("declares an English document and renders its children", () => {
    const html = RootLayout({ children: <p>Child content</p> }) as { props: { lang: string; children: { props: { children: unknown[] } } } };
    expect(html.props.lang).toBe("en");
    // Render only the body's children so jsdom doesn't have to host a second <html> element.
    const { container } = render(<div>{html.props.children.props.children[0] as React.ReactNode}</div>);
    expect(container).toHaveTextContent("Child content");
  });
});

describe("home page", () => {
  it("renders the app shell", () => {
    const { container } = render(<Page />);
    expect(container.querySelector("main")).not.toBeNull();
  });
});
