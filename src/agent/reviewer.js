require("dotenv").config();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function selfReview(originalIssue, plan) {
  const fileSummary = plan.filesToChange
    .map((f) => `### ${f.path}\n\`\`\`js\n${f.fixedContent}\n\`\`\`\nExplanation: ${f.explanation}`)
    .join("\n\n");

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a senior code reviewer. Respond with valid JSON only, no markdown.",
      },
      {
        role: "user",
        content: `
You previously generated a fix for this GitHub issue:
Title: ${originalIssue.title}
Description: ${originalIssue.body || "No description"}

Here are the fixes you proposed:
${fileSummary}

Review the fixes and respond in this JSON format:
{
  "approved": true or false,
  "issues": ["list any problems found, empty array if none"],
  "confidence": "high | medium | low",
  "reviewComment": "one paragraph review summary"
}

Approve only if the fix fully resolves the issue with no new bugs introduced.`,
      },
    ],
    temperature: 0.1,
  });

  const text = response.choices[0].message.content;
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch (err) {
    console.error("❌ Failed to parse review response:", err);
    throw new Error("Reviewer response was not valid JSON");
  }
}

module.exports = { selfReview };
