"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PacketDisplay from "@/components/PacketDisplay";
import { EmptyState } from "@/components/empty-state";
import { PacketRegistry } from "@/components/packet-registry";
import { usePackets } from "@/context/packet-context";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

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
      </div>
    </Tabs>
  );
}
