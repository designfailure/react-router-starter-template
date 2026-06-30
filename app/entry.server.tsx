import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import type { ReactDOMServerReadableStream } from "react-dom/server";
import { renderToReadableStream } from "react-dom/server";

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	routerContext: EntryContext,
	_loadContext: AppLoadContext,
) {
	let shellRendered = false;
	const userAgent = request.headers.get("user-agent");

	let body: ReactDOMServerReadableStream;
	try {
		body = await renderToReadableStream(
			<ServerRouter context={routerContext} url={request.url} />,
			{
				onError(error: unknown) {
					responseStatusCode = 500;
					// Log streaming rendering errors from inside the shell.  Don't log
					// errors encountered during initial shell rendering since they'll
					// reject and get logged in handleDocumentRequest.
					if (shellRendered) {
						console.error(error);
					}
				},
			},
		);
	} catch (error) {
		console.error("Failed to render initial shell:", error);
		responseStatusCode = 500;
		responseHeaders.set("Content-Type", "text/html");
		return new Response("<!DOCTYPE html><html><body><h1>Internal Server Error</h1></body></html>", {
			headers: responseHeaders,
			status: responseStatusCode,
		});
	}
	shellRendered = true;

	// Ensure requests from bots and SPA Mode renders wait for all content to load before responding
	// https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
	if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
		await body.allReady;
	}

	responseHeaders.set("Content-Type", "text/html");
	return new Response(body, {
		headers: responseHeaders,
		status: responseStatusCode,
	});
}
