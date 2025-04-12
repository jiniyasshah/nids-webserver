import mongoose, { Schema, type Document } from "mongoose";

export interface IApiKey extends Document {
  key: string;
  userId: string;
  name: string;
  createdAt: Date;
  lastUsed?: Date;
}

const ApiKeySchema: Schema = new Schema({
  key: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastUsed: { type: Date },
});

// Check if the model is already defined to prevent overwriting during hot reloads
export default mongoose.models.ApiKey ||
  mongoose.model<IApiKey>("ApiKey", ApiKeySchema);
