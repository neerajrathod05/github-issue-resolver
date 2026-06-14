const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function understandAndPlan(issue, relevantFiles) {
  // Build code context string
  const codeContext = relevantFiles
    .map((f) => `### File: ${f.path}\n\`\`\`js\n${f.content}\n\`\`\``)
    .join("\n\n");

  const prompt = `
You are an expert software engineer. A GitHub issue has been raised. 
Analyze the issue and the relevant code files, then produce a fix plan.

## GitHub Issue
Title: ${issue.title}
Description: ${issue.body || "No description provided"}

## Relevant Code Files
${codeContext}

## Your Task
1. Identify the root cause of the issue
2. List exactly which file(s) need to be changed
3. Write the corrected code for each file
4. Explain what you changed and why

Respond in this JSON format:
{
  "rootCause": "...",
  "filesToChange": [
    {
      "path": "src/example.js",
      "fixedContent": "...full corrected file content...",
      "explanation": "...what was changed..."
    }
  ],
  "summary": "...one line summary for the PR description..."
}
`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text;

  // Strip markdown code fences if Claude wraps in ```json
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch (err) {
    console.error("Failed to parse Claude response:", err);
    console.error("Raw response:", text);
    throw new Error("Claude response was not valid JSON");
  }
}

module.exports = { understandAndPlan };