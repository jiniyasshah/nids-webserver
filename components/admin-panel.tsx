"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  AlertCircle,
  Key,
  Copy,
  Download,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminPacket {
  _id: string;
  ip: string;
  domain: string;
  port?: number;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ApiKey {
  _id: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
}

export function AdminPanel() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [packets, setPackets] = useState<AdminPacket[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateKeyDialogOpen, setIsCreateKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState<{
    id: string;
    key: string;
    name: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("packets");

  const fetchAdminPackets = async () => {
    if (!session?.user?.isAdmin) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/packets");

      if (!response.ok) {
        throw new Error("Failed to fetch admin data");
      }

      const data = await response.json();
      setPackets(data);
    } catch (err) {
      console.error("Error fetching admin packets:", err);
      setError("Failed to load admin data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApiKeys = async () => {
    if (!session?.user?.isAdmin) return;

    setIsLoadingKeys(true);

    try {
      const response = await fetch("/api/admin/api-keys");

      if (!response.ok) {
        throw new Error("Failed to fetch API keys");
      }

      const data = await response.json();
      setApiKeys(data);
    } catch (err) {
      console.error("Error fetching API keys:", err);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "API key name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (!response.ok) {
        throw new Error("Failed to create API key");
      }

      const data = await response.json();
      setNewKey({
        id: data.id,
        key: data.key,
        name: data.name,
      });

      // Refresh the API keys list
      fetchApiKeys();
    } catch (err) {
      console.error("Error creating API key:", err);
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/api-keys?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete API key");
      }

      toast({
        title: "Success",
        description: "API key deleted successfully",
      });

      // Refresh the API keys list
      fetchApiKeys();
    } catch (err) {
      console.error("Error deleting API key:", err);
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  const copyApiKey = (key: string) => {
    // Check if clipboard API is available
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      navigator.clipboard
        .writeText(key)
        .then(() => {
          toast({
            title: "Copied",
            description: "API key copied to clipboard",
          });
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          // Fallback method
          copyToClipboardFallback(key);
        });
    } else {
      // Use fallback method if Clipboard API is not available
      copyToClipboardFallback(key);
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
          description: "API key copied to clipboard",
        });
      } else {
        toast({
          title: "Copy failed",
          description: "Please select and copy the API key manually",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
      toast({
        title: "Copy failed",
        description: "Please select and copy the API key manually",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchAdminPackets();
      fetchApiKeys();
    }
  }, [session]);

  if (!session?.user?.isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have admin privileges to view this page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveTab("api-keys")}
            variant="outline"
            size="sm"
          >
            <Key className="h-4 w-4 mr-2" />
            Manage API Keys
          </Button>
          <Button asChild variant="outline" size="sm">
            <a
              href="/api/admin/packets/json"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="h-4 w-4 mr-2" />
              Download JSON
            </a>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="packets">All Packets</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="packets">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="flex flex-col items-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4">Loading admin data...</p>
              </div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="bg-muted p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">All System Packets</h3>
                <Button onClick={fetchAdminPackets} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted-foreground/10">
                      <th className="px-4 py-2 text-left">IP</th>
                      <th className="px-4 py-2 text-left">Domain</th>
                      <th className="px-4 py-2 text-left">Port</th>
                      <th className="px-4 py-2 text-left">User</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packets.length > 0 ? (
                      packets.map((packet) => (
                        <tr
                          key={packet._id}
                          className="border-b border-muted-foreground/20"
                        >
                          <td className="px-4 py-2">{packet.ip}</td>
                          <td className="px-4 py-2">{packet.domain}</td>
                          <td className="px-4 py-2">
                            {packet.port || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2">{packet.user.name}</td>
                          <td className="px-4 py-2">{packet.user.email}</td>
                          <td className="px-4 py-2">
                            {new Date(packet.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-2 text-center">
                          No packets found in the system.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="api-keys">
          <div className="bg-muted p-4 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">API Keys</h3>
              <div className="flex gap-2">
                <Button onClick={fetchApiKeys} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={() => setIsCreateKeyDialogOpen(true)}
                  size="sm"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Create New API Key
                </Button>
              </div>
            </div>

            {isLoadingKeys ? (
              <div className="flex justify-center p-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {apiKeys.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted-foreground/10">
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">Created</th>
                          <th className="px-4 py-2 text-left">Last Used</th>
                          <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiKeys.map((key) => (
                          <tr
                            key={key._id}
                            className="border-b border-muted-foreground/20"
                          >
                            <td className="px-4 py-2">{key.name}</td>
                            <td className="px-4 py-2">
                              {new Date(key.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-2">
                              {key.lastUsed
                                ? new Date(key.lastUsed).toLocaleString()
                                : "Never"}
                            </td>
                            <td className="px-4 py-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteApiKey(key._id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No API keys found.
                    </p>
                    <Button onClick={() => setIsCreateKeyDialogOpen(true)}>
                      Create Your First API Key
                    </Button>
                  </div>
                )}
              </>
            )}

            <div className="mt-6 p-4 bg-card rounded-md border">
              <h4 className="font-medium mb-2">Using API Keys with Python</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Use your API key to authenticate requests from your Python
                application:
              </p>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                {`import requests

# Replace with your actual API key
API_KEY = "your_api_key_here"

response = requests.get(
    "https://your-domain.com/api/admin/packets/json",
    headers={"x-api-key": API_KEY}
)

if response.status_code == 200:
    packets = response.json()
    print(f"Retrieved {len(packets)} packets")
else:
    print(f"Error: {response.status_code} - {response.text}")
`}
              </pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create API Key Dialog */}
      <Dialog
        open={isCreateKeyDialogOpen}
        onOpenChange={setIsCreateKeyDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newKey ? "API Key Created" : "Create New API Key"}
            </DialogTitle>
            <DialogDescription>
              {newKey
                ? "Your API key has been created. Copy it now as it won't be shown again."
                : "Enter a name for your API key to help you identify it later."}
            </DialogDescription>
          </DialogHeader>

          {newKey ? (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-1">API Key</p>
                <div className="flex items-center gap-2">
                  <code className="bg-background p-2 rounded text-xs flex-1 overflow-x-auto select-all">
                    {newKey.key}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyApiKey(newKey.key)}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This key will not be shown again. Please copy it now and store
                  it securely.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">API Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., Python Server"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {newKey ? (
              <Button
                onClick={() => {
                  setIsCreateKeyDialogOpen(false);
                  setNewKey(null);
                  setNewKeyName("");
                }}
              >
                Done
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateKeyDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createApiKey}>Create API Key</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
