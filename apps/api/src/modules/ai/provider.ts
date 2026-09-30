import { readSse, type AiStatus, type AiStreamEvent, type ChatTurn } from "@atlas/shared";

/**
 * OpenAI-compatible chat completions provider. Defaults to OpenRouter; any compatible
 * gateway (OpenAI, DeepSeek, self-hosted vLLM, ...) works by overriding AI_BASE_URL.
 */
type AiConfig = { apiKey: string; baseUrl: string; model: string };

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "openai/gpt-4o-mini";

export const SYSTEM_PROMPT = [
  "你是 Atlas 内置的 AI 助手，Atlas 是一款个人时间轴与生活工具应用。",
  "默认使用简体中文，回答简洁、直接、可执行；需要结构时使用 Markdown（标题、列表、代码块）。",
  "不确定的事实要说明不确定，不要编造。",
].join("\n");

export const readConfig = (env: NodeJS.ProcessEnv = process.env): AiConfig | null => {
  const apiKey = (env.AI_API_KEY || env.OPENROUTER_API_KEY || "").trim();
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (env.AI_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/+$/, ""),
    model: (env.AI_MODEL || DEFAULT_MODEL).trim(),
  };
};

export const aiStatus = (): AiStatus => {
  const config = readConfig();
  return { configured: config !== null, model: config?.model ?? null };
};

export class ProviderError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

const upstreamMessage = (status: number) =>
  status === 401 || status === 403 ? "AI 服务凭据无效，请联系管理员检查配置"
  : status === 402 ? "AI 服务额度不足"
  : status === 429 ? "AI 服务繁忙，请稍后再试"
  : status >= 500 ? "AI 服务暂时不可用，请稍后重试"
  : "AI 请求被拒绝，请调整内容后重试";

type Delta = { content?: string | null; reasoning?: string | null; reasoning_content?: string | null };
type Chunk = { choices?: { delta?: Delta }[]; error?: { message?: string } };

/** Maps one upstream SSE payload into zero or more Atlas stream events. */
export const toEvents = (payload: string): AiStreamEvent[] => {
  if (payload === "[DONE]") return [];
  let chunk: Chunk;
  try { chunk = JSON.parse(payload) as Chunk; } catch { return []; }
  if (chunk.error) return [{ type: "error", message: "AI 服务返回错误，请稍后重试" }];
  const delta = chunk.choices?.[0]?.delta;
  const reasoning = delta?.reasoning ?? delta?.reasoning_content;
  return [
    ...(reasoning ? [{ type: "reasoning", delta: reasoning } as const] : []),
    ...(delta?.content ? [{ type: "text", delta: delta.content } as const] : []),
  ];
};

export async function* streamChat(turns: ChatTurn[], signal: AbortSignal, config = readConfig()): AsyncGenerator<AiStreamEvent> {
  if (!config) throw new ProviderError("AI 服务尚未配置", 503);
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      // OpenRouter app attribution; ignored by other gateways.
      "HTTP-Referer": process.env.APP_ORIGIN || "http://localhost:5173",
      "X-Title": "Atlas",
    },
    body: JSON.stringify({
      model: config.model,
      stream: true,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...turns],
    }),
  });
  if (!response.ok || !response.body) {
    console.error("AI upstream rejected request", response.status, await response.text().catch(() => ""));
    throw new ProviderError(upstreamMessage(response.status), response.status === 429 ? 429 : 502);
  }
  for await (const { data } of readSse(response.body, signal)) {
    if (data === "[DONE]") return;
    yield* toEvents(data);
  }
}