"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);

      // Store email in localStorage before signing out (if needed)
      const email = localStorage.getItem("userEmail");

      await signOut({ redirect: true, callbackUrl: "/sign-in?signedOut=true" });
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <Button
        variant="default"
        className={className}
        onClick={() => setShowConfirmDialog(true)}
      >
        Sign Out
      </Button>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out of your account?</DialogTitle>
            <DialogDescription>
              You'll need to sign in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSigningOut}
            >
              Cancel
            </Button>
            <Button onClick={handleSignOut} disabled={isSigningOut}>
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
