import { describe, it, expect } from "vitest";
import { extractFirstJsonObject } from "./jsonHelper";

describe("extractFirstJsonObject", () => {
  // 1. 正常系のテスト (Normal cases)
  it("should extract clean JSON strings directly", () => {
    const input = '{"reply": "hello", "emotion": "normal"}';
    const result = extractFirstJsonObject(input);
    expect(result).toBe('{"reply": "hello", "emotion": "normal"}');
  });

  it("should extract nested JSON structures correctly", () => {
    const input = '{"outer": {"inner": 123}}';
    const result = extractFirstJsonObject(input);
    expect(result).toBe('{"outer": {"inner": 123}}');
  });

  // 2. 異常系・Gemini thinking混入時のテスト (Thinking/Polluted cases)
  it("should extract JSON even with thinking/explain text before and after", () => {
    const input = 'Thought: The user is tired. So I will reply gently. {"reply": "Take a rest."} Hope this helps!';
    const result = extractFirstJsonObject(input);
    expect(result).toBe('{"reply": "Take a rest."}');
  });

  it("should handle markdown code block formatting", () => {
    const input = '```json\n{"reply": "test", "schedules": []}\n```';
    const result = extractFirstJsonObject(input);
    expect(result).toBe('{"reply": "test", "schedules": []}');
  });

  // 3. エラーハンドリングのテスト (Error handling cases)
  it("should throw error if no opening brace exists", () => {
    const input = "No JSON here, just plain text.";
    expect(() => extractFirstJsonObject(input)).toThrow("No JSON object found");
  });

  it("should throw error if JSON is truncated (unclosed braces)", () => {
    const input = '{"reply": "unfinished';
    expect(() => extractFirstJsonObject(input)).toThrow("No matching closing brace");
  });
});
