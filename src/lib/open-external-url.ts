export function openExternalUrl(url: string) {
  if (typeof window === "undefined") {
    return;
  }

  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");

  if (!openedWindow) {
    window.location.assign(url);
  }
}
