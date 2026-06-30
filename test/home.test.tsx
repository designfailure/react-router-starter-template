import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { meta, loader } from "../app/routes/home";

describe("home route", () => {
	describe("meta", () => {
		it("returns the correct title", () => {
			const result = meta({} as any);
			expect(result).toContainEqual({ title: "New React Router App" });
		});

		it("returns the correct description", () => {
			const result = meta({} as any);
			expect(result).toContainEqual({
				name: "description",
				content: "Welcome to React Router!",
			});
		});

		it("returns exactly two meta entries", () => {
			const result = meta({} as any);
			expect(result).toHaveLength(2);
		});
	});

	describe("loader", () => {
		it("returns the message from cloudflare env", () => {
			const context = {
				cloudflare: {
					env: { VALUE_FROM_CLOUDFLARE: "Hello World" },
				},
			};
			const result = loader({ context } as any);
			expect(result).toEqual({ message: "Hello World" });
		});

		it("returns undefined message when env value is missing", () => {
			const context = {
				cloudflare: {
					env: {},
				},
			};
			const result = loader({ context } as any);
			expect(result).toEqual({ message: undefined });
		});
	});

	describe("Home component", () => {
		it("renders the Welcome component with loader data", async () => {
			const { default: Home } = await import("../app/routes/home");
			render(<Home loaderData={{ message: "Test message" }} /> as any);
			expect(screen.getByText("Test message")).toBeInTheDocument();
		});
	});
});
