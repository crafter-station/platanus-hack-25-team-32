"use client";

import { useEffect, useRef } from "react";
import {
  Message as AIMessage,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { StreamingMessage, Message } from "@v0-sdk/react";
import type { MessageBinaryFormat } from "@/lib/v0-types";
import { Loader } from "@/components/ai-elements/loader";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
  ChainOfThoughtContent,
} from "@/components/ai-elements/chain-of-thought";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { ScrollArea } from "@/components/ui/scroll-area";

function extractTextFromMessageBinaryFormat(
  content: MessageBinaryFormat
): string {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  const extractText = (node: any): string => {
    if (typeof node === "string") {
      return node;
    }

    if (Array.isArray(node)) {
      if (node.length >= 3 && node[0] === "text" && typeof node[2] === "string") {
        return node[2];
      }

      return node.map(extractText).filter(Boolean).join(" ");
    }

    return "";
  };

  const texts: string[] = [];
  const traverse = (arr: any[]) => {
    for (const item of arr) {
      if (Array.isArray(item)) {
        if (item.length >= 3 && item[0] === "text" && typeof item[2] === "string") {
          texts.push(item[2]);
        } else {
          traverse(item);
        }
      }
    }
  };

  traverse(content);
  return texts.join(" ") || JSON.stringify(content);
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string | MessageBinaryFormat;
  reasoning?: string[];
  tools?: Array<{
    name: string;
    input: unknown;
    output?: unknown;
    state?:
      | "input-streaming"
      | "input-available"
      | "output-available"
      | "output-error";
  }>;
  tasks?: Array<{
    description: string;
    status: "pending" | "in_progress" | "completed";
  }>;
  isStreaming?: boolean;
  stream?: ReadableStream<Uint8Array>;
}

interface ChatMessagesProps {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  currentChat?: any;
  onStreamingComplete?: (content: MessageBinaryFormat) => void;
  onChatData?: (data: any) => void;
}

export function ChatMessages({
  chatHistory,
  isLoading,
  isStreaming,
  currentChat,
  onStreamingComplete,
  onChatData,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isStreaming]);

  if (chatHistory.length === 0 && !isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            No messages yet. Start a conversation!
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div ref={scrollRef} className="flex flex-col gap-4 p-4 md:p-6">
        {chatHistory.map((msg, index) => (
          <div
            key={msg.id || `msg-${index}`}
            className={`flex w-full ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex flex-col gap-2 ${
                msg.role === "user" ? "items-end" : "items-start"
              } max-w-[85%] md:max-w-[75%]`}
            >
              {/* User messages */}
              {msg.role === "user" && (
                <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-primary-foreground shadow-sm">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="m-0 whitespace-pre-wrap break-words">
                      {typeof msg.content === "string"
                        ? msg.content
                        : extractTextFromMessageBinaryFormat(msg.content)}
                    </p>
                  </div>
                </div>
              )}

              {/* Assistant messages */}
              {msg.role === "assistant" && (
                <div className="w-full space-y-3">
                  {/* Streaming message */}
                  {msg.isStreaming && msg.stream ? (
                    <div className="rounded-2xl rounded-tl-sm border bg-card p-4 shadow-sm">
                      <StreamingMessage
                        stream={msg.stream}
                        messageId={msg.id || `stream-${index}`}
                        role="assistant"
                        onComplete={onStreamingComplete}
                        onChatData={onChatData}
                        onError={(error) =>
                          console.error("Streaming error:", error)
                        }
                        showLoadingIndicator={false}
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl rounded-tl-sm border bg-card p-4 shadow-sm space-y-4">
                      {/* Reasoning section */}
                      {msg.reasoning && msg.reasoning.length > 0 && (
                        <div className="border-b pb-3 last:border-b-0 last:pb-0">
                          <Reasoning defaultOpen={false}>
                            <ReasoningTrigger />
                            <ReasoningContent>
                              {msg.reasoning.join("\n\n")}
                            </ReasoningContent>
                          </Reasoning>
                        </div>
                      )}

                      {/* Chain of thought steps */}
                      {msg.tasks && msg.tasks.length > 0 && (
                        <div className="border-b pb-3 last:border-b-0 last:pb-0">
                          <ChainOfThought defaultOpen={true}>
                            <ChainOfThoughtHeader>
                              Execution Steps
                            </ChainOfThoughtHeader>
                            <ChainOfThoughtContent>
                              {msg.tasks.map((task, i) => (
                                <ChainOfThoughtStep
                                  key={i}
                                  label={task.description}
                                  status={
                                    task.status === "completed"
                                      ? "complete"
                                      : task.status === "in_progress"
                                        ? "active"
                                        : "pending"
                                  }
                                />
                              ))}
                            </ChainOfThoughtContent>
                          </ChainOfThought>
                        </div>
                      )}

                      {/* Tools used */}
                      {msg.tools &&
                        msg.tools.length > 0 && (
                          <div className="border-b pb-3 last:border-b-0 last:pb-0 space-y-2">
                            {msg.tools.map((tool, i) => (
                              <Tool key={i} defaultOpen={false}>
                                <ToolHeader
                                  title={tool.name}
                                  type={`tool-${tool.name}`}
                                  state={tool.state || "output-available"}
                                />
                                <ToolContent>
                                  <ToolInput input={tool.input} />
                                  {tool.output != null && (
                                    <ToolOutput
                                      output={tool.output}
                                      errorText={undefined}
                                    />
                                  )}
                                </ToolContent>
                              </Tool>
                            ))}
                          </div>
                        )}

                      {/* Message content */}
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {typeof msg.content === "string" ? (
                          <AIMessage from="assistant">
                            <MessageContent>
                              <MessageResponse>
                                {msg.content}
                              </MessageResponse>
                            </MessageContent>
                          </AIMessage>
                        ) : (
                          <Message
                            content={msg.content}
                            messageId={msg.id || `msg-${index}`}
                            role="assistant"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isStreaming && !chatHistory.some((msg) => msg.isStreaming) && (
          <div className="flex items-center gap-2 text-muted-foreground px-4">
            <Loader size={14} />
            <span className="text-sm">Streaming response...</span>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
