import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { messages = [] } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    // Filter user messages from the chat
    const userLines = messages
      .filter((m) => m.sender === "user")
      .map((m) => m.content);

    if (userLines.length === 0) {
      return NextResponse.json(
        { error: "No user messages found to summarize." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const systemPrompt = `
あなたはユーザーの1日の会話ログから日記の要約を作成する客観的な要約システムです。

ユーザーが今日話したメッセージの一覧を入力します。これらを分析し、以下の基準で日記のまとめを作成してください：

【日記作成ルール】
1. 箇条書き ('bullet_points') を 3〜4点 で作成してください。
2. 内容は「ユーザーが語った客観的な事実と本音」のみとし、AIからの返答内容は含めないでください。
3. 箇条書きは極めて簡潔（それぞれ25文字以内）にまとめてください。
4. 【重要】過度な励ましやポジティブへの無理な言い換え（おためごかし）は絶対に禁止します。「部長に怒られた」なら「仕事で理不尽に怒られた」とし、「明日に向けて前を向いた」などの脚色は加えないでください。本音がネガティブなら、ネガティブな事実のまま簡潔に書いてください。
5. その日の全体の感情の雰囲気 ('overall_mood') を一言（8文字以内、例: 「少し疲れ気味」「充実感」「モヤモヤ・おこ」「のんびり」「穏やか」など）でセットしてください。

必ず以下のJSONフォーマットのみを返却してください（他の説明は不要）。

{
  "bullet_points": [
    "箇条書き要約1",
    "箇条書き要約2",
    "箇安全な書き要約3"
  ],
  "overall_mood": "全体の気分"
}
`;

    const chatContent = `以下はユーザーが今日話した内容です：\n\n${userLines.map((line, index) => `${index + 1}. ${line}`).join("\n")}`;

    // Call Gemini API with Fallback Chain
    let replyText = "";
    try {
      // 1. Primary: gemini-3.5-flash
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.5-flash",
        systemInstruction: systemPrompt
      });
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: chatContent }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        }
      });
      replyText = response.response.text();
    } catch (primaryErr) {
      console.warn("Primary gemini-3.5-flash failed for diary summary. Trying fallback gemini-3.1-flash-lite...", primaryErr.message);
      try {
        // 2. Fallback: gemini-3.1-flash-lite
        const model = genAI.getGenerativeModel({ 
          model: "gemini-3.1-flash-lite",
          systemInstruction: systemPrompt
        });
        const response = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: chatContent }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          }
        });
        replyText = response.response.text();
      } catch (fallbackErr) {
        console.warn("Fallback gemini-3.1-flash-lite failed. Trying backup gemini-2.5-flash...", fallbackErr.message);
        // 3. Backup: gemini-2.5-flash
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          systemInstruction: systemPrompt
        });
        const response = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: chatContent }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          }
        });
        replyText = response.response.text();
      }
    }

    const parsedData = JSON.parse(replyText);
    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("Error in diary api route after fallbacks:", error);
    return NextResponse.json(
      { error: "Failed to generate diary summary. " + error.message },
      { status: 500 }
    );
  }
}
