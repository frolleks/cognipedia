import z from "zod";
import { tool } from "ai";
import { tvly } from "./tavily";

export const webSearch = tool({
  description: "Tool for searching the web",
  inputSchema: z.object({
    query: z.string().max(400).describe("The search query"),
    maxResults: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .describe("Maximum number of results to return"),
    searchDepth: z
      .enum(["basic", "advanced"])
      .optional()
      .describe("Search depth level"),
    timeRange: z
      .enum(["week"])
      .optional()
      .describe("Time range for search results"),
  }),
  execute: async ({
    query,
    maxResults = 5,
    searchDepth = "advanced",
    timeRange = "week",
  }) => {
    const { results } = await tvly.search(query, {
      max_results: maxResults,
      search_depth: searchDepth,
      time_range: timeRange,
    });
    return results.map((result) => {
      return {
        title: result.title,
        content: result.content,
        url: result.url,
        publishedDate: result.publishedDate,
        rawContent: result.rawContent ? result.rawContent : null,
        score: result.score,
      };
    });
  },
});
