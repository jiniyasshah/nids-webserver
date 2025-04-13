"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PacketDisplay from "@/components/PacketDisplay";
import { EmptyState } from "@/components/empty-state";
import { PacketRegistry } from "@/components/packet-registry";
import { ApiKeyDisplay } from "@/components/api-key-display";
import { usePackets } from "@/context/packet-context";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AppTabs() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { hasPackets } = usePackets();
  const { data: session } = useSession();

  return (
    <Tabs
      defaultValue="dashboard"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full"
    >
      <TabsList className="h-14 w-full justify-start rounded-none border-0 bg-transparent p-0">
        <TabsTrigger
          value="dashboard"
          className="h-14 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          Dashboard
        </TabsTrigger>
        <TabsTrigger
          value="registry"
          className="h-14 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          Packet Registry
        </TabsTrigger>
        <TabsTrigger
          value="api"
          className="h-14 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          API Settings
        </TabsTrigger>

        {session?.user?.isAdmin && (
          <div className="ml-auto flex items-center pr-2">
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link href="/admin">
                <ShieldAlert className="h-4 w-4" />
                Admin Panel
              </Link>
            </Button>
          </div>
        )}
      </TabsList>

      <div className="mt-6">
        <TabsContent value="dashboard" className="m-0">
          {hasPackets ? <PacketDisplay /> : <EmptyState />}
        </TabsContent>

        <TabsContent value="registry" className="m-0">
          <PacketRegistry />
        </TabsContent>

        <TabsContent value="api" className="m-0">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">API Settings</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <ApiKeyDisplay />
              <Card>
                <CardHeader>
                  <CardTitle>Python Example</CardTitle>
                  <CardDescription>
                    Use this code to send packets from your Python application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                    {`import requests
import json
import time

def send_packet_to_nextjs(packet_data, user_id):
    """
    Send packet data to the Next.js Pusher endpoint
    """
    url = "https://your-domain.com/api/pusher"
    
    # Add the user ID to the packet data
    packet_data["userId"] = user_id
    
    try:
        response = requests.post(
            url,
            json=packet_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"Successfully sent packet data")
        else:
            print(f"Error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Exception: {str(e)}")

# Replace with your user ID
USER_ID = "your_user_id_here"

packet = {
    "url": "https://example.com/api/data",
    "method": "POST",
    "headers": {
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/json"
    },
    "body": '{"key": "value"}',
    "client_ip": "192.168.1.1",
    "server_ip": ["192", "168", "1", "100"],
    "server_hostname": "api.example.com",
    "port": 8080,
    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
}

# Send the packet
send_packet_to_nextjs(packet, USER_ID)`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
