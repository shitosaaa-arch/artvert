import type {
  ConversationModel,
  ConversationModelInput,
} from "@/engine/doctor/conversation/conversation-brain";

type GeminiConversationModelOptions = {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
    status?: string;
  };
};

const DEFAULT_MODEL =
  "gemini-2.5-flash-lite-preview-06-17";

const DEFAULT_TIMEOUT_MS =
  30_000;

function requiredValue(
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
  const trimmed =
    value.trim();

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

function parseJson<T>(
  value: string,
): T {
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
      "Gemini returned invalid JSON.",
    );
  }
}

function responseText(
  payload:
    GeminiGenerateContentResponse,
) {
  return (
    payload.candidates?.[0]
      ?.content?.parts
      ?.map(
        (part) =>
          part.text ?? "",
      )
      .join("")
      .trim() ?? ""
  );
}

export class GeminiConversationModel
  implements ConversationModel
{
  private readonly apiKey:
    string;

  private readonly model:
    string;

  private readonly timeoutMs:
    number;

  constructor(
    options:
      GeminiConversationModelOptions = {},
  ) {
    this.apiKey =
      requiredValue(
        "GEMINI_API_KEY",
        options.apiKey,
      );

    this.model =
      options.model?.trim() ||
      process.env
        .GEMINI_MODEL?.trim() ||
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
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            this.model,
          )}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              "x-goog-api-key":
                this.apiKey,
            },
            body:
              JSON.stringify({
                systemInstruction: {
                  parts: [
                    {
                      text:
                        input.systemPrompt,
                    },
                  ],
                },
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text:
                          input.userPrompt,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  maxOutputTokens:
                    900,
                  responseMimeType:
                    "application/json",
                },
              }),
            signal:
              controller.signal,
          },
        );

      const payload =
        (await response.json()) as
          GeminiGenerateContentResponse;

      if (!response.ok) {
        throw new Error(
          payload.error
            ?.message ||
            `Gemini request failed with status ${response.status}.`,
        );
      }

      if (
        payload.promptFeedback
          ?.blockReason
      ) {
        throw new Error(
          `Gemini blocked the request: ${payload.promptFeedback.blockReason}.`,
        );
      }

      const content =
        responseText(payload);

      if (!content) {
        const finishReason =
          payload.candidates?.[0]
            ?.finishReason;

        throw new Error(
          finishReason
            ? `Gemini returned an empty response (${finishReason}).`
            : "Gemini returned an empty response.",
        );
      }

      return parseJson<T>(
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
          "Gemini request timed out.",
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
  | GeminiConversationModel
  | undefined;

export function getGeminiConversationModel() {
  if (!sharedModel) {
    sharedModel =
      new GeminiConversationModel();
  }

  return sharedModel;
}
