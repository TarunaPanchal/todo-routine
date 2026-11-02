export type NotifSupport = "unsupported" | "needs-install" | "ok";

export const isStandalone = (): boolean =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

export const isIOS = (): boolean =>
  typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

export function notifSupport(): NotifSupport {
  if (typeof window === "undefined" || !("Notification" in window)) return isIOS() && !isStandalone() ? "needs-install" : "unsupported";
  if (isIOS() && !isStandalone()) return "needs-install";
  return "ok";
}

export async function requestNotifications(): Promise<boolean> {
  if (notifSupport() !== "ok") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}

export async function showNotification(title: string, body: string, tag: string) {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return void (await reg.showNotification(title, { body, tag, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png" }));
  } catch {
    /* fall through */
  }
  new Notification(title, { body, tag, icon: "/icons/icon-192.png" });
}
