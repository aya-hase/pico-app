// Supabaseが公式に提供している、サーバー側（バックエンド）で認証を扱うための道具を読み込んでいます
import { createServerClient } from "@supabase/ssr";
// Next.jsが提供している、ページの移動（リダイレクト）や応答を制御するための道具を読み込んでいます
import { NextResponse } from "next/server";

// ユーザーがページにアクセスしたときに、自動的に呼び出される「門番」となる関数（メイン処理）です
export async function middleware(request) {
    // まずは通常通り次の処理へ進めるための「基本的な応答のベース」を作成して準備しておきます
    let response = NextResponse.next({
        request: {
            // ユーザーから送られてきたブラウザの接続情報（ヘッダー）をそのまま引き継ぎます
            headers: request.headers,
        },
    });

    // 1. サーバー側で安全に動作する、この瞬間だけのSupabaseクライアント（通信の窓口）を作ります
    const supabase = createServerClient(
        // 環境変数から、あなたのSupabaseプロジェクト固有のURL（接続先アドレス）を読み込みます
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        // 環境変数から、フロント側に公開しても安全なSupabaseの公開キー（身分証）を読み込みます
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            // ログイン状態を記録している「クッキー（ブラウザの記憶チップ）」の管理方法を指定します
            cookies: {
                // ブラウザに保存されているすべてのクッキー情報をSupabaseが読めるように丸ごと取得します
                getAll() {
                    return request.cookies.getAll();
                },
                // ログイン状態が更新された（新しい鍵が発行された）ときに、クッキーを書き換える処理です
                setAll(cookiesToSet) {
                    // 更新が必要なクッキーのリストを一つずつループで処理していきます
                    cookiesToSet.forEach(({ name, value }) =>
                        // ユーザーから届いた元のリクエスト情報に対して、新しいクッキーの値を上書きします
                        request.cookies.set(name, value)
                    );
                    // クッキーが更新されたので、新しい情報を含んだ応答のベースを再作成します
                    response = NextResponse.next({
                        request,
                    });
                    // 最終的にブラウザへ返す応答（レスポンス）に対しても、新しいクッキーをセットします
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 2. 作成した通信窓口を使って、現在アクセスしてきた人が「本当にログインしているか」をSupabaseに確認します
    const {
        // 判定した結果、無事に認証されたユーザーのデータ（未ログインならnull）を `user` という変数に格納します
        data: { user },
    } = await supabase.auth.getUser();

    // 3. 【判定】もしユーザーがログインしていない、かつ、現在のアクセス先が「ログイン画面以外」だった場合
    if (!user && !request.nextUrl.pathname.startsWith("/login")) {
        // 危険なのでアクセスを即座にブロックし、ログイン画面（/login）へ強制的にジャンプさせます
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 4. 【判定】逆に、すでにログインしているのに、わざわざログイン画面（/login）を開こうとした場合
    if (user && request.nextUrl.pathname.startsWith("/login")) {
        // もうログインしているので画面を開く必要はなく、トップページ（/）へ強制的に戻します
        return NextResponse.redirect(new URL("/", request.url));
    }

    // 上記のチェックをすべて無事にすり抜けた場合（正しいアクセス）は、最初に用意した通常のページ応答を返します
    return response;
}

// この「門番（ミドルウェア）」をアプリ内のどこで動かすかというルール（設定）です
export const config = {
    // 効率化のため、特定の条件に当てはまるページ「以外」のすべてで門番を起動させます
    matcher: [
        /*
         * 以下の文字で始まるURLやファイルへのアクセスは、チェックを免除してスルーします：
         * - /_next/static (アプリを動かすためのシステムファイル)
         * - /_next/image (自動最適化された画像ファイル)
         * - /favicon.ico (ブラウザのタブに表示されるサイトのアイコン)
         * - /api (AI会話などの裏側のAPIルート。ここは別途対策するため免除)
         * - 各種画像ファイルそのもの (.svg, .png, .jpg などの直アクセス)
         */
        "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
