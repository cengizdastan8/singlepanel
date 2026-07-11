import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SinglePanel",
  description: "All messages. One panel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700;800&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
