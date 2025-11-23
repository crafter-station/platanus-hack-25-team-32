"use client";

import { Message, StreamingMessage } from "@v0-sdk/react";
import { Loader } from "@/components/ai-elements/loader";
import { Badge } from "@/components/ui/badge";
import type { MessageBinaryFormat } from "@/lib/v0-types";

interface V0Message {
	id: string;
	role: "user" | "assistant";
	content: string | MessageBinaryFormat;
	isStreaming?: boolean;
	stream?: ReadableStream<Uint8Array>;
}

interface ScrapiLogsPanelProps {
	chatId?: string;
	messages: V0Message[];
	stage: string;
	isLoading?: boolean;
	onStreamingComplete?: (content: MessageBinaryFormat) => void;
	onChatData?: (data: any) => void;
}

export function ScrapiLogsPanel({
	chatId,
	messages,
	stage,
	isLoading = false,
	onStreamingComplete,
	onChatData,
}: ScrapiLogsPanelProps) {
	return (
		<div className="flex flex-col overflow-hidden bg-background">
			{/* Header */}
			<div className="border-b p-3 bg-muted/30">
				<div className="flex items-center gap-2">
					<span className="text-xs font-medium text-muted-foreground">
						SCRAPI LOGS
					</span>
					{chatId && (
						<Badge
							variant="outline"
							className="h-4 px-1.5 text-[9px] font-mono"
						>
							{chatId.slice(0, 8)}
						</Badge>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto p-3 space-y-4">
				{!chatId ? (
					<div className="flex items-center justify-center h-full">
						<div className="flex flex-col items-center gap-2">
							<Loader size={20} />
							<div className="text-center">
								<p className="text-sm font-medium text-muted-foreground">
									Waiting for chat ID...
								</p>
								<p className="text-xs text-muted-foreground mt-1">
									The chat will be created during trigger execution
								</p>
							</div>
						</div>
					</div>
				) : isLoading && messages.length === 0 ? (
					<div className="flex items-center justify-center h-full">
						<div className="flex flex-col items-center gap-2">
							<Loader size={20} />
							<div className="text-center">
								<p className="text-sm font-medium text-muted-foreground">
									Loading chat history...
								</p>
								<p className="text-xs text-muted-foreground mt-1 font-mono">
									Chat ID: {chatId.slice(0, 8)}...
								</p>
							</div>
						</div>
					</div>
				) : (
					<>
						{messages.map((msg, index) => (
							<div key={msg.id || `msg-${index}`}>
								{msg.isStreaming && msg.stream ? (
									<StreamingMessage
										stream={msg.stream}
										messageId={msg.id || `stream-${index}`}
										role={msg.role}
										onComplete={onStreamingComplete}
										onChatData={onChatData}
										onError={(error) =>
											console.error("Streaming error:", error)
										}
										showLoadingIndicator={false}
									/>
								) : (
									<Message
										content={msg.content}
										messageId={msg.id || `msg-${index}`}
										role={msg.role}
									/>
								)}
							</div>
						))}

						{/* Loading indicator if still processing */}
						{(stage === "generating" || stage === "retrying") && (
							<div className="flex items-center gap-2 text-muted-foreground">
								<Loader size={14} />
								<span className="text-sm font-mono">
									{stage === "retrying"
										? "Fixing errors..."
										: "Writing code..."}
								</span>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
