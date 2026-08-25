import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 重要: getUser() で最新のセッションを取得・更新する
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const url = request.nextUrl.clone();

    // 未ログインユーザーが /login 以外にアクセスした場合は /login にリダイレクト
    if (!user && !url.pathname.startsWith("/login")) {
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // ログイン済みユーザーが /login にアクセスした場合は / (トップ) にリダイレクト
    if (user && url.pathname.startsWith("/login")) {
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};