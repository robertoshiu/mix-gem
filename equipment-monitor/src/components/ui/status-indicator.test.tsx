import { render, screen } from "@testing-library/react";
import { StatusIndicator } from "./status-indicator";

describe("StatusIndicator", () => {
  it("renders normal status with emerald color", () => {
    render(<StatusIndicator status="normal" />);
    const indicator = screen.getByRole("status");
    expect(indicator).toHaveClass("bg-emerald-500");
  });

  it("renders alarm status with red color and pulse", () => {
    render(<StatusIndicator status="alarm" />);
    const indicator = screen.getByRole("status");
    expect(indicator).toHaveClass("bg-red-500");
    expect(indicator).toHaveClass("animate-pulse");
  });

  it("renders with label when showLabel is true", () => {
    render(<StatusIndicator status="warning" showLabel />);
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });
});
