import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, LLMMessage, LLMTool, LLMResponse, LLMContentBlock } from "./types";

const DEFAULT_MODEL = "claude-sonnet-5";
const DEFAULT_MAX_TOKENS = 4096;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set in environment variables");
  return new Anthropic({ apiKey });
}

function mapToSdkMessages(messages: LLMMessage[]): Anthropic.MessageParam[] {
  return messages.map((msg) => {
    if (msg.role === "user") {
      if (typeof msg.content === "string") {
        return { role: "user", content: msg.content };
      }
      // Tool results
      return {
        role: "user",
        content: msg.content.map((block) => ({
          type: "tool_result" as const,
          tool_use_id: block.tool_use_id,
          content: block.content,
          ...(block.is_error ? { is_error: true } : {}),
        })),
      };
    }
    // assistant
    return {
      role: "assistant",
      content: msg.content.map((block) => {
        if (block.type === "text") return { type: "text" as const, text: block.text };
        return {
          type: "tool_use" as const,
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        };
      }),
    };
  });
}

export class ClaudeProvider implements LLMProvider {
  async complete(
    messages: LLMMessage[],
    tools: LLMTool[],
    systemPrompt: string,
    model = DEFAULT_MODEL,
  ): Promise<LLMResponse> {
    const client = getClient();

    const sdkTools: Anthropic.Tool[] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema as Anthropic.Tool["input_schema"],
    }));

    const response = await client.messages.create({
      model,
      max_tokens: DEFAULT_MAX_TOKENS,
      system: systemPrompt,
      tools: sdkTools,
      messages: mapToSdkMessages(messages),
    });

    const content: LLMContentBlock[] = [];
    for (const block of response.content) {
      if (block.type === "text") {
        content.push({ type: "text", text: block.text });
      } else if (block.type === "tool_use") {
        content.push({ type: "tool_use", id: block.id, name: block.name, input: block.input });
      }
      // Skip thinking blocks and other block types
    }

    return {
      content,
      stopReason: response.stop_reason ?? "end_turn",
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  }
}

export function isClaudeAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
