"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export interface Packet {
  _id: string;
  ip: string;
  domain: string;
  port?: number; // Added port field as optional
  createdAt: string;
}

interface AllPacket {
  _id: string;
  ip: string;
  domain: string;
  port?: number; // Added port field as optional
  userId: string;
}

interface PacketContextType {
  packets: Packet[];
  allPackets: AllPacket[];
  addPacket: (packet: Omit<Packet, "_id" | "createdAt">) => Promise<void>;
  removePacket: (id: string) => Promise<void>;
  hasPackets: boolean;
  isLoading: boolean;
  error: string | null;
  refreshPackets: () => Promise<void>;
}

const PacketContext = createContext<PacketContextType | undefined>(undefined);

export function PacketProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [packets, setPackets] = useState<Packet[]>([]);
  const [allPackets, setAllPackets] = useState<AllPacket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPackets = async () => {
    if (status !== "authenticated" || !session) {
      return;
    }

    try {
      const response = await fetch("/api/packets/all");

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setAllPackets(data);
    } catch (err) {
      console.error("Error fetching all packets:", err);
    }
  };

  const fetchPackets = async () => {
    // Don't fetch if not authenticated
    if (status !== "authenticated" || !session) {
      setPackets([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/packets");

      if (!response.ok) {
        // If unauthorized, just clear packets instead of throwing an error
        if (response.status === 401) {
          setPackets([]);
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to fetch packets");
      }

      const data = await response.json();
      setPackets(data);

      // Also fetch all packets for validation
      await fetchAllPackets();
    } catch (err) {
      console.error("Error fetching packets:", err);
      setError("Failed to load packets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch packets when session changes
  useEffect(() => {
    if (status === "authenticated") {
      fetchPackets();
    } else if (status === "unauthenticated") {
      // Clear packets when user is not authenticated
      setPackets([]);
      setAllPackets([]);
      setIsLoading(false);
    }
  }, [status]);

  const addPacket = async (packetData: Omit<Packet, "_id" | "createdAt">) => {
    // Don't proceed if not authenticated
    if (status !== "authenticated" || !session) {
      throw new Error("You must be logged in to add packets");
    }

    try {
      setError(null);

      const response = await fetch("/api/packets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(packetData),
      });

      if (!response.ok) {
        // For duplicate errors, pass the response to the component for handling
        if (response.status === 409) {
          const error = new Error("Duplicate packet") as any;
          error.status = 409;
          error.json = async () => await response.json();
          throw error;
        }
        throw new Error("Failed to add packet");
      }

      const newPacket = await response.json();
      setPackets((prev) => [newPacket, ...prev]);

      // Update all packets list
      await fetchAllPackets();
    } catch (err) {
      console.error("Error adding packet:", err);
      // Don't set general error for validation errors
      if ((err as any).status !== 409) {
        setError("Failed to add packet. Please try again.");
      }
      throw err;
    }
  };

  const removePacket = async (id: string) => {
    // Don't proceed if not authenticated
    if (status !== "authenticated" || !session) {
      throw new Error("You must be logged in to remove packets");
    }

    try {
      setError(null);

      const response = await fetch(`/api/packets/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove packet");
      }

      setPackets((prev) => prev.filter((packet) => packet._id !== id));

      // Update all packets list
      await fetchAllPackets();
    } catch (err) {
      console.error("Error removing packet:", err);
      setError("Failed to remove packet. Please try again.");
      throw err;
    }
  };

  return (
    <PacketContext.Provider
      value={{
        packets,
        allPackets,
        addPacket,
        removePacket,
        hasPackets: packets.length > 0,
        isLoading: status === "loading" || isLoading,
        error,
        refreshPackets: fetchPackets,
      }}
    >
      {children}
    </PacketContext.Provider>
  );
}

export function usePackets() {
  const context = useContext(PacketContext);
  if (context === undefined) {
    throw new Error("usePackets must be used within a PacketProvider");
  }
  return context;
}
