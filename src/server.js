require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const { getRelevantFiles } = require("./github/codeReader");
const { understandAndPlan } = require("./agent/planner");
const { selfReview } = require("./agent/reviewer");
const { createFixBranch, openPullRequest } = require("./github/prCreator");
const { commentOnIssue } = require("./github/commenter");

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

    res.status(200).send("Issue received, agent working...");

    try {
      // Step 2 — Read codebase
      console.log("\n📂 Fetching relevant code files...");
      const relevantFiles = await getRelevantFiles(issue.title, issue.body);
      console.log(`✅ Found ${relevantFiles.length} relevant files:`);
      relevantFiles.forEach((f) => console.log(`   - ${f.path}`));

      // Step 2 — Plan fix with Groq
      console.log("\n🤖 Analyzing issue with Groq (LLaMA 3.3)...");
      const plan = await understandAndPlan(issue, relevantFiles);
      console.log("\n📋 Plan:");
      console.log("   Root cause:", plan.rootCause);
      console.log("   Files to fix:", plan.filesToChange.map((f) => f.path));

      // Step 3 — Self review
      console.log("\n🔍 Running self-review...");
      const review = await selfReview(issue, plan);
      console.log(`   Approved: ${review.approved}`);
      console.log(`   Confidence: ${review.confidence}`);

      if (!review.approved) {
        console.log("⚠️  Self-review rejected the fix. Skipping PR.");
        console.log("   Issues:", review.issues);
        return;
      }

      // Step 3 — Push branch
      console.log("\n🌿 Pushing fix to new branch...");
      const branchName = await createFixBranch(plan, issue.number, review);

      // Step 3 — Open PR
      console.log("\n📬 Opening Pull Request...");
      const pr = await openPullRequest(branchName, plan, issue.number, review);

      // Step 3 — Comment on issue
      console.log("\n💬 Commenting on issue...");
      await commentOnIssue(issue.number, pr, plan, review);

      console.log("\n🎉 Done! Agent completed full pipeline:");
      console.log(`   Issue  #${issue.number} → Branch: ${branchName} → PR: ${pr.html_url}`);

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