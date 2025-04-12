import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./poviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Network Packet Tracker",
  description: "Track and monitor network packets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
