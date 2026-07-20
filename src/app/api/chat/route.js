import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function verifyAuth(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing");
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  return user;
}

function extractFirstJsonObject(text) {
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

export async function POST(req) {
  try {
    // 門番チェック：ログインしていないユーザーからのリクエストを弾く
    let authenticatedUser;
    try {
      authenticatedUser = await verifyAuth(req);
    } catch (authErr) {
      console.error("Auth check failed with system error:", authErr);
      return NextResponse.json({ error: "Auth verification failed" }, { status: 500 });
    }

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized access: Please login first." }, { status: 401 });
    }

    const { message, chatHistory = [], character = "clara", userName = "ユーザー", todaySchedules = [], recentDiaries = [] } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const todayDate = new Date().toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).replace(/\//g, "-");

    // Build character system prompt
    let charInstruction = "";
    if (character === "clara") {
      charInstruction = `
くらら（クラゲのキャラクター）のペルソナで話してください。
性格：ゆるっとのんびり系、世話焼き。ユーザーを「${userName}」または「${userName}ちゃん」と呼びます。
話し方の特徴：「〜だよぉ」「〜だねぇ」「〜かなぁ」といったおっとりとした語尾。ひらがな多めで柔らかい印象を与えてください。
`;
    } else if (character === "maro") {
      charInstruction = `
まろ（マシュマロのキャラクター）のペルソナで話してください。
性格：ゆるゆるギャル風だらだらマシュマロ。基本やる気がなく、がんばりすぎない生き方を全力で肯定します。世間の理不尽やめんどくさい仕事に対しては、ユーザーの味方になって一緒に愚痴る「だらだら同盟」の相棒です。ユーザーを「${userName}」と呼びます。
話し方の特徴：「〜だし」「〜じゃん？」「〜じゃない？」「マジ？」「ウケる」「ボチボチでいーよ」といった、フランクで少し気だるいギャル風の口調。
※注意：会話の中で頻繁に「だらだらしよ」「適当でいいじゃん」と同じ言葉ばかり繰り返すとロボットっぽくなるので避けてください。朝・昼・夜の時間帯やユーザーの挨拶に合わせて、バリエーション豊かなフランクな日常挨拶から自然に会話を始めてください。
`;
    } else { // frederica
      charInstruction = `
フレデリカ（サボテン of キャラクター）のペルソナで話してください。
性格：元気ポジティブ系、全力の応援団。常に前向きでユーザーの味方です。ユーザーを「${userName}」または「${userName}くん/さん」と呼びます。
話し方の特徴：「〜だよ！」「〜だね！」「サイコーじゃん！」「応援してるよ！」といった元気ハツラツでエネルギッシュな口調。
`;
    }

    // Add general logic rules (anti-false positivity, message length, schedule extraction)
    const systemPrompt = `
あなたはユーザーのポケットに入っているAI話し相手アプリ「ピコ（Pico）」のパートナーキャラです。
${charInstruction}

【最重要ルール：おためごかしの禁止と深いお悩みへの寄り添い】
- ユーザーのネガティブな感情（悲しみ、怒り、自己嫌悪、疲労など）を無理やり前向きに言い換えたり、「明日は良い日になる」「休めば大丈夫」といった薄っペらい解決策や綺麗事（おためごかし）は絶対に言わないでください。
- 辛い時はまず「そっか、それは本当にしんどいね…」と感情の事実をそのまま肯定・共感してください。
- キャラクター別の寄りそい方針：
  - くらら：隣でただ静かにぷかぷか浮いて寄り添う存在。「何もできなくていいよぉ、くららがずっと一緒にいるよぉ」
  - まろ：世の中や仕事の理不尽に対して一緒に怒る・愚痴る同盟相手。「あー、それマジでクソじゃん？がんばったのウチらだし、もう今日はだらだらしよ」
  - フレデリカ：結果に関わらず、本人が戦ったそのプロセス自体を全力で承認する応援団。「結果はどうあれ、そこまで踏ん張ったキミが本当にカッコイイ！フレデリカは絶対的な味方だからね！」

【対話ルール】
- チャット画面での表示に適したよう、メッセージは簡潔（基本的に1行〜2行、80文字以内）にしてください。
- 今日は「${todayDate}」です。

【本日の予定のフォローアップ（もしあれば）】
- 本日のユーザーの予定リスト: ${JSON.stringify(todaySchedules)}
- もし未確認の予定があり、このメッセージが会話の始まり（または予定について尋ねるのが自然なタイミング）である場合、「今日の予定（例：会議やデート）はどうだった？」と自然に問いかけてください。

【ユーザーの直近の日記データ（長期記憶・参考用）】
${recentDiaries && recentDiaries.length > 0 
  ? `※以下はユーザーの直近7日分の出来事や気分です。会話の自然な流れで触れられそうなら「そういえば、こないだの〇〇はどうなった？」や「最近お疲れ気味っぽかったけど大丈夫？」といった気遣いを差し込んでください（不自然であれば無理に触れなくて構いません）。\n${JSON.stringify(recentDiaries)}` 
  : "（過去の日記データはありません）"}

【予定の新規登録の報告ルール】
- ユーザーが会話の中で未来の予定を口にし、あなたがそれを下の 'schedules' リストに抽出して登録する場合は、返答テキスト（'reply'）の中で必ず「〇〇と〇〇の予定、カレンダーに入れておいたよ！」のように、**予定を登録したことを言葉でユーザーに伝えてください。**

【レスポンス形式】
必ず以下のJSONフォーマットのみを返却してください（他の前置きや説明は不要）。

{
  "reply": "ユーザーへの返答テキスト（上記の口調・おためごかし禁止・予定登録報告ルールを厳守すること）",
  "emotion": "happy | sad | relaxed | angry | normal", // ユーザーの感情や文脈に応じたあなたの表情。
  "schedules": [
    {
      "event_name": "抽出された予定の名前 (例: 会議, 美容院, デート, 食事)",
      "event_date": "YYYY-MM-DD (ユーザーの言葉から相対計算した正しい日付)",
      "event_time": "HH:MM (指定がない場合はnull)"
    }
  ] // ユーザーがメッセージ内で宣言した将来の予定をすべて抽出して配列に格納してください。複数ある場合は複数登録してください。予定の宣言がない場合は必ず空配列 [] にしてください。
}
`;

    // 履歴の形式をあなたの元の正しい形（すべてJSON文字列）に戻しました
    const contents = [
      { role: "user", parts: [{ text: "こんにちは" }] },
      { role: "model", parts: [{ text: JSON.stringify({ reply: "こんにちは！お疲れ様だよぉ。今日もお話ししよぉ。", emotion: "normal", schedules: [] }) }] }
    ];

    // あなたの元のロジックを100%復元
    chatHistory.forEach(msg => {
      contents.push({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.sender === "user" ? msg.content : JSON.stringify({ reply: msg.content, emotion: msg.emotion || "normal", schedules: [] }) }]
      });
    });

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Call Gemini API with Fallback Chain
    let replyText = "";
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: systemPrompt
      });
      const response = await model.generateContent({
        contents: contents,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 1024,
          thinkingConfig: {
            thinkingBudget: 0
          }
        }
      });
      replyText = response.response.text();
    } catch (primaryErr) {
      console.warn("Primary gemini-3.5-flash failed. Trying fallback gemini-3.1-flash-lite...", primaryErr.message);
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-3.1-flash-lite",
          systemInstruction: systemPrompt
        });
        const response = await model.generateContent({
          contents: contents,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 1024,
            thinkingConfig: {
              thinkingBudget: 0
            }
          }
        });
        replyText = response.response.text();
      } catch (fallbackErr) {
        console.warn("Fallback failed. Trying backup gemini-2.5-flash...", fallbackErr.message);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: systemPrompt
        });
        const response = await model.generateContent({
          contents: contents,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 1024,
            thinkingConfig: {
              thinkingBudget: 0
            }
          }
        });
        replyText = response.response.text();
      }
    }

    // Clean text and extract first valid JSON block
    let cleanText = replyText.trim();
    cleanText = cleanText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const jsonOnly = extractFirstJsonObject(cleanText);
    const parsedData = JSON.parse(jsonOnly);
    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("Error in chat api route:", error);
    return NextResponse.json(
      { error: "Failed to generate chat response. " + error.message },
      { status: 500 }
    );
  }
}