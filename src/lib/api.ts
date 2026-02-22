import { GAS_WEB_APP_URL } from "@/lib/config";
import type {
  ClassLeaderboardRow,
  LeaderboardRow,
  ReadingEntry,
  ReviewStatus,
  StudentProfile,
  StudentStats,
} from "@/lib/types";

function assertConfigured() {
  if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.includes("__REPLACE_WITH")) {
    throw new Error("尚未設定 GAS_WEB_APP_URL：請到 src/lib/config.ts 填入你的 Web App URL");
  }
}

async function callGAS<T>(payload: Record<string, unknown>): Promise<T> {
  assertConfigured();
  const res = await fetch(GAS_WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    // GAS 對 application/json 有時會觸發 preflight；這裡用 text/plain 避免 CORS 問題
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`後端回傳非 JSON：${text.slice(0, 200)}`);
  }
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `後端錯誤 (${res.status})`);
  }
  return data.data as T;
}

export const api = {
  async submitEntry(input: {
    className: string;
    studentName: string;
    bookTitle: string;
    author: string;
    publisher: string;
    reflection: string;
  }): Promise<{ id: string; status: ReviewStatus; wordCount: number } > {
    return callGAS({ action: "submit", ...input });
  },

  async getStudentSummary(profile: StudentProfile): Promise<{ stats: StudentStats; entries: ReadingEntry[] }> {
    return callGAS({ action: "studentSummary", ...profile });
  },

  async deleteEntry(input: { id: string; profile: StudentProfile }): Promise<{ ok: true } > {
    return callGAS({ action: "delete", id: input.id, ...input.profile });
  },

  async getLeaderboards(): Promise<{ individuals: LeaderboardRow[]; classes: ClassLeaderboardRow[] }> {
    return callGAS({ action: "leaderboards" });
  },

  // ---- Admin ----
  async adminList(input: { adminKey: string; status?: ReviewStatus }): Promise<{ entries: ReadingEntry[] }> {
    return callGAS({ action: "adminList", ...input });
  },

  async adminUpdate(input: { adminKey: string; id: string; patch: Partial<Pick<ReadingEntry, "bookTitle"|"author"|"publisher"|"reflection"|"className"|"studentName">> }): Promise<{ ok: true }> {
    return callGAS({ action: "adminUpdate", ...input });
  },

  async adminSetStatus(input: { adminKey: string; id: string; status: ReviewStatus; reviewerNote?: string }): Promise<{ ok: true }> {
    return callGAS({ action: "adminSetStatus", ...input });
  },

  async adminDelete(input: { adminKey: string; id: string }): Promise<{ ok: true }> {
    return callGAS({ action: "adminDelete", ...input });
  },

  async adminExport(input: { adminKey: string; format: "csv" | "xlsx" }): Promise<{ url: string }> {
    return callGAS({ action: "adminExport", ...input });
  },

  async adminAnalytics(input: { adminKey: string }): Promise<{ gradePie: { name: string; value: number }[]; stagePie: { key: string; name: string; value: number }[]; meta: any }> {
    return callGAS({ action: "adminAnalytics", ...input });
  },
};
