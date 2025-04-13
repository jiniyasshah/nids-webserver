"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

export function ApiKeyDisplay() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserId = async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/users/me");
      if (response.ok) {
        const data = await response.json();
        setUserId(data.userId);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch user ID",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching user ID:", error);
      toast({
        title: "Error",
        description: "Failed to fetch user ID",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserId();
  }, [session]);

  const copyToClipboard = (text: string) => {
    // Check if clipboard API is available
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          toast({
            title: "Copied",
            description: "User ID copied to clipboard",
          });
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          // Fallback method
          copyToClipboardFallback(text);
        });
    } else {
      // Use fallback method if Clipboard API is not available
      copyToClipboardFallback(text);
    }
  };

  // Fallback method for copying to clipboard
  const copyToClipboardFallback = (text: string) => {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement("textarea");
      textArea.value = text;

      // Make the textarea out of viewport
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);

      // Select and copy
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        toast({
          title: "Copied",
          description: "User ID copied to clipboard",
        });
      } else {
        toast({
          title: "Copy failed",
          description: "Please select and copy the user ID manually",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
      toast({
        title: "Copy failed",
        description: "Please select and copy the user ID manually",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your User ID</CardTitle>
        <CardDescription>
          Use this ID in your Python script to send packets directly to your
          account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : userId ? (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <code className="flex-1 font-mono text-sm overflow-x-auto">
              {userId}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(userId)}
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy to clipboard</span>
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">Sign in to view your user ID</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUserId}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
