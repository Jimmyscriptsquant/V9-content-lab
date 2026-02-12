import { ConfigProps } from "./types/config";

const config = {
  // REQUIRED
  appName: "V9 Content Lab",
  // REQUIRED: a short description of your app for SEO tags
  appDescription:
    "AI-powered content creation and publishing platform. One API to generate text, images, videos, and voiceovers — then publish everywhere. Built for creators, agencies, and AI agents.",
  // REQUIRED (no https://, no trailing slash)
  domainName: "contentlab.velocitynine-labs.com",
  
  crisp: {
    id: "", // Add Crisp ID for live chat support
    onlyShowOnRoutes: ["/"],
  },
  
  stripe: {
    plans: [
      {
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_dev_free"
            : "price_prod_free",
        name: "Free",
        description: "Get started with content creation",
        price: 0,
        priceAnchor: 0,
        features: [
          { name: "10 posts/month" },
          { name: "2 connected platforms" },
          { name: "Basic AI text generation" },
          { name: "Dashboard access only" },
        ],
      },
      {
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_dev_creator"
            : "price_prod_creator",
        name: "Creator",
        description: "For serious content creators",
        price: 29,
        priceAnchor: 49,
        features: [
          { name: "100 posts/month" },
          { name: "5 connected platforms" },
          { name: "AI image generation" },
          { name: "AI video/reel generation" },
          { name: "Full API access" },
          { name: "Scheduling" },
        ],
      },
      {
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_dev_agency"
            : "price_prod_agency",
        isFeatured: true,
        name: "Agency",
        description: "For teams and agencies",
        price: 99,
        priceAnchor: 199,
        features: [
          { name: "Unlimited posts" },
          { name: "All platforms" },
          { name: "Priority AI generation" },
          { name: "Advanced analytics" },
          { name: "Team workspaces" },
          { name: "Webhook notifications" },
          { name: "Priority support" },
        ],
      },
      {
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_dev_enterprise"
            : "price_prod_enterprise",
        name: "Enterprise",
        description: "Custom solutions for large teams",
        price: 299,
        priceAnchor: 499,
        features: [
          { name: "Everything in Agency" },
          { name: "White-label option" },
          { name: "Dedicated support" },
          { name: "Custom integrations" },
          { name: "SLA guarantee" },
          { name: "On-premise option" },
        ],
      },
    ],
  },
  
  aws: {
    bucket: "v9-content-factory",
    bucketUrl: `https://v9-content-factory.s3.amazonaws.com/`,
    cdn: "https://cdn.contentfactory.velocitynine-labs.com/",
  },
  
  resend: {
    fromNoReply: `V9 Content Factory <noreply@velocitynine-labs.com>`,
    fromAdmin: `V9 Content Factory <support@velocitynine-labs.com>`,
    supportEmail: "support@velocitynine-labs.com",
  },
  
  colors: {
    theme: "dark",
    main: "#3b82f6", // V9 blue
  },
  
  auth: {
    loginUrl: "/login",
    callbackUrl: "/dashboard",
  },

  // V9 Content Factory specific config
  contentFactory: {
    // Supported platforms for OAuth connection
    platforms: [
      { id: 'twitter', name: 'X (Twitter)', icon: '𝕏', color: '#000000' },
      { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E4405F' },
      { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2' },
      { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
      { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000' },
      { id: 'youtube', name: 'YouTube', icon: '▶️', color: '#FF0000' },
      { id: 'threads', name: 'Threads', icon: '🧵', color: '#000000' },
    ],
    
    // AI generation providers
    providers: {
      text: 'openai', // or 'anthropic'
      image: 'openai', // DALL-E 3, or 'stability', 'replicate'
      video: 'kling', // Kling AI
      voice: 'elevenlabs', // or 'openai'
    },
    
    // Rate limits per plan
    limits: {
      free: { posts: 10, platforms: 2, apiAccess: false },
      creator: { posts: 100, platforms: 5, apiAccess: true },
      agency: { posts: -1, platforms: -1, apiAccess: true }, // -1 = unlimited
      enterprise: { posts: -1, platforms: -1, apiAccess: true },
    },
  },
} as ConfigProps & { contentFactory: any };

export default config;
