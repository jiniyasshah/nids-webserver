import { NextResponse } from "next/server";
import { connectToMongoose } from "@/lib/mongodb";
import User from "@/models/user";
import pusherServer from "@/lib/pusher-server";
import mongoose from "mongoose";

// POST endpoint to receive packet data from Python server
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Log the received data for debugging
    console.log("Received packet data:", data);

    // Validate the incoming data
    if (!data || !data.userId) {
      console.log("Invalid packet data - missing userId");
      return NextResponse.json(
        { message: "Invalid packet data - missing userId" },
        { status: 400 }
      );
    }

    // Validate that the userId is a valid ObjectId format before querying
    if (!mongoose.Types.ObjectId.isValid(data.userId)) {
      console.log(`Invalid user ID format: ${data.userId}`);
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    await connectToMongoose();

    // Verify that the user exists
    const user = await User.findById(data.userId);
    if (!user) {
      console.log(`User with ID ${data.userId} not found`);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log(`Broadcasting packet to user: ${data.userId}`);

    // Add a unique ID to the packet to prevent duplicates
    const packetWithId = {
      ...data,
      _packetId: new mongoose.Types.ObjectId().toString(),
      timestamp: data.timestamp || new Date().toISOString(),
    };

    // Broadcast directly to the user's private channel
    await pusherServer.trigger(
      `private-user-${data.userId}`,
      "packet-event",
      packetWithId
    );

    return NextResponse.json(
      {
        message: "Packet data processed successfully",
        userId: data.userId,
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
