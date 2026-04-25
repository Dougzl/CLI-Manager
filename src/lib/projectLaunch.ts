import type { Project } from "./types";

export function getProjectTitle(project: Project): string {
  return project.cli_tool ? `${project.name} (${project.cli_tool})` : project.name;
}

export function getProjectStartupCommand(project: Project): string | undefined {
  return project.startup_cmd || project.cli_tool || undefined;
}

export function getProjectShell(project: Project): string | undefined {
  return project.shell && project.shell !== "powershell" ? project.shell : undefined;
}

export function parseProjectEnvVars(project: Project): Record<string, string> | undefined {
  try {
    const parsed = JSON.parse(project.env_vars || "{}");
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      Object.keys(parsed).length > 0
    ) {
      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [key, String(value)])
      );
    }
  } catch {
    // ignore invalid env json
  }
  return undefined;
}
