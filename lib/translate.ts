const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const BATCH_SIZE = 50;
const TIMEOUT_MS = 30000;

/** Check if a string looks like it might need translation (non-ASCII or non-Latin). */
export function mightNeedTranslation(text: string): boolean {
  const t = text.trim();
  if (!t || t === "Unnamed") return false;
  const nonLatin = /[^\x00-\x7F\u00C0-\u024F]/.test(t);
  return nonLatin;
}

/**
 * Translate an array of strings to English using OpenAI.
 * Requires OPENAI_API_KEY in the environment. If unset, returns texts unchanged.
 * Batches requests to stay within context limits.
 */
export async function translateToEnglish(texts: string[]): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || texts.length === 0) {
    return texts;
  }

  const results = [...texts];
  const toTranslate: { index: number; text: string }[] = [];

  texts.forEach((text, index) => {
    if (mightNeedTranslation(text)) {
      toTranslate.push({ index, text });
    }
  });

  if (toTranslate.length === 0) return results;

  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE);
    const batchTexts = batch.map((b) => b.text);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const numberedLines = batchTexts
      .map((t, j) => `${j + 1}. ${t.replace(/\n/g, " ")}`)
      .join("\n");

    const prompt = `Translate each of the following lines to English. Return only the English translations, one per line, in the same order (1, 2, 3, ...). Do not include the line numbers. If a line is already in English, return it unchanged. Use exactly ${batchTexts.length} lines in your response.

${numberedLines}`;

    try {
      const res = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.text();
        console.warn("OpenAI translate error:", res.status, err);
        batch.forEach((b) => (results[b.index] = b.text));
        continue;
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content?.trim() ?? "";
      const lines = content
        .split(/\n/)
        .map((line) => line.replace(/^\s*\d+[\.\)]\s*/, "").trim());
      batch.forEach((b, j) => {
        results[b.index] = lines[j] && lines[j].length > 0 ? lines[j] : b.text;
      });
    } catch (e) {
      clearTimeout(timeoutId);
      console.warn("OpenAI translate request failed:", e);
      batch.forEach((b) => (results[b.index] = b.text));
    }
  }

  return results;
}
