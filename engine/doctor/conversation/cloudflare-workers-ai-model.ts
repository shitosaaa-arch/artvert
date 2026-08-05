import type {
  ConversationModel,
  ConversationModelInput,
} from "@/engine/doctor/conversation/conversation-brain";

type CloudflareChatCompletion = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type CloudflareWorkersAiOptions = {
  accountId?: string;
  apiToken?: string;
  model?: string;
  timeoutMs?: number;
};

const DEFAULT_MODEL =
  "@cf/meta/llama-3.1-8b-instruct-fast";

const DEFAULT_TIMEOUT_MS = 30_000;

function requiredEnvironmentValue(
  name: string,
  explicitValue?: string,
) {
  const value =
    explicitValue?.trim() ||
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is required.`,
    );
  }

  return value;
}

function cleanJsonText(
  value: string,
) {
  const trimmed = value.trim();

  if (
    trimmed.startsWith("```")
  ) {
    return trimmed
      .replace(
        /^```(?:json)?\s*/i,
        "",
      )
      .replace(
        /\s*```$/,
        "",
      )
      .trim();
  }

  return trimmed;
}

function parseJsonResponse<T>(
  value: string,
) {
  const cleaned =
    cleanJsonText(value);

  try {
    return JSON.parse(
      cleaned,
    ) as T;
  } catch {
    const firstBrace =
      cleaned.indexOf("{");

    const lastBrace =
      cleaned.lastIndexOf("}");

    if (
      firstBrace >= 0 &&
      lastBrace >
        firstBrace
    ) {
      return JSON.parse(
        cleaned.slice(
          firstBrace,
          lastBrace + 1,
        ),
      ) as T;
    }

    throw new Error(
      "Workers AI returned invalid JSON.",
    );
  }
}

export class CloudflareWorkersAiConversationModel
  implements ConversationModel
{
  private readonly accountId: string;
  private readonly apiToken: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(
    options:
      CloudflareWorkersAiOptions = {},
  ) {
    this.accountId =
      requiredEnvironmentValue(
        "CLOUDFLARE_ACCOUNT_ID",
        options.accountId,
      );

    this.apiToken =
      requiredEnvironmentValue(
        "CLOUDFLARE_AI_API_TOKEN",
        options.apiToken,
      );

    this.model =
      options.model?.trim() ||
      process.env
        .CLOUDFLARE_AI_MODEL?.trim() ||
      DEFAULT_MODEL;

    this.timeoutMs =
      options.timeoutMs ??
      DEFAULT_TIMEOUT_MS;
  }

  async generateJson<T>(
    input:
      ConversationModelInput,
  ): Promise<T> {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        this.timeoutMs,
      );

    try {
      const response =
        await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/v1/chat/completions`,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${this.apiToken}`,
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                model:
                  this.model,
                temperature:
                  0.2,
                max_tokens:
                  700,
                messages: [
                  {
                    role:
                      "system",
                    content:
                      input.systemPrompt,
                  },
                  {
                    role:
                      "user",
                    content:
                      input.userPrompt,
                  },
                ],
                response_format: {
                  type:
                    "json_object",
                },
              }),
            signal:
              controller.signal,
          },
        );

      const payload =
        (await response.json()) as
          CloudflareChatCompletion;

      if (!response.ok) {
        throw new Error(
          payload.error
            ?.message ||
            `Workers AI request failed with status ${response.status}.`,
        );
      }

      const content =
        payload.choices?.[0]
          ?.message
          ?.content;

      if (!content) {
        throw new Error(
          "Workers AI returned an empty response.",
        );
      }

      return parseJsonResponse<T>(
        content,
      );
    } catch (error) {
      if (
        error instanceof
          DOMException &&
        error.name ===
          "AbortError"
      ) {
        throw new Error(
          "Workers AI request timed out.",
        );
      }

      throw error;
    } finally {
      clearTimeout(
        timeout,
      );
    }
  }
}

let sharedModel:
  | CloudflareWorkersAiConversationModel
  | undefined;

export function getCloudflareWorkersAiConversationModel() {
  if (!sharedModel) {
    sharedModel =
      new CloudflareWorkersAiConversationModel();
  }

  return sharedModel;
}
