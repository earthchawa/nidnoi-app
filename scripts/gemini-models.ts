// Chooses backup Gemini models to try when the main one stays overloaded.

export interface GeminiModelInfo {
  name: string; // "models/gemini-2.5-flash"
  supportedGenerationMethods?: string[];
}

// Variants that can't return a plain JSON text answer, or that change without notice.
const EXCLUDE = /preview|exp|tts|image|live|audio|embed|vision|thinking|learnlm|-\d{3}$/;

const versionOf = (id: string) => Number(/^gemini-(\d+(?:\.\d+)?)/.exec(id)?.[1] ?? 0);

/**
 * Picks stable Flash models from the account's model list, newest first,
 * full Flash before Flash-Lite, leaving out the main model.
 */
export function pickFallbackModels(models: GeminiModelInfo[], primary: string, max = 2): string[] {
  return models
    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .map(m => m.name.replace(/^models\//, ''))
    .filter(id => /^gemini-[\d.]+-flash(-lite)?$/.test(id) && !EXCLUDE.test(id) && id !== primary)
    .sort((a, b) => versionOf(b) - versionOf(a) || Number(a.includes('-lite')) - Number(b.includes('-lite')))
    .slice(0, max);
}

/** Comma-separated list from an env var, e.g. "gemini-2.5-flash, gemini-2.5-flash-lite". */
export const parseModelList = (value: string | undefined) =>
  (value ?? '').split(',').map(s => s.trim()).filter(Boolean);
