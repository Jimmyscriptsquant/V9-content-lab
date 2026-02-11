import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

export interface BrandColor {
  name: string;
  hex: string;
}

export interface BrandReferenceAsset {
  name: string;
  url: string;
  mimeType: string;
  kind: "logo" | "reference";
}

const brandKitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    brandName: { type: String, trim: true, default: "" },
    websiteUrl: { type: String, trim: true, default: "" },

    // Writing style / identity
    voice: { type: String, trim: true, default: "" }, // e.g. "bold, direct, witty"
    audience: { type: String, trim: true, default: "" }, // e.g. "B2B SaaS founders"
    do: { type: [String], default: [] }, // e.g. ["use short sentences"]
    dont: { type: [String], default: [] }, // e.g. ["no emojis", "no hype"]
    keywords: { type: [String], default: [] },

    // Visual identity
    colors: {
      type: [
        {
          name: { type: String, required: true },
          hex: { type: String, required: true },
        },
      ],
      default: [],
    },
    fonts: { type: [String], default: [] },

    // Uploaded assets (URLs)
    assets: {
      type: [
        {
          name: { type: String, required: true },
          url: { type: String, required: true },
          mimeType: { type: String, required: true },
          kind: { type: String, enum: ["logo", "reference"], required: true },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

brandKitSchema.index({ userId: 1 }, { unique: true });
brandKitSchema.plugin(toJSON);

export default mongoose.models.BrandKit || mongoose.model("BrandKit", brandKitSchema);

