"use client";

import React from "react";

import { useEffect, useState, useRef, useCallback } from "react";
import pusherClient from "@/lib/pusher";
import { useSession } from "next-auth/react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  RefreshCw,
  Filter,
  Calendar,
  X,
  ChevronDown,
  ChevronRight,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type HttpPacket = {
  _id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  client_ip: string;
  server_ip: string;
  server_hostname: string;
  match_result: string;
  port?: number;
  userId: string;
  timestamp: string;
};

// Component for displaying expanded packet details
const PacketDetails = ({ packet }: { packet: HttpPacket }) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description: `${label} copied to clipboard`,
        });
      },
      (err) => {
        toast({
          title: "Failed to copy",
          description: "Could not copy to clipboard",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div className="bg-muted/30 p-4 rounded-md mt-2 border border-border/50">
      <Tabs defaultValue="headers">
        <TabsList className="mb-4">
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="headers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Request Headers</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(
                  JSON.stringify(packet.headers, null, 2),
                  "Headers"
                )
              }
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy
            </Button>
          </div>
          <ScrollArea className="h-[200px] rounded-md border p-4 bg-background">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              {Object.entries(packet.headers).map(([key, value]) => (
                <React.Fragment key={key}>
                  <div className="font-mono text-xs text-primary">{key}:</div>
                  <div className="font-mono text-xs break-all">{value}</div>
                </React.Fragment>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="body">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-medium">Request Body</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(packet.body || "", "Body")}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy
            </Button>
          </div>
          <ScrollArea className="h-[200px] rounded-md border p-4 bg-background">
            {packet.body ? (
              <pre className="font-mono text-xs whitespace-pre-wrap break-all">
                {packet.body}
              </pre>
            ) : (
              <div className="text-muted-foreground text-sm italic">
                No body content
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="details">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Request Details</h4>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Method
                    </span>
                    <span className="font-medium">{packet.method}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">URL</span>
                    <span className="font-medium break-all">{packet.url}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Timestamp
                    </span>
                    <span className="font-medium">
                      {new Date(packet.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Network Details</h4>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Client IP
                    </span>
                    <span className="font-medium">{packet.client_ip}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Server IP
                    </span>
                    <span className="font-medium">{packet.server_ip}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Server Hostname
                    </span>
                    <span className="font-medium">
                      {packet.server_hostname}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Port</span>
                    <span className="font-medium">{packet.port || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify(packet, null, 2),
                    "Full packet data"
                  )
                }
                className="w-full"
              >
                <Copy className="h-3.5 w-3.5 mr-2" />
                Copy Full Packet Data
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function PacketDisplay() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [packets, setPackets] = useState<HttpPacket[]>([]);
  const [chartData, setChartData] = useState<
    { timestamp: string; count: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPackets, setSelectedPackets] = useState<Set<string>>(
    new Set()
  );
  const [selectAll, setSelectAll] = useState(false);
  const [expandedPacketId, setExpandedPacketId] = useState<string | null>(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [serverHost, setServerHost] = useState("");
  const [serverIp, setServerIp] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  // Unique values for filters
  const [uniqueHosts, setUniqueHosts] = useState<string[]>([]);
  const [uniqueMethods, setUniqueMethods] = useState<string[]>([]);

  // Use a ref to track if we're already subscribed to avoid duplicate subscriptions
  const subscribedRef = useRef(false);

  // Fetch packets from the server
  const fetchPackets = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);

    try {
      // Build query parameters for filters
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());
      if (serverHost && serverHost !== "all")
        params.append("serverHost", serverHost);
      if (serverIp) params.append("serverIp", serverIp);
      if (methodFilter && methodFilter !== "all")
        params.append("method", methodFilter);

      const response = await fetch(`/api/live-packets?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch packets");
      }

      const data = await response.json();

      // Reset selection when fetching new data
      setSelectedPackets(new Set());
      setSelectAll(false);
      setExpandedPacketId(null);

      // Update packets
      setPackets(data);

      // Extract unique values for filters
      const hosts = [
        ...new Set(data.map((p: HttpPacket) => p.server_hostname)),
      ];
      const methods = [...new Set(data.map((p: HttpPacket) => p.method))];

      setUniqueHosts(hosts);
      setUniqueMethods(methods);

      // Update chart data
      updateChartData(data);
    } catch (error) {
      console.error("Error fetching packets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch packets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, startDate, endDate, serverHost, serverIp, methodFilter, toast]);

  // Subscribe to Pusher channel
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
        // Check if this packet already exists (by _id)
        if (prevPackets.some((p) => p._id === data._id)) {
          return prevPackets; // Skip duplicate
        }

        // Apply current filters
        if (
          (serverHost &&
            serverHost !== "all" &&
            !data.server_hostname.includes(serverHost)) ||
          (methodFilter &&
            methodFilter !== "all" &&
            data.method !== methodFilter) ||
          (serverIp && !data.server_ip.includes(serverIp)) ||
          (startDate && new Date(data.timestamp) < startDate) ||
          (endDate && new Date(data.timestamp) > endDate)
        ) {
          return prevPackets; // Skip if doesn't match filters
        }

        const newPackets = [packetWithTimestamp, ...prevPackets];
        updateChartData(newPackets);
        return newPackets;
      });
    });

    return () => {
      pusherClient.unsubscribe(`private-user-${session.user.id}`);
      subscribedRef.current = false;
    };
  }, [session, serverHost, methodFilter, serverIp, startDate, endDate]);

  // Initial fetch
  useEffect(() => {
    if (session?.user?.id) {
      fetchPackets();
    }
  }, [session, fetchPackets]);

  const updateChartData = (packets: HttpPacket[]) => {
    // Group requests by minute for the chart
    const counts: Record<string, number> = {};

    packets.forEach((packet) => {
      const timestamp = packet.timestamp;
      const minute = timestamp.substring(0, 16); // Format: YYYY-MM-DDTHH:MM

      if (!counts[minute]) {
        counts[minute] = 0;
      }
      counts[minute]++;
    });

    // Convert to chart data format
    const newChartData = Object.entries(counts)
      .map(([timestamp, count]) => ({ timestamp, count }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .slice(-20); // Last 20 time periods

    setChartData(newChartData);
  };

  // Handle packet selection
  const toggleSelectPacket = (id: string, event: React.MouseEvent) => {
    // Stop propagation to prevent expanding when clicking checkbox
    event.stopPropagation();

    setSelectedPackets((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  };

  // Handle select all
  const toggleSelectAll = (event: React.MouseEvent) => {
    event.stopPropagation();

    if (selectAll) {
      setSelectedPackets(new Set());
    } else {
      setSelectedPackets(new Set(packets.map((p) => p._id)));
    }
    setSelectAll(!selectAll);
  };

  // Toggle expanded packet
  const toggleExpandPacket = (id: string) => {
    setExpandedPacketId(expandedPacketId === id ? null : id);
  };

  // Delete selected packets
  const deleteSelectedPackets = async () => {
    if (selectedPackets.size === 0) return;

    setIsDeleting(true);

    try {
      const response = await fetch("/api/live-packets", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: Array.from(selectedPackets),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete packets");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: result.message,
      });

      // Refresh packets
      fetchPackets();
    } catch (error) {
      console.error("Error deleting packets:", error);
      toast({
        title: "Error",
        description: "Failed to delete packets",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear all packets
  const clearAllPackets = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL packets? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/live-packets/clear", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear packets");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: result.message,
      });

      // Refresh packets
      fetchPackets();
    } catch (error) {
      console.error("Error clearing packets:", error);
      toast({
        title: "Error",
        description: "Failed to clear packets",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setServerHost("");
    setServerIp("");
    setMethodFilter("");
    fetchPackets();
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>HTTP Requests</CardTitle>
            <CardDescription>
              {packets.length} requests{" "}
              {selectedPackets.size > 0 && `(${selectedPackets.size} selected)`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-muted" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPackets}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {selectedPackets.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelectedPackets}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllPackets}
              disabled={isDeleting || packets.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <div className="px-6 pb-4">
            <div className="p-4 bg-muted rounded-md space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Filter Packets</h3>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Start Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "End Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Server Host */}
                <div className="space-y-2">
                  <Label>Server Host</Label>
                  <Select value={serverHost} onValueChange={setServerHost}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select host" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Hosts</SelectItem>
                      {uniqueHosts.map((host) => (
                        <SelectItem key={host} value={host}>
                          {host}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Method */}
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      {uniqueMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Server IP */}
                <div className="space-y-2">
                  <Label>Server IP</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Filter by IP"
                      value={serverIp}
                      onChange={(e) => setServerIp(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={fetchPackets} disabled={isLoading}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPackets(
                            new Set(packets.map((p) => p._id))
                          );
                          setSelectAll(true);
                        } else {
                          setSelectedPackets(new Set());
                          setSelectAll(false);
                        }
                      }}
                      onClick={toggleSelectAll}
                      aria-label="Select all packets"
                    />
                  </th>
                  <th className="px-4 py-2 text-left">Method</th>
                  <th className="px-4 py-2 text-left">URL</th>
                  <th className="px-4 py-2 text-left">Timestamp</th>
                  <th className="px-4 py-2 text-left">Client IP</th>
                  <th className="px-4 py-2 text-left">Port</th>
                  <th className="px-4 py-2 text-left">Server IP</th>
                  <th className="px-4 py-2 text-left">Potential Reason</th>
                </tr>
              </thead>
              <tbody>
                {packets.length > 0 ? (
                  packets.map((packet, index) => (
                    <React.Fragment key={packet._id}>
                      <tr
                        className={`${
                          index % 2 === 0 ? "bg-muted/50" : ""
                        } hover:bg-muted/70 transition-colors ${
                          selectedPackets.has(packet._id) ? "bg-primary/10" : ""
                        } cursor-pointer`}
                        onClick={() => toggleExpandPacket(packet._id)}
                      >
                        <td className="px-4 py-2">
                          <Checkbox
                            checked={selectedPackets.has(packet._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPackets(
                                  (prev) => new Set([...prev, packet._id])
                                );
                              } else {
                                setSelectedPackets((prev) => {
                                  const newSet = new Set(prev);
                                  newSet.delete(packet._id);
                                  return newSet;
                                });
                              }
                            }}
                            onClick={(e) => toggleSelectPacket(packet._id, e)}
                            aria-label={`Select packet ${index + 1}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant={
                              packet.method === "GET" ? "secondary" : "default"
                            }
                          >
                            {packet.method}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 max-w-[200px] truncate">
                          <div className="flex items-center">
                            {expandedPacketId === packet._id ? (
                              <ChevronDown className="h-4 w-4 mr-2 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0" />
                            )}
                            {packet.url}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          {new Date(packet.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">{packet.client_ip}</td>
                        <td className="px-4 py-2">
                          {packet.port || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2">{packet.server_ip}</td>
                        <td className="px-4 py-2">{packet.match_result}</td>
                      </tr>
                      {expandedPacketId === packet._id && (
                        <tr>
                          <td colSpan={8} className="p-0 border-b">
                            <PacketDetails packet={packet} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      {isLoading ? (
                        <div className="flex justify-center items-center">
                          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                          Loading packets...
                        </div>
                      ) : (
                        "No packets found. Try adjusting your filters or send some packets from your Python server."
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
