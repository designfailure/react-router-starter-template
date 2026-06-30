import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export function loader({ context }: Route.LoaderArgs) {
	const message = context.cloudflare.env.VALUE_FROM_CLOUDFLARE;
	if (!message) {
		console.error("Missing VALUE_FROM_CLOUDFLARE binding in Cloudflare environment");
		throw new Response("Server configuration error", { status: 500 });
	}
	return { message };
}

export default function Home({ loaderData }: Route.ComponentProps) {
	return <Welcome message={loaderData.message} />;
}
