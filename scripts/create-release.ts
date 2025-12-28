import {
   extractForVersion,
   extractVersionFromPackageJson,
   parseAllVersions,
   readChangelog,
} from "./extract-changelog";

const GITHUB_API = "https://api.github.com";

function ownerRepo() {
   const repo = process.env.GITHUB_REPOSITORY;
   if (!repo) throw new Error("GITHUB_REPOSITORY not set");
   const [owner, repoName] = repo.split("/");
   return { owner, repo: repoName };
}

async function githubFetch(
   url: string,
   method = "GET",
   body: any = null,
   token?: string,
) {
   const headers: Record<string, string> = {
      "User-Agent": "contentagen-sdk-release-bot",
      Accept: "application/vnd.github+json",
   };
   if (token) headers["Authorization"] = `token ${token}`;
   const opts: any = { method, headers };
   if (body) {
      opts.body = JSON.stringify(body);
      headers["Content-Type"] = "application/json";
   }
   const res = await fetch(url, opts);
   const text = await res.text();
   let json: any;
   try {
      json = text ? JSON.parse(text) : null;
   } catch {
      json = text;
   }
   if (!res.ok) {
      const err: any = new Error(
         `GitHub API ${res.status} ${res.statusText}: ${JSON.stringify(json)}`,
      );
      err.status = res.status;
      err.body = json;
      throw err;
   }
   return json;
}

export async function run() {
   const inputTag = process.env.INPUT_TAG || process.env.TAG;
   const token = process.env.GITHUB_TOKEN;
   if (!token) throw new Error("GITHUB_TOKEN required");

   let tag = inputTag;
   if (!tag) {
      const ref = process.env.GITHUB_REF || "";
      if (ref.startsWith("refs/tags/")) tag = ref.replace("refs/tags/", "");
   }

   if (!tag) {
      const version = await extractVersionFromPackageJson();
      tag = `v${version}`;
   }

   const backfill =
      (process.env.BACKFILL || process.env.INPUT_BACKFILL) === "true";
   const version = tag.replace(/^v/, "");

   const changelog = await readChangelog();

   const { owner, repo } = ownerRepo();

   if (backfill) {
      // create releases for all versions in changelog if they don't exist
      const entries = parseAllVersions(changelog);
      for (const e of entries) {
         const ver = e.version;
         const tagName = `v${ver}`; // use v-prefixed version as tag and name
         const listUrl = `${GITHUB_API}/repos/${owner}/${repo}/releases/tags/${tagName}`;
         try {
            await githubFetch(listUrl, "GET", null, token);
            console.log(`Release exists: ${tagName}`);
            continue;
         } catch (err: any) {
            if (err.status !== 404) throw err;
         }

         const createUrl = `${GITHUB_API}/repos/${owner}/${repo}/releases`;
         const createBody = {
            tag_name: tagName,
            name: tagName,
            body: e.body,
            draft: false,
            prerelease: false,
         };
         const created = await githubFetch(
            createUrl,
            "POST",
            createBody,
            token,
         );
         console.log("Created release:", created.html_url || created.id);

         // Optional Discord notification per created release
         const webhook = process.env.DISCORD_WEBHOOK_URL;
         if (webhook) {
            try {
               const msg = {
                  content: `Release ${tagName} published for ${owner}/${repo}: ${created.html_url || "(no url)"}`,
               };
               await fetch(webhook, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(msg),
               });
               console.log("Sent Discord notification");
            } catch (e) {
               console.warn("Failed to send Discord notification:", e);
            }
         }
      }
      return;
   }

   const entry = extractForVersion(changelog, version);
   if (!entry)
      throw new Error(`Changelog entry not found for version ${version}`);

   const listUrl = `${GITHUB_API}/repos/${owner}/${repo}/releases/tags/${tag}`;
   try {
      const existing = await githubFetch(listUrl, "GET", null, token);
      const body = {
         tag_name: tag,
         name: tag,
         body: entry,
         draft: false,
         prerelease: false,
      };
      const updateUrl = `${GITHUB_API}/repos/${owner}/${repo}/releases/${existing.id}`;
      const updated = await githubFetch(updateUrl, "PATCH", body, token);
      console.log("Updated release:", updated.html_url || updated.id);
      return;
   } catch (err: any) {
      if (err.status !== 404) throw err;
   }

   const createUrl = `${GITHUB_API}/repos/${owner}/${repo}/releases`;
   const createBody = {
      tag_name: tag,
      name: tag,
      body: entry,
      draft: false,
      prerelease: false,
   };
   const created = await githubFetch(createUrl, "POST", createBody, token);
   console.log("Created release:", created.html_url || created.id);

   // Optional Discord notification
   const webhook = process.env.DISCORD_WEBHOOK_URL;
   if (webhook) {
      try {
         const msg = {
            content: `Release ${tag} published for ${owner}/${repo}: ${created.html_url || "(no url)"}`,
         };
         await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(msg),
         });
         console.log("Sent Discord notification");
      } catch (e) {
         console.warn("Failed to send Discord notification:", e);
      }
   }
}

if (
   import.meta.url === `file://${process.argv[1]}` ||
   process.argv[1]?.endsWith("create-release.ts")
) {
   run().catch((err) => {
      console.error(err);
      process.exit(1);
   });
}
