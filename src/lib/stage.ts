import { APP } from "@/lib/config";

export function countWordsZh(text: string) {
  // 簡易估算：以去空白後字元數作為「字數」
  return (text || "").replace(/\s+/g, "").length;
}

export function getStageByApprovedCount(approvedCount: number) {
  const stages = APP.stages;
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    if (approvedCount >= s.min && approvedCount <= s.maxInclusive) {
      const next = stages[i + 1];
      const toNext = next ? Math.max(0, next.min - approvedCount) : 0;
      return {
        stageKey: s.key,
        stageLabel: s.label,
        stageRange: s.range,
        nextStageKey: next?.key,
        nextStageLabel: next?.label,
        toNextStage: next ? toNext : undefined,
      };
    }
  }
  // fallback
  const last = stages[stages.length - 1];
  return {
    stageKey: last.key,
    stageLabel: last.label,
    stageRange: last.range,
  };
}

export function stageProgressPercent(approvedCount: number) {
  const s = getStageByApprovedCount(approvedCount);
  const stage = APP.stages.find((x) => x.key === s.stageKey)!;
  const next = APP.stages.findIndex((x) => x.key === s.stageKey) + 1;
  const nextStage = APP.stages[next];
  if (!nextStage) return 100;
  const span = nextStage.min - stage.min;
  if (span <= 0) return 100;
  return Math.min(100, Math.max(0, ((approvedCount - stage.min) / span) * 100));
}
