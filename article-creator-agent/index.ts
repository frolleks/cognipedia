import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  editorAgent,
  outlineAgent,
  researchAgent,
  writingAgent,
} from "./lib/agents";

const TOPIC =
  process.argv.slice(2).join(" ").trim() ||
  "Evolution of open-source artificial intelligence communities";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dumpDir = path.join(__dirname, "dump");
// const EXTENSIVE_RESEARCH_THRESHOLD = 1500;
const MIN_DRAFT_WORDS = 400;
const MIN_FINAL_WORDS = 400;

async function runStep(label: string, executor: () => Promise<string>) {
  console.log(`\n▶️  ${label}`);
  const output = await executor();
  return output.trim();
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "article"
  );
}

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function looksLikeArticle(text: string) {
  return /^#\s+\S+/m.test(text) && text.includes("## References");
}

type StepResult = {
  content?: Array<{ type: string; text?: string }>;
  finishReason?: string;
  toolCalls?: Array<{ toolName: string }>;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
};

function summarizeStepText(step: StepResult) {
  const text = step.content
    ?.filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join(" ")
    .trim();
  if (!text) return "";
  const normalized = text.replace(/\s+/g, " ");
  return normalized.length > 240
    ? `${normalized.slice(0, 237)}...`
    : normalized;
}

function logAgentSteps(label: string, steps?: StepResult[]) {
  if (!steps || steps.length === 0) {
    console.log(`   ↳ ${label}: no step metadata available`);
    return;
  }

  console.log(`   ↳ ${label}: ${steps.length} step(s)`);
  steps.forEach((step, index) => {
    const toolCalls = step.toolCalls ?? [];
    const summary = summarizeStepText(step);
    const usage = step.usage ?? {};
    console.log(
      [
        `      Step ${index + 1}`,
        `finish=${step.finishReason ?? "unknown"}`,
        `tools=${toolCalls.length}`,
        `usage(in/out)=${usage.inputTokens ?? "?"}/${
          usage.outputTokens ?? "?"
        }`,
      ].join(" | ")
    );
    if (toolCalls.length > 0) {
      toolCalls.forEach((call, idx) => {
        console.log(`         • Tool call ${idx + 1}: ${call.toolName}`);
      });
    }
    if (summary) {
      console.log(`         ↳ Text: ${summary}`);
    }
  });
}

async function orchestrateArticleCreation(topic: string) {
  const researchNotes = await runStep("Researching sources", async () => {
    const result = await researchAgent.generate({
      prompt: [
        `Topic: ${topic}`,
        "Task: gather diverse, up-to-date information for an encyclopedia entry.",
        "Instructions:",
        "1. Use tools when needed to cite authoritative sources published within the last decade.",
        "2. Surface consensus, notable debates, statistics, and chronology.",
        "3. Output Markdown with two sections:",
        "   ## Insights - bullet list of facts ending with citation markers like [1].",
        "   ## References - numbered list mapping markers to source title, publisher, date, and URL.",
      ].join("\n"),
    });
    logAgentSteps("Research", result.steps as StepResult[]);
    return result.text;
  });
  console.log(`   ↳ Research notes length: ${countWords(researchNotes)} words`);

  const outline = await runStep("Designing outline", async () => {
    const result = await outlineAgent.generate({
      prompt: [
        `Create a detailed outline for an encyclopedia article about "${topic}".`,
        "Base every section on the research notes below.",
        "Include 4-6 major sections with 2-3 subpoints each.",
        "Indicate which citation markers (e.g., [1]) support each subpoint.",
        "Research notes:",
        researchNotes,
      ].join("\n\n"),
    });
    logAgentSteps("Outline", result.steps as StepResult[]);
    return result.text;
  });
  console.log(`   ↳ Outline length: ${countWords(outline)} words`);

  const draft = await runStep("Drafting article", async () => {
    const researchWordCount = countWords(researchNotes);
    // const extensiveResearch = researchWordCount >= EXTENSIVE_RESEARCH_THRESHOLD;
    const lengthRule =
      "- Target 2,000-8,000 words to cover the breadth of the research.";

    const result = await writingAgent.generate({
      prompt: [
        `Write a comprehensive encyclopedia article about "${topic}".`,
        "Requirements:",
        "- Use Markdown headings starting with an H1 title.",
        "- Immediately after the H1 title, include a concise introductory overview paragraph before any other headings.",
        "- Maintain a neutral, informative tone with concise paragraphs.",
        "- Weave in citation markers [n] that map to the outlined references.",
        lengthRule,
        "- Finish with a '## References' section listing numbered sources as Markdown links.",
        "",
        "Outline:",
        outline,
        "",
        "Supporting research:",
        researchNotes,
      ].join("\n"),
    });
    logAgentSteps("Drafting", result.steps as StepResult[]);
    return result.text;
  });

  const draftWordCount = countWords(draft);
  if (draftWordCount < MIN_DRAFT_WORDS || !looksLikeArticle(draft)) {
    throw new Error(
      `Draft validation failed: expected a full article but only received ${draftWordCount} words.`
    );
  }
  console.log(`   ↳ Draft length: ${draftWordCount} words`);

  const polishedArticle = await runStep(
    "Editing and fact checking",
    async () => {
      const result = await editorAgent.generate({
        prompt: [
          "Polish the following encyclopedia article for clarity, cohesion, factual accuracy, and citation consistency.",
          "Use the research notes to verify contested claims, but do not introduce new facts that lack support.",
          "Ensure all citation markers have matching entries in the References section.",
          "Return only the finalized Markdown article.",
          "",
          "=== ARTICLE DRAFT START ===",
          draft,
          "=== ARTICLE DRAFT END ===",
          "",
          "=== RESEARCH NOTES FOR VERIFICATION ===",
          researchNotes,
          "=== END RESEARCH NOTES ===",
        ].join("\n"),
      });
      logAgentSteps("Editing", result.steps as StepResult[]);
      return result.text;
    }
  );

  const polishedWordCount = countWords(polishedArticle);
  let finalArticle = polishedArticle;

  if (
    polishedWordCount < MIN_FINAL_WORDS ||
    polishedWordCount < draftWordCount * 0.5 ||
    !looksLikeArticle(polishedArticle)
  ) {
    console.warn(
      "⚠️  Editor output did not resemble a full article. Using the draft instead."
    );
    finalArticle = draft;
  } else {
    console.log(`   ↳ Edited article length: ${polishedWordCount} words`);
  }

  await mkdir(dumpDir, { recursive: true });
  const fileName = `${slugify(topic)}-${Date.now()}.md`;
  const filePath = path.join(dumpDir, fileName);
  await writeFile(filePath, finalArticle, "utf-8");

  console.log(`\n✅ Article saved to ${filePath}`);
}

try {
  await orchestrateArticleCreation(TOPIC);
} catch (error) {
  console.error("❌ Failed to create article:", error);
  process.exitCode = 1;
}
