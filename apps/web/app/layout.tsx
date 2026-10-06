import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToaster } from "@/components/theme/ThemeToaster";

import "./globals.css";

export const metadata: Metadata = {
  title: "StoryWeaver",
  description: "面向作者的小说协作写作工作台",
};

const themeInitScript = `
  (function () {
    var stored = localStorage.getItem("sw-theme");
    var dark =
      stored === "dark" ||
      (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <ThemeToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
