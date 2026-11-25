// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandBar } from "../../src/components/CommandBar";
import { resetStore } from "../helpers/store";

const reply = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body });

beforeEach(() => resetStore());
afterEach(() => vi.unstubAllGlobals());

describe("CommandBar", () => {
  it("offers only the modes it was given", () => {
    render(<CommandBar modes={["meal", "plan"]} onResult={() => {}} />);
    expect(screen.getByRole("textbox", { name: "Describe your food" })).toHaveAttribute("placeholder", expect.stringContaining("Breakfast was"));
  });

  it("keeps the Send button off until there is text", () => {
    render(<CommandBar modes={["meal"]} onResult={() => {}} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Describe your food" }), { target: { value: "2 idlis" } });
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  });

  it("sends the text to the parser and passes the result up", async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply({ kind: "meals", transcript: "2 idlis", meals: [{ target_bucket: "Breakfast", items: [{ name: "Idli", quantity: "2", calories: 120, macros: {}, micros: {} }] }] }));
    vi.stubGlobal("fetch", fetchMock);
    const onResult = vi.fn();
    render(<CommandBar modes={["meal"]} onResult={onResult} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Describe your food" }), { target: { value: "2 idlis" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(onResult).toHaveBeenCalledTimes(1));
    expect(onResult.mock.calls[0][0].kind).toBe("meals");
    expect(onResult.mock.calls[0][1]).toBe("meal");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).text).toBe("2 idlis");
  });

  it("shows the server's message when the food is not recognised", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply({ error: "No food items recognised." }, false, 422)));
    const onResult = vi.fn();
    render(<CommandBar modes={["meal"]} onResult={onResult} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Describe your food" }), { target: { value: "hmm" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No food items recognised.");
    expect(onResult).not.toHaveBeenCalled();
  });

  it("shows the offline message when the network is down", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    render(<CommandBar modes={["meal"]} onResult={() => {}} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Describe your food" }), { target: { value: "rice" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/offline/i);
  });
});
