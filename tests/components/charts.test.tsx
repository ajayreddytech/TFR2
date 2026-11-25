// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartCard } from "../../src/components/charts";

const series = [
  { key: "a", label: "Mon", value: 1800 },
  { key: "b", label: "Tue", value: 2100 },
  { key: "c", label: "Wed", value: null },
];

describe("ChartCard", () => {
  it("shows the title and subtitle in a section", () => {
    render(<ChartCard title="intake" subtitle="kcal per day" icon={null} color="#10b981" data={series} />);
    expect(screen.getByRole("heading", { name: "Intake" })).toBeInTheDocument();
    expect(screen.getByText("kcal per day")).toBeInTheDocument();
  });

  it("says so when no period has any value", () => {
    render(<ChartCard title="Hydration" icon={null} color="#0ea5e9" data={[{ key: "a", label: "Mon", value: null }]} />);
    expect(screen.getByText("No data in this period yet")).toBeInTheDocument();
  });

  it("draws the chart when there is data", () => {
    const { container } = render(<ChartCard title="Weight" icon={null} color="#8b5cf6" data={series} unit="kg" decimals={1} goal={70} goalLabel="Target" />);
    expect(screen.queryByText("No data in this period yet")).toBeNull();
    expect(container.querySelector(".recharts-responsive-container")).not.toBeNull();
  });

  it("renders the right-hand control", () => {
    render(<ChartCard title="T" icon={null} color="#000" data={series} right={<button>Toggle</button>} />);
    expect(screen.getByRole("button", { name: "Toggle" })).toBeInTheDocument();
  });
});
