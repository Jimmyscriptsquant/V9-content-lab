import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const apiKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: "Default API Key",
    },
    // The actual key (hashed for storage, plain shown once on creation)
    keyHash: {
      type: String,
      required: true,
    },
    // Key prefix for identification (e.g., "v9cf_")
    keyPrefix: {
      type: String,
      required: true,
    },
    // Last 4 characters for display
    keyLast4: {
      type: String,
      required: true,
    },
    // Permissions/scopes
    scopes: {
      type: [String],
      default: [
        "content:read",
        "content:write",
        "publish:read",
        "publish:write",
        "accounts:read",
        "accounts:write",
        "analytics:read",
      ],
    },
    // Rate limiting
    rateLimit: {
      requestsPerMinute: { type: Number, default: 60 },
      requestsPerDay: { type: Number, default: 1000 },
    },
    // Usage tracking
    usage: {
      totalRequests: { type: Number, default: 0 },
      lastUsedAt: { type: Date },
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null, // null = never expires
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes
apiKeySchema.index({ userId: 1 });
apiKeySchema.index({ keyHash: 1 }, { unique: true });
apiKeySchema.index({ keyPrefix: 1, keyLast4: 1 });

apiKeySchema.plugin(toJSON);

export default mongoose.models.ApiKey || mongoose.model("ApiKey", apiKeySchema);
