"use client";

import type React from "react";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { PacketProvider } from "@/context/packet-context";
import { PacketDialogProvider } from "@/components/new-packet-button";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <PacketProvider>
          <PacketDialogProvider>{children}</PacketDialogProvider>
        </PacketProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
