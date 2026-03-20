export type ShellKey = "powershell" | "cmd" | "pwsh" | "wsl" | "bash";

function endsWithExe(raw: string, exeName: string): boolean {
  return raw.endsWith(`\\${exeName}`) || raw.endsWith(`/${exeName}`);
}

export function normalizeShellKey(value?: string | null): ShellKey | undefined {
  if (!value) return undefined;
  const raw = value.trim().toLowerCase();
  if (!raw) return undefined;

  if (
    raw === "powershell" ||
    raw === "powershell.exe" ||
    raw === "windows powershell" ||
    endsWithExe(raw, "powershell.exe")
  ) {
    return "powershell";
  }
  if (raw === "cmd" || raw === "cmd.exe" || raw === "command prompt" || endsWithExe(raw, "cmd.exe")) {
    return "cmd";
  }
  if (raw === "pwsh" || raw === "pwsh.exe" || raw === "powershell core" || endsWithExe(raw, "pwsh.exe")) {
    return "pwsh";
  }
  if (raw === "wsl" || raw === "wsl.exe" || endsWithExe(raw, "wsl.exe")) {
    return "wsl";
  }
  if (raw === "bash" || raw === "bash.exe" || endsWithExe(raw, "bash.exe")) {
    return "bash";
  }
  return undefined;
}
