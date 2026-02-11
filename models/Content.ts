import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

export type ContentType = "text" | "image" | "video" | "voice" | "reel" | "carousel";
export type ContentStatus = "draft" | "ready" | "published" | "failed" | "archived";

const contentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Content type
    type: {
      type: String,
      enum: ["text", "image", "video", "voice", "reel", "carousel"],
      required: true,
    },
    // Content status
    status: {
      type: String,
      enum: ["draft", "ready", "published", "failed", "archived"],
      default: "draft",
    },
    // Title/name for organization
    title: {
      type: String,
      trim: true,
    },
    // Text content / caption
    text: {
      type: String,
    },
    // Media assets
    media: [{
      type: {
        type: String,
        enum: ["image", "video", "audio"],
      },
      url: { type: String, required: true },
      thumbnailUrl: { type: String },
      mimeType: { type: String },
      width: { type: Number },
      height: { type: Number },
      duration: { type: Number }, // seconds for video/audio
      size: { type: Number }, // bytes
      // AI generation metadata
      generatedWith: {
        provider: { type: String }, // 'kling', 'dalle', 'elevenlabs'
        prompt: { type: String },
        model: { type: String },
        cost: { type: Number }, // credits/cost used
      },
    }],
    // AI generation details
    aiGeneration: {
      textPrompt: { type: String },
      imagePrompt: { type: String },
      videoScenes: [{
        sceneNumber: { type: Number },
        prompt: { type: String },
        duration: { type: Number },
        taskId: { type: String },
        status: { type: String },
      }],
      voiceoverText: { type: String },
      voiceId: { type: String },
    },
    // Platform-specific versions
    versions: [{
      platform: { type: String },
      text: { type: String }, // Platform-optimized text
      mediaUrl: { type: String }, // Platform-optimized media
      hashtags: { type: [String] },
    }],
    // Tags for organization
    tags: {
      type: [String],
      default: [],
    },
    // Folder/workspace
    folder: {
      type: String,
      default: "Uncategorized",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes
contentSchema.index({ userId: 1, status: 1 });
contentSchema.index({ userId: 1, type: 1 });
contentSchema.index({ userId: 1, createdAt: -1 });
contentSchema.index({ tags: 1 });

contentSchema.plugin(toJSON);

export default mongoose.models.Content || mongoose.model("Content", contentSchema);
