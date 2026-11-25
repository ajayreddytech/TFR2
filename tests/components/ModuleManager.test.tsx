// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModuleManager } from "../../src/components/ModuleManager";

const modules = [{ id: "m1", emoji: "🥗", title: "Lunch ideas" }];

const setup = (over: Partial<Parameters<typeof ModuleManager>[0]> = {}) => {
  const props = { modules, onAdd: vi.fn(), onRename: vi.fn(), onRemove: vi.fn(), ...over };
  render(<ModuleManager {...props} />);
  return props;
};

describe("ModuleManager", () => {
  it("starts collapsed and opens with the label", () => {
    setup();
    const toggle = screen.getByRole("button", { name: "Manage modules" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("New module name")).toBeNull();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("New module name")).toBeInTheDocument();
  });

  it("uses a custom label", () => {
    setup({ label: "Manage recipes" });
    expect(screen.getByRole("button", { name: "Manage recipes" })).toBeInTheDocument();
  });

  it("explains when there are no modules yet", () => {
    setup({ modules: [] });
    fireEvent.click(screen.getByRole("button", { name: "Manage modules" }));
    expect(screen.getByText(/No modules yet/)).toBeInTheDocument();
  });

  it("adds a new module with an emoji and clears the form", () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Manage modules" }));
    fireEvent.change(screen.getByLabelText("New module emoji"), { target: { value: "🍲" } });
    const name = screen.getByLabelText("New module name") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "Soups" } });
    fireEvent.click(screen.getByRole("button", { name: /Add/ }));
    expect(onAdd).toHaveBeenCalledWith("Soups", "🍲");
    expect(name.value).toBe("");
  });

  it("renames a module when its name loses focus", () => {
    const { onRename } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Manage modules" }));
    const name = screen.getByLabelText("Name of Lunch ideas");
    fireEvent.change(name, { target: { value: "Lunch favourites" } });
    fireEvent.blur(name);
    expect(onRename).toHaveBeenCalledWith("m1", "Lunch favourites", "🥗");
  });

  it("does not rename to a blank name", () => {
    const { onRename } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Manage modules" }));
    const name = screen.getByLabelText("Name of Lunch ideas");
    fireEvent.change(name, { target: { value: "   " } });
    fireEvent.blur(name);
    expect(onRename).not.toHaveBeenCalled();
  });

  it("deletes a module only after confirmation", () => {
    const { onRemove } = setup();
    vi.stubGlobal("confirm", () => true);
    fireEvent.click(screen.getByRole("button", { name: "Manage modules" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Lunch ideas" }));
    expect(onRemove).toHaveBeenCalledWith("m1");
    vi.unstubAllGlobals();
  });
});
