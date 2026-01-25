import { render, screen } from "@testing-library/react";
import { StatusIndicator } from "./status-indicator";

describe("StatusIndicator", () => {
  it("renders process status with emerald color", () => {
    render(<StatusIndicator status="process" />);
    const indicator = screen.getByRole("status");
    const dot = indicator.firstChild;
    expect(dot).toHaveClass("bg-emerald-500");
  });

  it("renders alarm status with red color and pulse", () => {
    render(<StatusIndicator status="alarm" />);
    const indicator = screen.getByRole("status");
    const dot = indicator.firstChild;
    expect(dot).toHaveClass("bg-red-500");
    expect(dot).toHaveClass("animate-pulse");
  });

  it("renders with label when showLabel is true", () => {
    render(<StatusIndicator status="warning" showLabel />);
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });
});
