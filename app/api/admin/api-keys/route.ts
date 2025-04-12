import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToMongoose } from "@/lib/mongodb";
import ApiKey from "@/models/api-key";
import { generateApiKey } from "@/lib/api-keys";

// GET all API keys for the current admin user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectToMongoose();

    const apiKeys = await ApiKey.find({ userId: session.user.id }).select(
      "-key"
    );

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST to create a new API key
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: "API key name is required" },
        { status: 400 }
      );
    }

    await connectToMongoose();

    const key = generateApiKey();

    const apiKey = new ApiKey({
      key,
      userId: session.user.id,
      name,
    });

    await apiKey.save();

    // Return the full key only once - after this, it won't be retrievable
    return NextResponse.json(
      {
        id: apiKey._id,
        key,
        name: apiKey.name,
        createdAt: apiKey.createdAt,
        message:
          "API key created successfully. Save this key as it won't be shown again.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE to remove an API key
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "API key ID is required" },
        { status: 400 }
      );
    }

    await connectToMongoose();

    const result = await ApiKey.deleteOne({ _id: id, userId: session.user.id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "API key not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "API key deleted successfully" });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
