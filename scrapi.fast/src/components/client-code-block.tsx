"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { createCssVariablesTheme } from "shiki/core";
import { cn } from "@/lib/utils";

const cssVariablesTheme = createCssVariablesTheme({
	name: "css-variables",
	variablePrefix: "--shiki-",
	variableDefaults: {},
	fontStyle: true,
});

interface ClientCodeBlockProps {
	code: string;
	lang?: string;
	className?: string;
}

export function ClientCodeBlock({
	code,
	lang = "javascript",
	className = "",
}: ClientCodeBlockProps) {
	const [html, setHtml] = useState<string>("");

	useEffect(() => {
		codeToHtml(code, {
			lang,
			themes: {
				light: cssVariablesTheme,
				dark: cssVariablesTheme,
			},
			defaultColor: false,
		}).then(setHtml);
	}, [code, lang]);

	if (!html) {
		return (
			<div
				className={cn(
					"font-mono animate-pulse rounded-lg bg-muted/50 h-32",
					className,
				)}
			/>
		);
	}

	return (
		<div
			className={cn("font-mono overflow-auto", className)}
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}
