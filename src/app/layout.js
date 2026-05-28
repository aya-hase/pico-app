import { Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const maruGothic = Zen_Maru_Gothic({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-maru-gothic",
  display: "swap",
});

export const metadata = {
  title: "ピコ (Pico) - AI話し相手アプリ",
  description: "一人暮らし向けAI話し相手アプリ。毎日話しかけてくれて、会話が自動で日記になる。",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={`${maruGothic.variable} h-full antialiased`}>
      <body className="h-full bg-slate-50 flex items-center justify-center p-0 md:p-6">
        <AppProvider>
          {/* Mobile Shell for Desktop view, Fullscreen on Mobile */}
          <div className="w-full max-w-md h-screen md:h-[840px] md:max-h-[840px] bg-white shadow-2xl md:rounded-3xl overflow-hidden relative flex flex-col border border-slate-100">
            {/* Soft background pattern/blobs */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-50/50 via-white to-slate-50/50 pointer-events-none z-0" />
            <div className="relative z-10 flex flex-col flex-1 h-full overflow-hidden">
              {children}
            </div>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
