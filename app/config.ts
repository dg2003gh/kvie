export const PROXY_HOST = process.env.NEXT_PUBLIC_BACKEND_URL;

console.log(PROXY_HOST);

export const STORAGE_TAB_KEY = "tab";
export enum E_TABS {
  MONITORING = "monitoring",
  TOPOLOGY = "topology",
  NOTIFICATIONS = "notifications",
  INSIGHTS = "insights",
  LOGS = "logs",
  SETTINGS = "settings",
}
