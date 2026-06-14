let octokitPromise;

function getOctokit() {
  if (!octokitPromise) {
    octokitPromise = import("@octokit/rest").then((mod) => {
      const Octokit = mod.Octokit || mod.default?.Octokit || mod.default;
      return new Octokit({ auth: process.env.GITHUB_TOKEN });
    });
  }
  return octokitPromise;
}

// Recursively get all JS files from the repo
async function getRepoFiles() {
  const octokit = await getOctokit();
  const { data: tree } = await octokit.git.getTree({
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
    tree_sha: "main",
    recursive: "true",
  });

  // Filter only .js files (skip node_modules)
  const jsFiles = tree.tree.filter(
    (f) =>
      f.type === "blob" &&
      f.path.endsWith(".js") &&
      !f.path.includes("node_modules")
  );

  return jsFiles;
}

// Fetch content of a specific file
async function getFileContent(filePath) {
  const { data } = await octokit.repos.getContent({
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
    path: filePath,
  });

  // Content comes base64 encoded
  return Buffer.from(data.content, "base64").toString("utf-8");
}

// Get the most relevant files based on issue keywords
async function getRelevantFiles(issueTitle, issueBody) {
  const files = await getRepoFiles();
  const issueText = `${issueTitle} ${issueBody}`.toLowerCase();

  // Score each file by how many issue keywords appear in its path
  const keywords = issueText
    .replace(/[^a-z0-9\s]/g, "")
    .split(" ")
    .filter((w) => w.length > 3); // ignore short words

  const scored = files.map((f) => {
    const score = keywords.filter((k) =>
      f.path.toLowerCase().includes(k)
    ).length;
    return { ...f, score };
  });

  // Sort by score, take top 5 files
  const topFiles = scored.sort((a, b) => b.score - a.score).slice(0, 5);

  // Fetch their contents
  const filesWithContent = await Promise.all(
    topFiles.map(async (f) => ({
      path: f.path,
      content: await getFileContent(f.path),
    }))
  );

  return filesWithContent;
}

module.exports = { getRelevantFiles };