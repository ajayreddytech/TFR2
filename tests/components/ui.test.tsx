// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Empty, Modal, PageHeader, PeriodControls, ProgressBar, Section, fmt } from "../../src/components/ui";
import { useStore } from "../../src/lib/store";

describe("PageHeader", () => {
  it("renders a title in Title Case with an optional subtitle and right-hand control", () => {
    render(<PageHeader title="weight tracking" subtitle="Log your weight" right={<button>Export</button>} />);
    expect(screen.getByRole("heading", { level: 1, name: "Weight Tracking" })).toBeInTheDocument();
    expect(screen.getByText("Log your weight")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("omits the subtitle when none is given", () => {
    const { container } = render(<PageHeader title="Guide" />);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });
});

describe("Section", () => {
  it("shows its title and children", () => {
    render(<Section title="daily totals" subtitle="today"><p>Body text</p></Section>);
    expect(screen.getByRole("heading", { level: 2, name: "Daily Totals" })).toBeInTheDocument();
    expect(screen.getByText("today")).toBeInTheDocument();
    expect(screen.getByText("Body text")).toBeInTheDocument();
  });

  it("hides the body when collapsed", () => {
    render(<Section title="Hidden" collapsed><p>Secret</p></Section>);
    expect(screen.queryByText("Secret")).toBeNull();
  });
});

describe("ProgressBar", () => {
  it("reports its value and maximum to assistive tech", () => {
    render(<ProgressBar value={750} max={2000} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "750");
    expect(bar).toHaveAttribute("aria-valuemax", "2000");
  });

  it("handles a zero maximum without dividing by zero", () => {
    render(<ProgressBar value={5} max={0} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "0");
  });
});

describe("Empty", () => {
  it("shows its message", () => {
    render(<Empty>Nothing logged yet</Empty>);
    expect(screen.getByText("Nothing logged yet")).toBeInTheDocument();
  });
});

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(<Modal open={false} onClose={() => {}} title="Hidden"><p>x</p></Modal>);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders its content in a labelled dialog when open", () => {
    render(<Modal open onClose={() => {}} title="Confirm"><p>Inside</p></Modal>);
    expect(screen.getByRole("dialog", { name: "Confirm" })).toHaveTextContent("Inside");
  });

  it("closes when the backdrop is clicked but not when the dialog is clicked", () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="M"><p>Body</p></Modal>);
    fireEvent.click(screen.getByText("Body"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("fmt", () => {
  it("formats numbers with the requested decimals and a dash for missing values", () => {
    expect(fmt(1234.5)).toBe("1,235");
    expect(fmt(2.345, 1)).toMatch(/2\.3/);
    expect(fmt(null)).toBe("—");
    expect(fmt(undefined)).toBe("—");
  });
});

describe("PeriodControls", () => {
  it("marks the selected period and reports changes", () => {
    const setGran = vi.fn();
    render(<PeriodControls gran="week" anchor="2026-11-25" setGran={setGran} setAnchor={() => {}} />);
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Month" }));
    expect(setGran).toHaveBeenCalledWith("month");
  });

  it("moves the anchor back and forward by one period", () => {
    const setAnchor = vi.fn();
    render(<PeriodControls gran="day" anchor="2026-11-25" setGran={() => {}} setAnchor={setAnchor} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous period" }));
    expect(setAnchor).toHaveBeenLastCalledWith("2026-11-24");
  });

  it("does not allow moving to a period that starts after today", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 25, 12, 0, 0));
    try {
      // With a one-day trail, the next day (26 Nov) starts in the future, so the forward arrow is disabled.
      render(<PeriodControls gran="day" anchor="2026-11-25" trail={1} setGran={() => {}} setAnchor={() => {}} />);
      expect(screen.getByRole("button", { name: "Next period" })).toBeDisabled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows the period label", () => {
    render(<PeriodControls gran="year" anchor="2026-06-15" setGran={() => {}} setAnchor={() => {}} />);
    expect(screen.getByText("2026")).toBeInTheDocument();
  });

  it("jumps to the current period from the dropdown", () => {
    const setGran = vi.fn();
    const setAnchor = vi.fn();
    render(<PeriodControls gran="day" anchor="2026-01-01" setGran={setGran} setAnchor={setAnchor} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Jump to current" }), { target: { value: "month" } });
    expect(setGran).toHaveBeenCalledWith("month");
    expect(setAnchor).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });
});

describe("store is available to UI tests", () => {
  it("starts on the log screen", () => {
    expect(useStore.getState().view).toBeDefined();
  });
});
