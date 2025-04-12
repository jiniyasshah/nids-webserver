import mongoose, { Schema, type Document } from "mongoose";

export interface IPacket extends Document {
  userId: string;
  ip: string;
  domain: string;
  createdAt: Date;
}

const PacketSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  ip: { type: String, required: true },
  domain: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Check if the model is already defined to prevent overwriting during hot reloads
export default mongoose.models.Packet ||
  mongoose.model<IPacket>("Packet", PacketSchema);
