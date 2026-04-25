export function toTauriShortcut(combo: string): string {
  return combo
    .split("+")
    .map((part) => {
      const token = part.trim();
      switch (token.toLowerCase()) {
        case "ctrl":
          return "CommandOrControl";
        case "meta":
          return "Super";
        default:
          return token;
      }
    })
    .join("+");
}
