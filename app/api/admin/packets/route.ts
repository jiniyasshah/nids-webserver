import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToMongoose } from "@/lib/mongodb";
import Packet from "@/models/packet";
import User from "@/models/user";

// GET all packets with user information (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.isAdmin) {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    await connectToMongoose();

    // Get all packets
    const packets = await Packet.find().sort({ createdAt: -1 });

    // Get all user IDs from packets
    const userIds = [...new Set(packets.map((packet) => packet.userId))];

    // Get user information for those IDs
    const users = await User.find(
      { _id: { $in: userIds } },
      { _id: 1, name: 1, email: 1 }
    );

    // Create a map of user IDs to user info for quick lookup
    const userMap = users.reduce((map, user) => {
      map[user._id.toString()] = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      };
      return map;
    }, {});

    // Combine packet data with user info
    const packetsWithUserInfo = packets.map((packet) => {
      const packetObj = packet.toObject();
      const userId = packetObj.userId.toString();
      return {
        ...packetObj,
        user: userMap[userId] || {
          id: userId,
          name: "Unknown",
          email: "Unknown",
        },
      };
    });

    return NextResponse.json(packetsWithUserInfo);
  } catch (error) {
    console.error("Error fetching admin packets:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
