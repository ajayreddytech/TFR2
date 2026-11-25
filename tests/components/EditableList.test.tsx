// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditableList } from "../../src/components/EditableList";

const setup = (over: Partial<Parameters<typeof EditableList>[0]> = {}) => {
  const props = { items: ["Walk", "Stretch"], onAdd: vi.fn(), onEdit: vi.fn(), onRemove: vi.fn(), ...over };
  render(<EditableList {...props} />);
  return props;
};

describe("EditableList", () => {
  it("lists the items", () => {
    setup();
    expect(screen.getByText("Walk")).toBeInTheDocument();
    expect(screen.getByText("Stretch")).toBeInTheDocument();
  });

  it("hides edit controls until Edit is pressed", () => {
    setup();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2);
  });

  it("numbers the items when asked to", () => {
    setup({ numbered: true });
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("adds a trimmed new item and clears the box", () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    const box = screen.getByRole("textbox", { name: "New item" }) as HTMLInputElement;
    fireEvent.change(box, { target: { value: "  Meditate  " } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onAdd).toHaveBeenCalledWith("  Meditate  ");
    expect(box.value).toBe("");
  });

  it("does not add a blank item", () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("edits an item in place and saves it", () => {
    const { onEdit } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[1]);
    const area = screen.getByRole("textbox", { name: "Edit item" });
    expect(area).toHaveValue("Stretch");
    fireEvent.change(area, { target: { value: "Yoga" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onEdit).toHaveBeenCalledWith(1, "Yoga");
  });

  it("saves on Enter but not on Shift+Enter", () => {
    const { onEdit } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    const area = screen.getByRole("textbox", { name: "Edit item" });
    fireEvent.keyDown(area, { key: "Enter", shiftKey: true });
    expect(onEdit).not.toHaveBeenCalled();
    fireEvent.keyDown(area, { key: "Enter" });
    expect(onEdit).toHaveBeenCalledWith(0, "Walk");
  });

  it("cancels an edit with Escape without saving", () => {
    const { onEdit } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Edit item" }), { key: "Escape" });
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Edit item" })).toBeNull();
  });

  it("deletes an item only after confirmation", () => {
    const { onRemove } = setup();
    vi.stubGlobal("confirm", () => false);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    expect(onRemove).not.toHaveBeenCalled();
    vi.stubGlobal("confirm", () => true);
    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    expect(onRemove).toHaveBeenCalledWith(0);
    vi.unstubAllGlobals();
  });
});
