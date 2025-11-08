import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const { chat: openrouter } = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});
