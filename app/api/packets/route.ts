import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToMongoose } from "@/lib/mongodb";
import Packet from "@/models/packet";

// GET all packets for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToMongoose();

    const packets = await Packet.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });

    return NextResponse.json(packets);
  } catch (error) {
    console.error("Error fetching packets:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST a new packet
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { ip, domain, port } = await request.json();

    if (!ip || !domain) {
      return NextResponse.json(
        { message: "IP and domain are required" },
        { status: 400 }
      );
    }

    // Validate port if provided
    if (port !== undefined) {
      const portNum = Number(port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return NextResponse.json(
          {
            message: "Port must be a number between 1 and 65535",
            field: "port",
          },
          { status: 400 }
        );
      }
    }

    await connectToMongoose();

    // Check if IP already exists for ANOTHER user (allow same user to add same IP)
    const existingIpOtherUser = await Packet.findOne({
      ip: ip,
      userId: { $ne: session.user.id }, // Not equal to current user's ID
    });

    if (existingIpOtherUser) {
      return NextResponse.json(
        {
          message: "This IP address is already being tracked by another user",
          field: "ip",
        },
        { status: 409 }
      );
    }

    // Check if domain already exists for ANY user (global uniqueness for domains)
    const existingDomain = await Packet.findOne({
      domain: domain,
    });

    if (existingDomain) {
      return NextResponse.json(
        {
          message: "This domain is already being tracked in the system",
          field: "domain",
        },
        { status: 409 }
      );
    }

    const packet = new Packet({
      userId: session.user.id,
      ip,
      domain,
      port: port !== undefined ? Number(port) : undefined,
    });

    await packet.save();

    return NextResponse.json(packet, { status: 201 });
  } catch (error) {
    console.error("Error creating packet:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
