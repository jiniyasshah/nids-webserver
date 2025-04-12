import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToMongoose } from "@/lib/mongodb";
import Packet from "@/models/packet";
import User from "@/models/user";
import ApiKey from "@/models/api-key";

// GET all packets with user information as raw JSON (admin only)
export async function GET(request: Request) {
  try {
    // Check for API key authentication first
    const apiKey = request.headers.get("x-api-key");
    let isAuthorized = false;
    let userId = null;

    if (apiKey) {
      await connectToMongoose();
      const apiKeyDoc = await ApiKey.findOne({ key: apiKey });

      if (apiKeyDoc) {
        // Update last used timestamp
        apiKeyDoc.lastUsed = new Date();
        await apiKeyDoc.save();

        // Get the user to check if they're an admin
        const user = await User.findOne({ _id: apiKeyDoc.userId });

        if (user && user.isAdmin) {
          isAuthorized = true;
          userId = user._id.toString();
        }
      }
    } else {
      // Fall back to session-based authentication
      const session = await getServerSession(authOptions);

      if (session?.user?.isAdmin) {
        isAuthorized = true;
        userId = session.user.id;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { message: "Unauthorized. Admin access required." },
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
        id: packetObj._id.toString(),
        ip: packetObj.ip,
        domain: packetObj.domain,
        createdAt: packetObj.createdAt,
        userId: userId,
        userName: userMap[userId]?.name || "Unknown",
        userEmail: userMap[userId]?.email || "Unknown",
      };
    });

    // Set content type to application/json
    return new NextResponse(JSON.stringify(packetsWithUserInfo, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="packets.json"',
      },
    });
  } catch (error) {
    console.error("Error fetching admin packets JSON:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
