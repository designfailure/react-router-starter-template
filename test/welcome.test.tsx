import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Welcome } from "../app/welcome/welcome";

describe("Welcome component", () => {
	it("renders the message prop", () => {
		render(<Welcome message="Hello from Cloudflare" />);
		expect(screen.getByText("Hello from Cloudflare")).toBeInTheDocument();
	});

	it("renders the 'What's next?' heading", () => {
		render(<Welcome message="test" />);
		expect(screen.getByText("What's next?")).toBeInTheDocument();
	});

	it("renders React Router Docs link", () => {
		render(<Welcome message="test" />);
		const link = screen.getByRole("link", { name: /React Router Docs/i });
		expect(link).toHaveAttribute("href", "https://reactrouter.com/docs");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noreferrer");
	});

	it("renders Join Discord link", () => {
		render(<Welcome message="test" />);
		const link = screen.getByRole("link", { name: /Join Discord/i });
		expect(link).toHaveAttribute("href", "https://rmx.as/discord");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noreferrer");
	});

	it("renders both logo images", () => {
		render(<Welcome message="test" />);
		const images = screen.getAllByAltText("React Router");
		expect(images).toHaveLength(2);
	});

	it("renders the light logo with correct visibility classes", () => {
		render(<Welcome message="test" />);
		const images = screen.getAllByAltText("React Router");
		const lightLogo = images[0];
		expect(lightLogo).toHaveClass("block", "dark:hidden");
	});

	it("renders the dark logo with correct visibility classes", () => {
		render(<Welcome message="test" />);
		const images = screen.getAllByAltText("React Router");
		const darkLogo = images[1];
		expect(darkLogo).toHaveClass("hidden", "dark:block");
	});

	it("renders all resource links in a list", () => {
		render(<Welcome message="test" />);
		const list = screen.getByRole("list");
		expect(list).toBeInTheDocument();
		const links = screen.getAllByRole("link");
		expect(links).toHaveLength(2);
	});

	it("renders an empty message without crashing", () => {
		render(<Welcome message="" />);
		expect(screen.getByText("What's next?")).toBeInTheDocument();
	});
});
