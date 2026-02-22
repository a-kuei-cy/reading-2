// 設計宣言：Paper-cut Neo‑Memphis 讀書蛻變主題
// 核心：高對比、紙雕層次、斜向流動、明確的四階段色彩編碼。

export const APP = {
  name: "學生閱讀護照系統",
  stages: [
    { key: "egg", label: "卵期", range: "0–10 本", min: 0, maxInclusive: 10, emoji: "🥚" },
    { key: "larva", label: "幼蟲期", range: "11–30 本", min: 11, maxInclusive: 30, emoji: "🐛" },
    { key: "pupa", label: "蛹期", range: "31–60 本", min: 31, maxInclusive: 60, emoji: "🥜" },
    { key: "butterfly", label: "成蟲期", range: "60+ 本", min: 61, maxInclusive: Number.POSITIVE_INFINITY, emoji: "🦋" },
  ] as const,
  certificateThreshold: 41,
};

// TODO: 將此改成你部署後的 Google Apps Script Web App URL
// 範例：https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxx/exec
export const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbycs2Th6rPVaY7g5I3rzie8IZ_OTyrWkxVCXUn7Jp4bMGHIl8rBgkAQ9yFI724twt0/exec";

// 管理端需要的簡易金鑰（前端不安全，只是避免誤入；真正權限仍應在 GAS 端檢查）
export const ADMIN_KEY_STORAGE = "rps_admin_key";
export const STUDENT_PROFILE_STORAGE = "rps_student_profile";
