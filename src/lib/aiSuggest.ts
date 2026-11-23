import type { Lead, SuggestResponse } from "./types";
import { daysSinceTouch } from "./statusTransitions";

const CHANNELS = ["email", "call", "messenger", "meeting"] as const;

/**
 * Deterministic heuristic for demos / eval / fallback without API key.
 */
export function suggestNextActionHeuristic(
  lead: Lead,
  fallbackNote?: string,
): SuggestResponse {
  const silentDays = daysSinceTouch(lead.lastTouchAt, Date.now());
  const lastNote = lead.notes.at(-1)?.text ?? "";

  const base: SuggestResponse = (() => {
    if (lead.status === "new") {
      return {
        nextAction: "first_contact",
        reason: "Лид ещё не контактировали — нужен первый касание.",
        channel: "email" as const,
        draftMessage: `Здравствуйте, ${lead.name}!\n\nУвидели ваш интерес (${lead.source}). Готовы коротко рассказать, чем можем помочь и ответить на вопросы.\n\nКогда удобно созвониться на 15 минут?`,
        provider: "heuristic" as const,
      };
    }

    if (silentDays >= 7) {
      return {
        nextAction: "follow_up",
        reason: `Нет касания ${silentDays} дн. — риск потери лида.`,
        channel: "messenger" as const,
        draftMessage: `Добрый день, ${lead.name}!\n\nНапоминаю о себе — не потеряли ли интерес? Могу прислать краткое предложение или ответить на вопросы.\n\nУдобно ответить одним сообщением?`,
        provider: "heuristic" as const,
      };
    }

    if (lead.status === "contacted" || lead.status === "qualified") {
      return {
        nextAction: "qualify_needs",
        reason: "Нужно уточнить потребность и бюджет перед предложением.",
        channel: "call" as const,
        draftMessage: `Привет, ${lead.name}! Хочу уточнить 2–3 момента по задаче, чтобы не слать лишнее. Есть 10 минут сегодня/завтра?`,
        provider: "heuristic" as const,
      };
    }

    if (lead.status === "proposal") {
      return {
        nextAction: "close_or_nudge",
        reason: "Предложение отправлено — мягкий пуш к решению.",
        channel: "email" as const,
        draftMessage: `Здравствуйте, ${lead.name}!\n\nПроверяю, дошло ли предложение и остались ли вопросы. Могу скорректировать условия под ваш срок.\n\nГотовы обсудить следующий шаг на этой неделе?`,
        provider: "heuristic" as const,
      };
    }

    return {
      nextAction: "review_notes",
      reason: lastNote
        ? "Терминальный статус — только разбор заметок."
        : "Нет явного следующего шага по статусу.",
      channel: "email" as const,
      draftMessage: `Внутренняя заметка: пересмотреть лид ${lead.name} (${lead.status}).`,
      provider: "heuristic" as const,
    };
  })();

  return fallbackNote ? { ...base, fallbackNote } : base;
}

function buildPrompt(lead: Lead): string {
  const silentDays = daysSinceTouch(lead.lastTouchAt, Date.now());
  const notes = lead.notes
    .slice(-5)
    .map((n) => `- ${n.text}`)
    .join("\n");

  return `Ты ассистент менеджера продаж. По контексту лида предложи следующий шаг.

Верни ТОЛЬКО JSON без markdown:
{
  "nextAction": "snake_case_action",
  "reason": "кратко почему",
  "channel": "email" | "call" | "messenger" | "meeting",
  "draftMessage": "готовый текст касания на русском"
}

Контекст:
- name: ${lead.name}
- contact: ${lead.contact}
- source: ${lead.source}
- status: ${lead.status}
- daysSinceLastTouch: ${silentDays}
- notes:
${notes || "(нет)"}`;
}

function parseSuggestJson(raw: string): SuggestResponse | null {
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const data = JSON.parse(cleaned) as Partial<SuggestResponse>;
    if (!data.nextAction || !data.reason || !data.draftMessage || !data.channel) {
      return null;
    }
    if (!CHANNELS.includes(data.channel as (typeof CHANNELS)[number])) {
      return null;
    }
    return {
      nextAction: String(data.nextAction),
      reason: String(data.reason),
      channel: data.channel as SuggestResponse["channel"],
      draftMessage: String(data.draftMessage),
      provider: "llm",
    };
  } catch {
    return null;
  }
}

type LlmAttempt = { ok: true; value: SuggestResponse } | { ok: false; note: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function suggestWithGemini(lead: Lead): Promise<LlmAttempt> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return { ok: false, note: "GEMINI_API_KEY не задан" };

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: buildPrompt(lead) }] }],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });

  let lastNote = "Gemini: неизвестная ошибка";
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (res.ok) {
      const payload = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastNote = "Gemini: пустой ответ";
        break;
      }
      const parsed = parseSuggestJson(text);
      if (!parsed) {
        lastNote = "Gemini: не удалось разобрать JSON";
        break;
      }
      return { ok: true, value: parsed };
    }

    const errText = await res.text().catch(() => "");
    let message = errText.slice(0, 200);
    try {
      message = (JSON.parse(errText) as { error?: { message?: string } }).error?.message ?? message;
    } catch {
      /* keep */
    }
    lastNote = `Gemini ${res.status}: ${message}`;
    console.error("Gemini error", res.status, message);

    if (res.status === 503 || res.status === 429) {
      await sleep(800 * attempt);
      continue;
    }
    break;
  }

  return { ok: false, note: lastNote };
}

async function suggestWithOpenAICompatible(lead: Lead): Promise<LlmAttempt> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { ok: false, note: "OPENAI_API_KEY не задан" };

  const base = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Ты ассистент менеджера продаж. Отвечай только валидным JSON.",
        },
        { role: "user", content: buildPrompt(lead) },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("OpenAI-compatible error", res.status, errText.slice(0, 300));
    return { ok: false, note: `OpenAI-compatible ${res.status}` };
  }

  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = body.choices?.[0]?.message?.content;
  if (!text) return { ok: false, note: "OpenAI-compatible: пустой ответ" };
  const parsed = parseSuggestJson(text);
  if (!parsed) return { ok: false, note: "OpenAI-compatible: плохой JSON" };
  return { ok: true, value: parsed };
}

/** Prefer Gemini → OpenAI-compatible → heuristic */
export async function suggestNextAction(lead: Lead): Promise<SuggestResponse> {
  const notes: string[] = [];

  try {
    const gemini = await suggestWithGemini(lead);
    if (gemini.ok) return gemini.value;
    notes.push(gemini.note);
  } catch (e) {
    notes.push(`Gemini exception: ${e instanceof Error ? e.message : "error"}`);
  }

  try {
    const openai = await suggestWithOpenAICompatible(lead);
    if (openai.ok) return openai.value;
    if (!openai.note.includes("не задан")) notes.push(openai.note);
  } catch (e) {
    notes.push(`OpenAI exception: ${e instanceof Error ? e.message : "error"}`);
  }

  return suggestNextActionHeuristic(
    lead,
    notes.length ? `Fallback: ${notes.join(" | ")}` : undefined,
  );
}
