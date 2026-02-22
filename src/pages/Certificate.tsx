import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { APP, STUDENT_PROFILE_STORAGE } from "@/lib/config";
import type { StudentProfile } from "@/lib/types";

function loadProfile(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(STUDENT_PROFILE_STORAGE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function Certificate() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [approvedCount, setApprovedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [className, setClassName] = useState("");
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    const p = loadProfile();
    if (p) {
      setProfile(p);
      setClassName(p.className);
      setStudentName(p.studentName);
    }
  }, []);

  async function load() {
    const p = { className: className.trim(), studentName: studentName.trim() };
    if (!p.className || !p.studentName) return toast.error("請填入班級與姓名");

    setLoading(true);
    try {
      const res = await api.getStudentSummary(p);
      setProfile(p);
      localStorage.setItem(STUDENT_PROFILE_STORAGE, JSON.stringify(p));
      setApprovedCount(res.stats.approvedCount);
    } catch (e: any) {
      toast.error(e.message || "讀取失敗");
    } finally {
      setLoading(false);
    }
  }

  const eligible = (approvedCount ?? 0) >= APP.certificateThreshold;
  const today = useMemo(() => new Date().toLocaleDateString(), []);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10">
      <div className="flex items-end justify-between gap-4 flex-wrap no-print">
        <div>
          <h1 className="font-display text-4xl">閱讀達人證書</h1>
          <p className="text-muted-foreground mt-1">當通過本數達 {APP.certificateThreshold} 本，即可生成證書（可截圖或列印）。</p>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 p-5 md:p-6 no-print">
          <h2 className="font-display text-2xl">查詢我的證書</h2>
          <p className="text-sm text-muted-foreground mt-1">會使用你的班級與姓名去讀取「通過」數。</p>
          <Separator className="my-4" />
          <div className="space-y-3">
            <div>
              <label className="text-sm">班級</label>
              <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="例如：五年三班" />
            </div>
            <div>
              <label className="text-sm">姓名</label>
              <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="例如：王小明" />
            </div>
            <Button onClick={load} disabled={loading} className="w-full">更新</Button>

            {approvedCount != null && (
              <div className="rounded-xl border bg-background/60 p-3 text-sm">
                通過本數：<span className="font-display text-2xl">{approvedCount}</span>
                <div className="mt-2">
                  {eligible ? (
                    <Badge className="bg-[var(--rps-teal)] text-[var(--rps-navy)]">符合資格</Badge>
                  ) : (
                    <Badge variant="secondary">尚未達標（還差 {APP.certificateThreshold - approvedCount} 本）</Badge>
                  )}
                </div>
              </div>
            )}

            <Button variant="outline" onClick={() => window.print()} disabled={!eligible} className="w-full">
              列印 / 存成 PDF
            </Button>
            <p className="text-xs text-muted-foreground">提示：列印時請選「背景圖形」以保留色塊效果。</p>
          </div>
        </Card>

        <div className="lg:col-span-8">
          <Card className="print-sheet p-0 overflow-hidden shadow-sm">
            <div className="relative p-10 md:p-14 bg-[color-mix(in_oklch,var(--rps-cream)_88%,white)]">
              <div className="absolute inset-0 opacity-25 rps-noise" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="font-display text-3xl md:text-4xl">閱讀達人證書</div>
                  <div className="text-3xl">🦋</div>
                </div>

                <div className="mt-8 border-t pt-8">
                  <div className="text-sm text-muted-foreground">茲證明</div>
                  <div className="mt-2 font-display text-4xl md:text-5xl">
                    {profile?.studentName || "（姓名）"}
                  </div>
                  <div className="mt-2 text-lg">
                    {profile?.className || "（班級）"}
                  </div>

                  <div className="mt-6 text-lg leading-8">
                    已完成閱讀護照挑戰，並在老師審核通過後，累積通過
                    <span className="font-display text-4xl"> {approvedCount ?? "—"} </span>
                    本閱讀紀錄。
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-2">
                    <span className="text-xl">🏆</span>
                    <span className="font-medium">達成門檻 {APP.certificateThreshold} 本</span>
                  </div>

                  <div className="mt-10 flex items-end justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">日期</div>
                      <div className="font-medium">{today}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">核發單位</div>
                      <div className="font-medium">（學校／圖書館／導師）</div>
                    </div>
                  </div>
                </div>

                {!eligible && (
                  <div className="mt-10 rounded-xl border bg-background/70 p-4 text-sm text-muted-foreground no-print">
                    尚未達門檻：請先累積通過 {APP.certificateThreshold} 本。老師審核通過後會自動更新。
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
