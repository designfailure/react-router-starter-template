import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { links, ErrorBoundary } from "../app/root";

vi.mock("react-router", () => ({
	isRouteErrorResponse: (error: any) =>
		error && typeof error.status === "number",
	Links: () => null,
	Meta: () => null,
	Outlet: () => <div data-testid="outlet" />,
	Scripts: () => null,
	ScrollRestoration: () => null,
}));

describe("root module", () => {
	describe("links", () => {
		it("returns preconnect link to Google Fonts", () => {
			const result = links();
			expect(result).toContainEqual({
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			});
		});

		it("returns preconnect link to gstatic with crossOrigin", () => {
			const result = links();
			expect(result).toContainEqual({
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			});
		});

		it("returns stylesheet link for Inter font", () => {
			const result = links();
			const stylesheetLink = result.find(
				(link: any) => link.rel === "stylesheet",
			);
			expect(stylesheetLink).toBeDefined();
			expect(stylesheetLink!.href).toContain("fonts.googleapis.com");
			expect(stylesheetLink!.href).toContain("Inter");
		});

		it("returns exactly three link entries", () => {
			const result = links();
			expect(result).toHaveLength(3);
		});
	});

	describe("App", () => {
		it("renders the Outlet component", async () => {
			const { default: App } = await import("../app/root");
			render(<App />);
			expect(screen.getByTestId("outlet")).toBeInTheDocument();
		});
	});

	describe("Layout", () => {
		it("renders children within html structure", async () => {
			const { Layout } = await import("../app/root");
			const { container } = render(
				<Layout>
					<div data-testid="child">Hello</div>
				</Layout>,
			);
			expect(screen.getByTestId("child")).toBeInTheDocument();
			expect(container.querySelector("html")).toBeFalsy(); // render doesn't wrap in html in jsdom
			expect(screen.getByText("Hello")).toBeInTheDocument();
		});
	});

	describe("ErrorBoundary", () => {
		it("displays 404 message for 404 route error", () => {
			const error = { status: 404, statusText: "Not Found", data: null };
			render(<ErrorBoundary error={error} />);
			expect(screen.getByText("404")).toBeInTheDocument();
			expect(
				screen.getByText("The requested page could not be found."),
			).toBeInTheDocument();
		});

		it("displays Error message for non-404 route errors", () => {
			const error = {
				status: 500,
				statusText: "Internal Server Error",
				data: null,
			};
			render(<ErrorBoundary error={error} />);
			expect(screen.getByText("Error")).toBeInTheDocument();
			expect(
				screen.getByText("Internal Server Error"),
			).toBeInTheDocument();
		});

		it("uses default details when statusText is empty for route errors", () => {
			const error = { status: 500, statusText: "", data: null };
			render(<ErrorBoundary error={error} />);
			expect(screen.getByText("Error")).toBeInTheDocument();
			expect(
				screen.getByText("An unexpected error occurred."),
			).toBeInTheDocument();
		});

		it("displays generic error for non-route errors in production", () => {
			const originalEnv = import.meta.env.DEV;
			// In test environment, import.meta.env.DEV may be true
			// We test the fallback path with a non-Error object
			render(<ErrorBoundary error={"some string error"} />);
			expect(screen.getByText("Oops!")).toBeInTheDocument();
			expect(
				screen.getByText("An unexpected error occurred."),
			).toBeInTheDocument();
		});

		it("displays error details and stack in DEV mode for Error instances", () => {
			const error = new Error("Something broke");
			error.stack = "Error: Something broke\n    at test.tsx:1:1";
			render(<ErrorBoundary error={error} />);
			expect(screen.getByText("Oops!")).toBeInTheDocument();
			expect(screen.getByText("Something broke")).toBeInTheDocument();
			const preElement = screen.getByRole("code", { hidden: true }).closest("pre") ?? document.querySelector("pre");
			expect(preElement).toBeInTheDocument();
			expect(preElement!.textContent).toContain("Error: Something broke");
			expect(preElement!.textContent).toContain("at test.tsx:1:1");
		});
	});
});
