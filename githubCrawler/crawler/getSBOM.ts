import { Octokit } from "octokit";
import { SBOM } from "../sbom.types";

export const getSBOM = async (repositoryUrl: string): Promise<SBOM[]> => {
  const repoURL = repositoryUrl.replace("https://github.com/", "");
  const octokit = new Octokit({ auth: Bun.env["GITHUB_TOKEN"] });

  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/dependency-graph/sbom",
    {
      owner: repoURL.split("/")[0],
      repo: repoURL.split("/")[1],
    }
  );
  return response.data.sbom.packages as SBOM[];
};
