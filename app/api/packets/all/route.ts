import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToMongoose } from "@/lib/mongodb";
import Packet from "@/models/packet";

// GET all packets in the system (for validation purposes)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToMongoose();

    // Return all packets with userId for validation
    const packets = await Packet.find({}, { ip: 1, domain: 1, userId: 1 });

    return NextResponse.json(packets);
  } catch (error) {
    console.error("Error fetching all packets:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
