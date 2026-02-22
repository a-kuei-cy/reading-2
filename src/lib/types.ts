export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ReadingEntry {
  id: string; // 由後端生成（建議 UUID）
  timestampUtc: string; // ISO
  className: string;
  studentName: string;
  bookTitle: string;
  author: string;
  publisher: string;
  reflection: string;
  wordCount: number;
  status: ReviewStatus;
  reviewerNote?: string;
}

export interface StudentProfile {
  className: string;
  studentName: string;
}

export interface StudentStats {
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  stageKey: string;
  stageLabel: string;
  stageRange: string;
  nextStageKey?: string;
  nextStageLabel?: string;
  toNextStage?: number; // 還差幾本（以通過為準）
}

export interface LeaderboardRow {
  rank: number;
  className: string;
  studentName: string;
  approvedCount: number;
}

export interface ClassLeaderboardRow {
  rank: number;
  className: string;
  averageApprovedCount: number;
  studentCount: number;
}
