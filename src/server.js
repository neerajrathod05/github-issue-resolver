require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const { getRelevantFiles } = require("./github/codeReader");
const { understandAndPlan } = require("./agent/planner");

const app = express();

app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

function verifySignature(req) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return false;
  const hash = "sha256=" + crypto
    .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash));
}

app.post("/webhook", async (req, res) => {
  if (!verifySignature(req)) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.headers["x-github-event"];
  const payload = req.body;

  if (event === "issues" && payload.action === "opened") {
    const issue = payload.issue;
    console.log(`\n🐛 New issue #${issue.number}: ${issue.title}`);

    // Respond immediately so GitHub doesn't timeout
    res.status(200).send("Issue received, agent working...");

    try {
      // Step 2a: Fetch relevant code files
      console.log("📂 Fetching relevant code files...");
      const relevantFiles = await getRelevantFiles(issue.title, issue.body);
      console.log(`✅ Found ${relevantFiles.length} relevant files:`);
      relevantFiles.forEach((f) => console.log(`   - ${f.path}`));

      // Step 2b: Send to Claude for understanding + planning
      console.log("\n🤖 Sending to Claude for analysis...");
      const plan = await understandAndPlan(issue, relevantFiles);

      console.log("\n📋 Claude's Plan:");
      console.log("Root cause:", plan.rootCause);
      console.log("Files to change:", plan.filesToChange.map((f) => f.path));
      console.log("Summary:", plan.summary);

      // Step 3 (next step): create branch + PR with the fix
      // TODO: prCreator will be called here

    } catch (err) {
      console.error("❌ Agent error:", err.message);
    }

  } else {
    res.status(200).send("Event ignored");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Webhook server running on port ${process.env.PORT || 3000}`);
});