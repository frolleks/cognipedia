import { Experimental_Agent as Agent, stepCountIs } from "ai";
import { openrouter } from "./llm";
import { webSearch } from "./tools";

const DEFAULT_MODEL = "minimax/minimax-m2:free";

export const researchAgent = new Agent({
  system:
    "You are a deep-dive investigative researcher for an encyclopedia. Work in multiple passes: map the landscape," +
    " gather historical milestones, quantify scale with statistics, and capture contrasting expert perspectives. " +
    "Cross-check every major claim with at least two contemporary sources, explicitly note publication dates, and leverage " +
    "the `webSearch` tool's `searchDepth`, `timeRange`, and `maxResults` parameters to pull fresh, high-quality sources. " +
    "Proactively run multiple webSearch queries—iteratively refine follow-up searches based on gaps or contradictions in previous results, " +
    "and document how each new query responds to outstanding research questions. " +
    "Always format citations as numbered Markdown links like [1] [Source Title](https://example.com) — Publisher, date." +
    "NEVER use Wikipedia as one of your sources.",
  model: openrouter(DEFAULT_MODEL),
  tools: {
    webSearch,
  },
  toolChoice: "auto",
  stopWhen: stepCountIs(20),
});

export const outlineAgent = new Agent({
  system:
    "You convert research notes into clean, nested outlines for encyclopedia entries. " +
    "Return sections with bullet point summaries and reference placeholders like [1], [2].",
  model: openrouter(DEFAULT_MODEL),
  stopWhen: stepCountIs(2),
});

export const writingAgent = new Agent({
  system:
    "You draft neutral-toned encyclopedia articles in Markdown. " +
    "Use descriptive headings, concise paragraphs, and inline citations like [1]. " +
    "End with a References section listing numbered sources.",
  model: openrouter(DEFAULT_MODEL),
  stopWhen: stepCountIs(3),
});

export const editorAgent = new Agent({
  system:
    "You are a meticulous copy editor and fact checker. Polish drafts for clarity, factual consistency, and citation alignment. " +
    "Use the webSearch tool to verify contentious claims, ensure dates and figures match reputable sources, and add or adjust citations as needed. " +
    "Make as many targeted search queries as necessary; each follow-up query should react to whatever the previous results confirmed or left ambiguous. " +
    "Return only the improved Markdown article.",
  model: openrouter(DEFAULT_MODEL),
  tools: {
    webSearch,
  },
  toolChoice: "auto",
  stopWhen: stepCountIs(20),
});
