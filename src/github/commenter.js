require("dotenv").config();
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function commentOnIssue(issueNumber, pr, plan, review) {
  const body = `
## 🤖 Issue Resolver Agent — Update

I've analyzed this issue and automatically generated a fix!

### What I found
${plan.rootCause}

### What I did
${plan.filesToChange.map((f) => `- Fixed \`${f.path}\`: ${f.explanation}`).join("\n")}

### Self-Review
- **Confidence:** ${review.confidence}
- ${review.reviewComment}

### 👉 Pull Request
${pr.html_url}

Please review the PR and merge if everything looks good!
  `.trim();

  await octokit.issues.createComment({
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
    issue_number: issueNumber,
    body,
  });

  console.log(`💬 Comment posted on issue #${issueNumber}`);
}

module.exports = { commentOnIssue };