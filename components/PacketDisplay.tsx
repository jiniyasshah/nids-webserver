"use client";

import { useEffect, useState, useRef } from "react";
import pusherClient from "@/lib/pusher";
import { useSession } from "next-auth/react";
import { usePackets } from "@/context/packet-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type HttpPacket = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  client_ip: string;
  server_ip: string;
  server_hostname: string;
  port?: number;
  userId: string;
  timestamp?: string;
  _packetId?: string; // Added to track unique packets
};

// Helper function to format server IP

// New component for packet row with expandable headers
const PacketRow = ({
  packet,
  index,
}: {
  packet: HttpPacket;
  index: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format headers for display
  const headersString = Object.entries(packet.headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  return (
    <tr
      key={index}
      className={`${
        index % 2 === 0 ? "bg-muted/50" : ""
      } cursor-pointer hover:bg-muted/70 transition-colors`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <td className="border px-4 py-2">{packet.method}</td>
      <td className="border px-4 py-2 max-w-[200px] truncate">{packet.url}</td>
      <td className="border px-4 py-2">
        {packet.timestamp || new Date().toISOString()}
      </td>
      <td className="border px-4 py-2">{packet.client_ip}</td>
      <td className="border px-4 py-2">
        {packet.port || <span className="text-muted-foreground">—</span>}
      </td>
      <td className="border px-4 py-2">{packet.server_ip}</td>
      <td className="border px-4 py-2">{packet.server_hostname}</td>
      <td className="border px-4 py-2">
        <div className="whitespace-pre-wrap max-w-[30rem] break-words">
          {isExpanded
            ? headersString
            : `${Object.keys(packet.headers).length} headers`}
        </div>
      </td>
      <td className="border px-4 py-2">
        {packet.body ? (
          <div className="whitespace-pre-wrap max-w-[15rem] break-words">
            {isExpanded
              ? packet.body
              : packet.body.length > 20
              ? packet.body.substring(0, 20) + "..."
              : packet.body}
          </div>
        ) : (
          <span className="text-muted-foreground">Empty</span>
        )}
      </td>
    </tr>
  );
};

export default function PacketDisplay() {
  const { data: session } = useSession();
  const { packets: userPackets } = usePackets();
  const [packets, setPackets] = useState<HttpPacket[]>([]);
  const [chartData, setChartData] = useState<
    { timestamp: string; count: number }[]
  >([]);
  const [requestCounts, setRequestCounts] = useState<Record<string, number>>(
    {}
  );

  // Use a ref to track if we're already subscribed to avoid duplicate subscriptions
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!session?.user?.id || subscribedRef.current) return;

    // Set the flag to true to prevent duplicate subscriptions
    subscribedRef.current = true;

    // Subscribe to the user's private channel
    const channel = pusherClient.subscribe(`private-user-${session.user.id}`);

    channel.bind("packet-event", (data: HttpPacket) => {
      // Add timestamp if not present
      const packetWithTimestamp = {
        ...data,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      // Use a functional update to ensure we're working with the latest state
      setPackets((prevPackets) => {
        // Check if this packet already exists (by _packetId if available)
        if (
          data._packetId &&
          prevPackets.some((p) => p._packetId === data._packetId)
        ) {
          return prevPackets; // Skip duplicate
        }

        const newPackets = [packetWithTimestamp, ...prevPackets.slice(0, 999)];
        updateChartData(newPackets);
        return newPackets;
      });
    });

    return () => {
      pusherClient.unsubscribe(`private-user-${session.user.id}`);
      subscribedRef.current = false;
    };
  }, [session]);

  const updateChartData = (packets: HttpPacket[]) => {
    // Group requests by minute for the chart
    const counts: Record<string, number> = {};

    packets.forEach((packet) => {
      const timestamp = packet.timestamp || new Date().toISOString();
      const minute = timestamp.substring(0, 16); // Format: YYYY-MM-DDTHH:MM

      if (!counts[minute]) {
        counts[minute] = 0;
      }
      counts[minute]++;
    });

    setRequestCounts(counts);

    // Convert to chart data format
    const newChartData = Object.entries(counts)
      .map(([timestamp, count]) => ({ timestamp, count }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .slice(-20); // Last 20 time periods

    setChartData(newChartData);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>HTTP Requests Over Time</CardTitle>
          <CardDescription>
            Request count by minute (last 20 time periods)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: {
                label: "Request Count",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => value.split("T")[1]} // Show only time part
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-count)"
                  name="Request Count"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>HTTP Requests</CardTitle>
          <CardDescription>
            Real-time HTTP request data (click row to expand details)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">Method</th>
                  <th className="px-4 py-2">URL</th>
                  <th className="px-4 py-2">Timestamp</th>
                  <th className="px-4 py-2">Client IP</th>
                  <th className="px-4 py-2">Port</th>
                  <th className="px-4 py-2">Server IP</th>
                  <th className="px-4 py-2">Server Host</th>
                  <th className="px-4 py-2">Headers</th>
                  <th className="px-4 py-2">Body</th>
                </tr>
              </thead>
              <tbody>
                {packets.map((packet, index) => (
                  <PacketRow
                    key={packet._packetId || index}
                    packet={packet}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
