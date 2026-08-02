/**
 * Extracts the first valid completed JSON object {...} found within a text string.
 * This helper is essential for parsing AI outputs that may contain thinking processes,
 * conversational prefix/suffix text, or markdown code fences.
 * 
 * @param {string} text - The input text containing a JSON object.
 * @returns {string} The first complete JSON object substring.
 * @throws {Error} If no opening brace is found or braces do not close correctly.
 */
export function extractFirstJsonObject(text) {
  const start = text.indexOf("{");
  if (start === -1) {
    throw new Error("No JSON object found in AI response: " + text.slice(0, 200));
  }
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}") depth--;
    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }
  throw new Error("No matching closing brace found in AI response: " + text.slice(0, 200));
}
