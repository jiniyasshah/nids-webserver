import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToMongoose } from "@/lib/mongodb";
import LivePacket from "@/models/live-packet";

// DELETE all packets for the current user
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToMongoose();

    // Delete all packets for the current user
    const result = await LivePacket.deleteMany({ userId: session.user.id });

    return NextResponse.json({
      message: `All packets deleted successfully (${result.deletedCount} packets)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing packets:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
