// Browser notifications helper
export function notify(title: string, body: string, icon = "/favicon.svg") {
  try {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    const perm = localStorage.getItem("verde_notif_perm");
    if (perm !== "granted") return;
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon });
    }
  } catch {}
}

export async function requestNotifyPermission(): Promise<boolean> {
  try {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") {
      localStorage.setItem("verde_notif_perm", "granted");
      return true;
    }
    const r = await Notification.requestPermission();
    localStorage.setItem("verde_notif_perm", r);
    return r === "granted";
  } catch { return false; }
}
