import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToMongoose } from "@/lib/mongodb";
import Packet from "@/models/packet";

// DELETE a packet
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;

    await connectToMongoose();

    // Find the packet and ensure it belongs to the current user
    const packet = await Packet.findOne({ _id: id, userId: session.user.id });

    if (!packet) {
      return NextResponse.json(
        { message: "Packet not found" },
        { status: 404 }
      );
    }

    await Packet.deleteOne({ _id: id });

    return NextResponse.json({ message: "Packet deleted successfully" });
  } catch (error) {
    console.error("Error deleting packet:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
