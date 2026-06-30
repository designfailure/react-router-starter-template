interface ResourceLinkProps {
	href: string;
	icon: React.ReactNode;
	text: string;
}

export function ResourceLink({ href, icon, text }: ResourceLinkProps) {
	return (
		<a
			className="group flex items-center gap-3 self-stretch p-3 leading-normal text-blue-700 hover:underline dark:text-blue-500"
			href={href}
			target="_blank"
			rel="noreferrer"
		>
			{icon}
			{text}
		</a>
	);
}
