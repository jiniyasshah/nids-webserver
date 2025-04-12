"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { NewPacketButton } from "@/components/new-packet-button";
import { AppTabs } from "@/components/tabs";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // If not authenticated, don't render anything (redirect will happen)
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background">
        <div className="container mx-auto py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Network Packet Tracker</h1>
            <div className="flex items-center gap-2">
              <NewPacketButton />
              <SignOutButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-muted/40 border-b">
        <div className="container mx-auto">
          <AppTabs />
        </div>
      </nav>

      <main className="py-6 px-4 md:px-8 bg-background text-foreground">
        <div className="container mx-auto">
          {/* Content will be rendered inside the tabs */}
        </div>
      </main>
    </div>
  );
}
