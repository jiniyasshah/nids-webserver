import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Shield, Activity, Lock, Server, AlertTriangle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <header className="w-full p-4 flex justify-end">
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-10 text-center">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <Shield className="h-24 w-24 text-primary" strokeWidth={1.5} />
              <Activity
                className="h-12 w-12 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                strokeWidth={2}
              />
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Network Intrusion Detection System
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced real-time monitoring and threat detection for your
              network infrastructure
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-10 w-10 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Threat Detection</h3>
              <p className="text-muted-foreground">
                Real-time monitoring and alerting for suspicious network
                activity
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="flex justify-center mb-4">
                <Server className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Packet Analysis</h3>
              <p className="text-muted-foreground">
                Deep inspection of network packets to identify potential
                intrusions
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="flex justify-center mb-4">
                <Lock className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Access</h3>
              <p className="text-muted-foreground">
                Role-based access control with admin capabilities for your team
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-center">
            <Button asChild size="lg" className="px-8">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8">
              <Link href="/sign-up">Create Account</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Network Intrusion Detection System. All
          rights reserved.
        </p>
      </footer>
    </div>
  );
}
