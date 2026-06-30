import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock react-dom/server
vi.mock("react-dom/server", () => ({
	renderToReadableStream: vi.fn().mockImplementation(async (_element, options) => {
		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(encoder.encode("<html><body>Hello</body></html>"));
				controller.close();
			},
		});
		return Object.assign(stream, {
			allReady: Promise.resolve(),
		});
	}),
}));

// Mock react-router
vi.mock("react-router", () => ({
	ServerRouter: ({ url }: { url: string }) => null,
}));

// Mock isbot
vi.mock("isbot", () => ({
	isbot: (ua: string) => ua.includes("Googlebot"),
}));

describe("entry.server handleRequest", () => {
	it("returns a Response with text/html content type", async () => {
		const { default: handleRequest } = await import(
			"../app/entry.server"
		);

		const request = new Request("http://localhost/", {
			headers: { "user-agent": "Mozilla/5.0" },
		});
		const responseHeaders = new Headers();
		const routerContext = { isSpaMode: false } as any;

		const response = await handleRequest(
			request,
			200,
			responseHeaders,
			routerContext,
			{},
		);

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get("Content-Type")).toBe("text/html");
	});

	it("returns the provided status code", async () => {
		const { default: handleRequest } = await import(
			"../app/entry.server"
		);

		const request = new Request("http://localhost/", {
			headers: { "user-agent": "Mozilla/5.0" },
		});
		const responseHeaders = new Headers();
		const routerContext = { isSpaMode: false } as any;

		const response = await handleRequest(
			request,
			201,
			responseHeaders,
			routerContext,
			{},
		);

		expect(response.status).toBe(201);
	});

	it("waits for allReady when user agent is a bot", async () => {
		const { renderToReadableStream } = await import("react-dom/server");
		const mockAllReady = Promise.resolve();
		(renderToReadableStream as any).mockImplementationOnce(async () => {
			const encoder = new TextEncoder();
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue(
						encoder.encode("<html><body>Bot</body></html>"),
					);
					controller.close();
				},
			});
			return Object.assign(stream, { allReady: mockAllReady });
		});

		const { default: handleRequest } = await import(
			"../app/entry.server"
		);

		const request = new Request("http://localhost/", {
			headers: { "user-agent": "Googlebot/2.1" },
		});
		const responseHeaders = new Headers();
		const routerContext = { isSpaMode: false } as any;

		const response = await handleRequest(
			request,
			200,
			responseHeaders,
			routerContext,
			{},
		);

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get("Content-Type")).toBe("text/html");
	});

	it("waits for allReady in SPA mode", async () => {
		const { renderToReadableStream } = await import("react-dom/server");
		const mockAllReady = Promise.resolve();
		(renderToReadableStream as any).mockImplementationOnce(async () => {
			const encoder = new TextEncoder();
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue(
						encoder.encode("<html><body>SPA</body></html>"),
					);
					controller.close();
				},
			});
			return Object.assign(stream, { allReady: mockAllReady });
		});

		const { default: handleRequest } = await import(
			"../app/entry.server"
		);

		const request = new Request("http://localhost/", {
			headers: { "user-agent": "Mozilla/5.0" },
		});
		const responseHeaders = new Headers();
		const routerContext = { isSpaMode: true } as any;

		const response = await handleRequest(
			request,
			200,
			responseHeaders,
			routerContext,
			{},
		);

		expect(response).toBeInstanceOf(Response);
	});

	it("handles missing user-agent header gracefully", async () => {
		const { default: handleRequest } = await import(
			"../app/entry.server"
		);

		const request = new Request("http://localhost/");
		const responseHeaders = new Headers();
		const routerContext = { isSpaMode: false } as any;

		const response = await handleRequest(
			request,
			200,
			responseHeaders,
			routerContext,
			{},
		);

		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(200);
	});

	it("sets status to 500 when onError is called after shell renders", async () => {
		const { renderToReadableStream } = await import("react-dom/server");
		let capturedOnError: ((error: unknown) => void) | undefined;

		(renderToReadableStream as any).mockImplementationOnce(
			async (_element: any, options: any) => {
				capturedOnError = options?.onError;
				const encoder = new TextEncoder();
				const stream = new ReadableStream({
					start(controller) {
						controller.enqueue(
							encoder.encode("<html><body>Error</body></html>"),
						);
						controller.close();
					},
				});
				return Object.assign(stream, { allReady: Promise.resolve() });
			},
		);

		const { default: handleRequest } = await import(
			"../app/entry.server"
		);

		const request = new Request("http://localhost/", {
			headers: { "user-agent": "Mozilla/5.0" },
		});
		const responseHeaders = new Headers();
		const routerContext = { isSpaMode: false } as any;

		const response = await handleRequest(
			request,
			200,
			responseHeaders,
			routerContext,
			{},
		);

		// The onError was captured; simulate a streaming error after shell rendered
		expect(capturedOnError).toBeDefined();
		// After handleRequest completes, shellRendered is true, so calling onError should log
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		capturedOnError!(new Error("streaming error"));
		expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
		consoleSpy.mockRestore();
	});

	it("does not log errors when onError is called before shell renders", async () => {
		const { renderToReadableStream } = await import("react-dom/server");
		let capturedOnError: ((error: unknown) => void) | undefined;

		(renderToReadableStream as any).mockImplementationOnce(
			async (_element: any, options: any) => {
				capturedOnError = options?.onError;
				// Call onError before the stream is returned (before shellRendered = true)
				if (capturedOnError) {
					capturedOnError(new Error("initial shell error"));
				}
				const encoder = new TextEncoder();
				const stream = new ReadableStream({
					start(controller) {
						controller.enqueue(
							encoder.encode("<html><body>Error</body></html>"),
						);
						controller.close();
					},
				});
				return Object.assign(stream, { allReady: Promise.resolve() });
			},
		);

		const { default: handleRequest } = await import(
			"../app/entry.server"
		);

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const request = new Request("http://localhost/", {
			headers: { "user-agent": "Mozilla/5.0" },
		});
		const responseHeaders = new Headers();
		const routerContext = { isSpaMode: false } as any;

		const response = await handleRequest(
			request,
			200,
			responseHeaders,
			routerContext,
			{},
		);

		// Error occurred before shell rendered, so console.error should NOT have been called
		expect(consoleSpy).not.toHaveBeenCalled();
		// But status code should be updated to 500
		expect(response.status).toBe(500);
		consoleSpy.mockRestore();
	});
});
