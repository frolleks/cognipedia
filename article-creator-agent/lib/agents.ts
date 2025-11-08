import { Experimental_Agent as Agent, stepCountIs } from "ai";
import { openrouter } from "./llm";
import { webSearch } from "./tools";
import {
  researchAgentPrompt,
  outlineAgentPrompt,
  writingAgentPrompt,
  editorAgentPrompt,
} from "./system-prompts";

const DEFAULT_MODEL = "minimax/minimax-m2:free";

export const researchAgent = new Agent({
  system: researchAgentPrompt,
  model: openrouter(DEFAULT_MODEL),
  tools: {
    webSearch,
  },
  toolChoice: "required",
  stopWhen: stepCountIs(50),
});

export const outlineAgent = new Agent({
  system: outlineAgentPrompt,
  model: openrouter(DEFAULT_MODEL),
  stopWhen: stepCountIs(20),
});

export const writingAgent = new Agent({
  system: writingAgentPrompt,
  model: openrouter(DEFAULT_MODEL),
  stopWhen: stepCountIs(20),
});

export const editorAgent = new Agent({
  system: editorAgentPrompt,
  model: openrouter(DEFAULT_MODEL),
  tools: {
    webSearch,
  },
  toolChoice: "required",
  stopWhen: stepCountIs(50),
});
