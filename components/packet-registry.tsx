"use client";

import { usePackets } from "@/context/packet-context";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useSession } from "next-auth/react";

export function PacketRegistry() {
  const { status } = useSession();
  const {
    packets,
    removePacket,
    hasPackets,
    isLoading,
    error,
    refreshPackets,
  } = usePackets();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRefresh = async () => {
    if (status !== "authenticated") return;

    setRefreshing(true);
    try {
      await refreshPackets();
      toast({
        title: "Refreshed",
        description: "Packet list has been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh packets.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (status !== "authenticated") return;

    setDeletingId(id);
    try {
      await removePacket(id);
      toast({
        title: "Packet removed",
        description: "The packet has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove packet.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (status !== "authenticated") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4">Loading packets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Retrying..." : "Retry"}
        </Button>
      </div>
    );
  }

  if (!hasPackets) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">No packets in registry</h3>
        <p className="text-muted-foreground">
          Your packet registry is empty. Add packets using the "New" button.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Packet Registry</h2>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {packets.length} packet(s) registered
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>IP Address</TableHead>
            <TableHead>Domain Name</TableHead>
            <TableHead>Port</TableHead>
            <TableHead>Date Added</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packets.map((packet) => (
            <TableRow key={packet._id}>
              <TableCell className="font-medium">{packet.ip}</TableCell>
              <TableCell>{packet.domain}</TableCell>
              <TableCell>
                {packet.port || (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {new Date(packet.createdAt).toLocaleString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(packet._id)}
                  disabled={deletingId === packet._id}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {deletingId === packet._id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="sr-only">Remove packet</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
