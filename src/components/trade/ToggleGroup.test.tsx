import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToggleGroup } from "@/components/trade/ToggleGroup";

describe("ToggleGroup", () => {
  const options = [
    { value: "REDRAFT", label: "Redraft" },
    { value: "DYNASTY", label: "Dynasty" },
  ];

  it("renders every option as a selectable button", () => {
    render(<ToggleGroup label="League Type" options={options} value="REDRAFT" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Redraft" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dynasty" })).toBeInTheDocument();
  });

  it("marks the current value's button as pressed", () => {
    render(<ToggleGroup label="League Type" options={options} value="DYNASTY" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Dynasty" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Redraft" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the selected option's value when clicked", async () => {
    const onChangeMock = vi.fn();
    const user = userEvent.setup();
    render(<ToggleGroup label="League Type" options={options} value="REDRAFT" onChange={onChangeMock} />);

    await user.click(screen.getByRole("button", { name: "Dynasty" }));

    expect(onChangeMock).toHaveBeenCalledWith("DYNASTY");
  });

  it("supports more than two options, e.g. a three-way scoring choice", () => {
    const scoringOptions = [
      { value: "STANDARD", label: "Standard" },
      { value: "HALF_PPR", label: "Half-PPR" },
      { value: "PPR", label: "PPR" },
    ];
    render(<ToggleGroup label="Scoring" options={scoringOptions} value="HALF_PPR" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Standard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Half-PPR" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "PPR" })).toBeInTheDocument();
  });

  it("shows the label", () => {
    render(<ToggleGroup label="League Type" options={options} value="REDRAFT" onChange={vi.fn()} />);

    expect(screen.getByText("League Type")).toBeInTheDocument();
  });
});
