import mongoose, { Schema, type Document } from "mongoose";

export interface ILivePacket extends Document {
  userId: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  client_ip: string;
  server_ip: string; // Changed from Array<string | number> to string
  server_hostname: string;
  port?: number;
  timestamp: Date;
  createdAt: Date;
}

const LivePacketSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  url: { type: String, required: true },
  method: { type: String, required: true },
  headers: { type: Object, default: {} },
  client_ip: { type: String, required: true },
  server_ip: { type: String, required: true }, // Changed from Array to String
  server_hostname: { type: String, required: true },
  port: { type: Number },
  timestamp: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Create indexes for better query performance
LivePacketSchema.index({ userId: 1, timestamp: -1 });
LivePacketSchema.index({ userId: 1, server_hostname: 1 });
LivePacketSchema.index({ userId: 1, client_ip: 1 });

// Check if the model is already defined to prevent overwriting during hot reloads
export default mongoose.models.LivePacket ||
  mongoose.model<ILivePacket>("LivePacket", LivePacketSchema);
