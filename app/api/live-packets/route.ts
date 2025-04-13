import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToMongoose } from "@/lib/mongodb";
import LivePacket from "@/models/live-packet";

// GET all live packets for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse filter parameters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const serverHost = searchParams.get("serverHost");
    const serverIp = searchParams.get("serverIp");
    const method = searchParams.get("method");

    await connectToMongoose();

    // Build query
    const query: any = { userId: session.user.id };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Add server hostname filter if provided
    if (serverHost) {
      query.server_hostname = { $regex: serverHost, $options: "i" };
    }

    // Add server IP filter if provided
    if (serverIp) {
      query.server_ip = { $regex: serverIp, $options: "i" };
    }

    // Add method filter if provided
    if (method) {
      query.method = method;
    }

    const packets = await LivePacket.find(query)
      .sort({ timestamp: -1 })
      .limit(1000);

    return NextResponse.json(packets);
  } catch (error) {
    console.error("Error fetching live packets:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE selected packets
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { message: "Invalid request: packet IDs required" },
        { status: 400 }
      );
    }

    await connectToMongoose();

    // Delete the packets that belong to the current user
    const result = await LivePacket.deleteMany({
      _id: { $in: ids },
      userId: session.user.id,
    });

    return NextResponse.json({
      message: `${result.deletedCount} packets deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting packets:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
