export interface LLMTextBlock {
  type: "text";
  text: string;
}

export interface LLMToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
}

export type LLMContentBlock = LLMTextBlock | LLMToolUseBlock;

export interface LLMToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface LLMUserMessage {
  role: "user";
  content: string | LLMToolResultBlock[];
}

export interface LLMAssistantMessage {
  role: "assistant";
  content: LLMContentBlock[];
}

export type LLMMessage = LLMUserMessage | LLMAssistantMessage;

export interface LLMTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface LLMResponse {
  content: LLMContentBlock[];
  stopReason: "end_turn" | "tool_use" | "max_tokens" | string;
  inputTokens: number;
  outputTokens: number;
}

export interface LLMProvider {
  complete(
    messages: LLMMessage[],
    tools: LLMTool[],
    systemPrompt: string,
    model?: string,
  ): Promise<LLMResponse>;
}
