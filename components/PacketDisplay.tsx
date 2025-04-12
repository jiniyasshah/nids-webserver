"use client";

import { useEffect, useState } from "react";
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
  server_ip: Array<string | number>;
  server_hostname: string;
  timestamp?: string;
};

// Helper function to format server IP
const formatServerIP = (serverIP: Array<string | number>): string => {
  if (serverIP[0] === "::1") {
    return `${serverIP[0]}:${serverIP[1]}`;
  }
  return serverIP.join(".");
};

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
      <td
        className={`border px-4 py-2 w-[200px]  ${
          isExpanded ? "break-words" : "truncate"
        }`}
      >
        {packet.url}
      </td>
      <td className="border px-4 py-2">
        {packet.timestamp || new Date().toISOString()}
      </td>
      <td className="border px-4 py-2">{packet.client_ip}</td>
      <td className="border px-4 py-2">{formatServerIP(packet.server_ip)}</td>
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

  useEffect(() => {
    if (!session?.user?.id) return;

    // Clean up existing subscriptions first
    pusherClient.unsubscribe(`private-user-${session.user.id}`);

    // Subscribe to the user's private channel
    const channel = pusherClient.subscribe(`private-user-${session.user.id}`);

    // Unbind any existing event handlers
    channel.unbind("packet-event");

    channel.bind("packet-event", (data: HttpPacket) => {
      // Add timestamp if not present
      const packetWithTimestamp = {
        ...data,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setPackets((prevPackets) => {
        // Check if this packet already exists to prevent duplicates
        // This is a simple check - you might need more sophisticated comparison
        const isDuplicate = prevPackets.some(
          (p) =>
            p.url === data.url &&
            p.method === data.method &&
            p.timestamp === packetWithTimestamp.timestamp
        );

        if (isDuplicate) {
          return prevPackets; // Don't add duplicates
        }

        const newPackets = [packetWithTimestamp, ...prevPackets.slice(0, 999)];
        updateChartData(newPackets);
        return newPackets;
      });
    });

    return () => {
      channel.unbind("packet-event");
      pusherClient.unsubscribe(`private-user-${session.user.id}`);
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
                  <th className="px-4 py-2">Server IP</th>
                  <th className="px-4 py-2">Server Host</th>
                  <th className="px-4 py-2">Headers</th>
                  <th className="px-4 py-2">Body</th>
                </tr>
              </thead>
              <tbody>
                {packets.map((packet, index) => (
                  <PacketRow key={index} packet={packet} index={index} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
