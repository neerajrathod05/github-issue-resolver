require("dotenv").config();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function understandAndPlan(issue, relevantFiles) {
  const codeContext = relevantFiles
    .map((f) => `### File: ${f.path}\n\`\`\`js\n${f.content}\n\`\`\``)
    .join("\n\n");

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are an expert software engineer. Always respond with valid JSON only. No markdown, no explanation outside JSON.",
      },
      {
        role: "user",
        content: `
GitHub Issue Title: ${issue.title}
Description: ${issue.body || "No description provided"}

Relevant Code:
${codeContext}

Respond ONLY in this JSON format:
{
  "rootCause": "...",
  "filesToChange": [
    {
      "path": "src/example.js",
      "fixedContent": "...full corrected file content...",
      "explanation": "...what was changed..."
    }
  ],
  "summary": "...one line PR summary..."
}`,
      },
    ],
    temperature: 0.2,
  });

  const text = response.choices[0].message.content;
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch (err) {
    console.error("❌ Failed to parse Groq response:", err);
    console.error("Raw response:", text);
    throw new Error("Groq response was not valid JSON");
  }
}

module.exports = { understandAndPlan };