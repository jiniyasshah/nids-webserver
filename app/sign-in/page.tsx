import { Suspense } from "react";
import { SignInForm } from "@/components/sign-in-form";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium underline underline-offset-4 hover:text-primary"
            >
              Sign up
            </Link>
          </p>
        </div>
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
