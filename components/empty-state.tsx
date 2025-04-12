"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePacketDialog } from "@/components/new-packet-button";

export function EmptyState() {
  const { openDialog } = usePacketDialog();

  return (
    <div className="flex flex-col items-center justify-center p-8 mt-12 border-2 border-dashed rounded-lg border-muted-foreground/20">
      <div className="flex flex-col items-center text-center space-y-4 max-w-md">
        <div className="p-3 rounded-full bg-primary/10">
          <Plus className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">No packets to display</h3>
        <p className="text-muted-foreground">
          Add your first network packet to begin tracking. Click the button
          below to get started.
        </p>
        <Button onClick={openDialog} className="mt-2">
          Add Your First Packet
        </Button>
      </div>
    </div>
  );
}
