import { render, screen } from "@testing-library/react";
import { StatusIndicator } from "./status-indicator";

describe("StatusIndicator Touch Targets", () => {
  describe("Touch target size compliance", () => {
    it("small size has minimum 44x44px touch target", () => {
      render(<StatusIndicator status="process" size="sm" />);
      const indicator = screen.getByTestId("status-indicator");
      expect(indicator).toHaveClass("min-w-[44px]");
      expect(indicator).toHaveClass("min-h-[44px]");
    });

    it("medium size has minimum 44x44px touch target", () => {
      render(<StatusIndicator status="idle" size="md" />);
      const indicator = screen.getByTestId("status-indicator");
      expect(indicator).toHaveClass("min-w-[44px]");
      expect(indicator).toHaveClass("min-h-[44px]");
    });

    it("large size has minimum 56x56px touch target", () => {
      render(<StatusIndicator status="alarm" size="lg" />);
      const indicator = screen.getByTestId("status-indicator");
      expect(indicator).toHaveClass("min-w-[56px]");
      expect(indicator).toHaveClass("min-h-[56px]");
    });
  });

  describe("Label visibility for accessibility", () => {
    it("shows label by default for better touch targets", () => {
      render(<StatusIndicator status="warning" />);
      expect(screen.getByText("Warning")).toBeInTheDocument();
    });

    it("shows label by default even without explicit showLabel prop", () => {
      render(<StatusIndicator status="idle" />);
      expect(screen.getByText("Idle")).toBeInTheDocument();
    });

    it("hides label when showLabel is explicitly false", () => {
      render(<StatusIndicator status="pm" showLabel={false} />);
      expect(screen.queryByText("PM")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility attributes", () => {
    it("has role=status for screen readers", () => {
      render(<StatusIndicator status="process" />);
      const indicator = screen.getByRole("status");
      expect(indicator).toBeInTheDocument();
    });

    it("has descriptive aria-label", () => {
      render(<StatusIndicator status="alarm" />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("aria-label", "Status: Alarm");
    });
  });

  describe("Gloved operation scenarios", () => {
    it("all statuses meet touch target requirements with sm size", () => {
      const statuses = ["process", "idle", "warning", "alarm", "offline", "pm"] as const;

      statuses.forEach((status) => {
        const { container } = render(<StatusIndicator status={status} size="sm" />);
        const indicator = container.querySelector('[data-testid="status-indicator"]');
        expect(indicator).toHaveClass("min-w-[44px]");
        expect(indicator).toHaveClass("min-h-[44px]");
      });
    });

    it("all statuses have visible labels for identification", () => {
      const statuses: Array<{ status: "process" | "idle" | "warning" | "alarm" | "offline" | "pm"; label: string }> = [
        { status: "process", label: "Process" },
        { status: "idle", label: "Idle" },
        { status: "warning", label: "Warning" },
        { status: "alarm", label: "Alarm" },
        { status: "offline", label: "Offline" },
        { status: "pm", label: "PM" },
      ];

      statuses.forEach(({ status, label }) => {
        const { rerender } = render(<StatusIndicator status={status} />);
        expect(screen.getByText(label)).toBeInTheDocument();
        rerender(<div />); // Clean up for next iteration
      });
    });
  });
});
