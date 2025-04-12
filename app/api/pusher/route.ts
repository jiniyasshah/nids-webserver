import { NextResponse } from "next/server";
import { connectToMongoose } from "@/lib/mongodb";
import Packet from "@/models/packet";
import pusherServer from "@/lib/pusher-server";

// POST endpoint to receive packet data from Python server
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Log the received data for debugging
    console.log("Received packet data:", data);

    // Validate the incoming data
    if (!data || !data.client_ip) {
      console.log("Invalid packet data - missing client_ip");
      return NextResponse.json(
        { message: "Invalid packet data - missing client_ip" },
        { status: 400 }
      );
    }

    await connectToMongoose();

    // Find all users who have registered this IP
    const matchingPackets = await Packet.find({ ip: data.client_ip });
    console.log(
      `Found ${matchingPackets.length} matching packets for IP ${data.client_ip}`
    );

    if (matchingPackets.length === 0) {
      // No users are tracking this IP, so we don't need to broadcast it
      return NextResponse.json(
        { message: "No users tracking this IP" },
        { status: 200 }
      );
    }

    // Get unique user IDs who are tracking this IP
    const userIds = [
      ...new Set(matchingPackets.map((packet) => packet.userId)),
    ];
    console.log(`Broadcasting to ${userIds.length} users:`, userIds);

    // Broadcast to each user's private channel
    for (const userId of userIds) {
      await pusherServer.trigger(
        `private-user-${userId}`,
        "packet-event",
        data
      );
    }

    return NextResponse.json(
      {
        message: "Packet data processed successfully",
        userCount: userIds.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing packet data:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
