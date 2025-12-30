import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@packages/ui/lib/utils";

interface ChatMarkdownProps {
	content: string;
	className?: string;
}

export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
	return (
		<div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeHighlight]}
				components={{
					h1: ({ children }) => (
						<h1 className="text-lg font-bold mt-4 mb-2 first:mt-0">{children}</h1>
					),
					h2: ({ children }) => (
						<h2 className="text-base font-semibold mt-3 mb-1.5 first:mt-0">
							{children}
						</h2>
					),
					h3: ({ children }) => (
						<h3 className="text-sm font-medium mt-2 mb-1 first:mt-0">
							{children}
						</h3>
					),
					h4: ({ children }) => (
						<h4 className="text-sm font-medium mt-2 mb-1 first:mt-0">
							{children}
						</h4>
					),
					p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
					ul: ({ children }) => (
						<ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>
					),
					ol: ({ children }) => (
						<ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>
					),
					li: ({ children }) => <li className="mb-0.5">{children}</li>,
					code: ({ className, children, ...props }) => {
						const isInline = !className;
						return isInline ? (
							<code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
								{children}
							</code>
						) : (
							<code
								className={cn(
									"block bg-muted p-2 rounded text-xs overflow-x-auto font-mono",
									className,
								)}
								{...props}
							>
								{children}
							</code>
						);
					},
					pre: ({ children }) => (
						<pre className="bg-muted rounded p-0 overflow-hidden my-2">
							{children}
						</pre>
					),
					table: ({ children }) => (
						<div className="overflow-x-auto mb-2 my-2">
							<table className="min-w-full text-xs border-collapse border border-border">
								{children}
							</table>
						</div>
					),
					thead: ({ children }) => (
						<thead className="bg-muted">{children}</thead>
					),
					tbody: ({ children }) => <tbody>{children}</tbody>,
					tr: ({ children }) => (
						<tr className="border-b border-border">{children}</tr>
					),
					th: ({ children }) => (
						<th className="border border-border px-2 py-1.5 font-medium text-left">
							{children}
						</th>
					),
					td: ({ children }) => (
						<td className="border border-border px-2 py-1.5">{children}</td>
					),
					a: ({ href, children }) => (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary underline underline-offset-2 hover:text-primary/80"
						>
							{children}
						</a>
					),
					blockquote: ({ children }) => (
						<blockquote className="border-l-2 border-primary pl-3 italic text-muted-foreground my-2">
							{children}
						</blockquote>
					),
					hr: () => <hr className="my-3 border-border" />,
					strong: ({ children }) => (
						<strong className="font-semibold">{children}</strong>
					),
					em: ({ children }) => <em className="italic">{children}</em>,
					del: ({ children }) => (
						<del className="line-through text-muted-foreground">{children}</del>
					),
					// Task list support (from remark-gfm)
					input: ({ checked, ...props }) => (
						<input
							type="checkbox"
							checked={checked}
							disabled
							className="mr-1.5 accent-primary"
							{...props}
						/>
					),
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
