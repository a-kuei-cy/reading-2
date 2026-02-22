import { useEffect, useMemo, useState } from "react";
import heroImg from "@/assets/metamorphosis-hero.jpeg";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Trash2, Loader2, Plus, RefreshCw } from "lucide-react";

import { api } from "@/lib/api";
import { APP, STUDENT_PROFILE_STORAGE } from "@/lib/config";
import type { ReadingEntry, StudentProfile } from "@/lib/types";
import { countWordsZh, stageProgressPercent } from "@/lib/stage";

function loadProfile(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(STUDENT_PROFILE_STORAGE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveProfile(p: StudentProfile) {
  localStorage.setItem(STUDENT_PROFILE_STORAGE, JSON.stringify(p));
}

function statusBadge(status: ReadingEntry["status"]) {
  if (status === "APPROVED") return <Badge className="bg-[var(--rps-teal)] text-[var(--rps-navy)]">通過</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive">退件</Badge>;
  return <Badge variant="secondary">待審核</Badge>;
}

export default function Home() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<ReadingEntry[]>([]);
  const [stats, setStats] = useState<any>(null);

  // form
  const [className, setClassName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [reflection, setReflection] = useState("");

  useEffect(() => {
    const p = loadProfile();
    if (p) {
      setProfile(p);
      setClassName(p.className);
      setStudentName(p.studentName);
    }
  }, []);

  const wordCount = useMemo(() => countWordsZh(reflection), [reflection]);

  async function refresh() {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await api.getStudentSummary(profile);
      setEntries(res.entries);
      setStats(res.stats);
    } catch (e: any) {
      toast.error(e.message || "讀取失敗");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profile) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.className, profile?.studentName]);

  async function onSubmit() {
    const p = { className: className.trim(), studentName: studentName.trim() };
    if (!p.className || !p.studentName) return toast.error("請先填寫班級與姓名");
    if (!bookTitle.trim()) return toast.error("請填寫書名");
    if (!author.trim()) return toast.error("請填寫作者");
    if (!publisher.trim()) return toast.error("請填寫出版社");
    if (wordCount < 100) return toast.error("閱讀心得至少 100 字（目前約 " + wordCount + " 字）");

    setLoading(true);
    const t = toast.loading("送出中…");
    try {
      saveProfile(p);
      setProfile(p);
      await api.submitEntry({
        className: p.className,
        studentName: p.studentName,
        bookTitle: bookTitle.trim(),
        author: author.trim(),
        publisher: publisher.trim(),
        reflection: reflection.trim(),
      });
      toast.success("已送出！等待老師審核", { id: t });
      setBookTitle("");
      setAuthor("");
      setPublisher("");
      setReflection("");
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "送出失敗", { id: t });
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    if (!profile) return;
    setLoading(true);
    const t = toast.loading("刪除中…");
    try {
      await api.deleteEntry({ id, profile });
      toast.success("已刪除", { id: t });
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "刪除失敗", { id: t });
    } finally {
      setLoading(false);
    }
  }

  const approvedCount = stats?.approvedCount ?? 0;
  const stagePercent = stageProgressPercent(approvedCount);
  const currentStage = APP.stages.find((s) => s.key === stats?.stageKey) || APP.stages[0];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="閱讀蛻變旅程" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[color-mix(in_oklch,var(--rps-cream)_75%,transparent)]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-10">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl md:text-6xl leading-[1.05]"
          >
            閱讀打卡，
            <span className="block">讓你一路蛻變成 🦋</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-4 max-w-xl text-base md:text-lg text-[color-mix(in_oklch,var(--rps-navy)_72%,black)]"
          >
            提交閱讀心得 → 老師審核 → 即時統計與視覺化進度 → 排行榜與證書。
          </motion.p>

          <div className="mt-6 flex flex-wrap gap-2">
            {APP.stages.map((s) => (
              <span
                key={s.key}
                className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-sm"
              >
                <span>{s.emoji}</span>
                <span className="font-medium">{s.label}</span>
                <span className="text-muted-foreground">{s.range}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Main */}
      <section className="rps-diagonal rps-noise">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Submit */}
            <Card className="lg:col-span-7 p-5 md:p-6 shadow-sm bg-card/90">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">閱讀打卡</h2>
                  <p className="text-sm text-muted-foreground">心得至少 100 字，送出後先進入待審核。</p>
                </div>
                <Button onClick={onSubmit} disabled={loading} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  送出
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">班級</label>
                  <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="例如：五年三班" />
                </div>
                <div>
                  <label className="text-sm">姓名</label>
                  <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="例如：王小明" />
                </div>
                <div>
                  <label className="text-sm">書名</label>
                  <Input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} placeholder="例如：小王子" />
                </div>
                <div>
                  <label className="text-sm">作者（必填）</label>
                  <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="例如：安東尼・聖修伯里" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm">出版社（必填）</label>
                  <Input value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="例如：小天下" />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm">閱讀心得</label>
                    <span className={"text-xs " + (wordCount >= 100 ? "text-[var(--rps-teal)]" : "text-muted-foreground")}>
                      目前約 {wordCount} 字
                    </span>
                  </div>
                  <Textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    rows={7}
                    placeholder="請寫下你讀到的內容、最喜歡的一段、以及你的想法…"
                  />
                </div>
              </div>
            </Card>

            {/* Stats */}
            <Card className="lg:col-span-5 p-5 md:p-6 shadow-sm bg-card/90">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">我的即時統計</h2>
                  <p className="text-sm text-muted-foreground">以「通過」本數計算階段與排行榜。</p>
                </div>
                <Button variant="outline" onClick={refresh} disabled={loading || !profile} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  重新整理
                </Button>
              </div>

              <Separator className="my-4" />

              {!profile ? (
                <div className="text-sm text-muted-foreground">先在左側填寫班級與姓名，送出第一筆打卡後就會自動記住。</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border bg-background/60 p-3">
                      <div className="text-xs text-muted-foreground">通過</div>
                      <div className="font-display text-3xl">{stats?.approvedCount ?? "—"}</div>
                    </div>
                    <div className="rounded-xl border bg-background/60 p-3">
                      <div className="text-xs text-muted-foreground">待審核</div>
                      <div className="font-display text-3xl">{stats?.pendingCount ?? "—"}</div>
                    </div>
                    <div className="rounded-xl border bg-background/60 p-3">
                      <div className="text-xs text-muted-foreground">退件</div>
                      <div className="font-display text-3xl">{stats?.rejectedCount ?? "—"}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-background/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={stats ? { scale: [1, 1.08, 1] } : undefined}
                          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.2 }}
                          className="text-2xl"
                        >
                          {currentStage.emoji}
                        </motion.div>
                        <div>
                          <div className="font-display text-xl">{stats?.stageLabel ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{stats?.stageRange ?? ""}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {stats?.toNextStage != null ? (
                          <div>
                            距離 <span className="font-medium">{stats.nextStageLabel}</span> 還差
                            <span className="font-display text-xl"> {stats.toNextStage} </span>
                            本
                          </div>
                        ) : (
                          <div className="font-medium">你已在最高階段！</div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <Progress value={stagePercent} />
                      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                        <span>本階段起點</span>
                        <span>下一階段</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-background/60 p-4">
                    <div className="text-sm">
                      證書門檻：通過 <span className="font-display text-xl">{APP.certificateThreshold}</span> 本
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">到「證書」頁即可截圖或列印。</div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* History */}
          <div className="mt-8">
            <Card className="p-5 md:p-6 shadow-sm bg-card/90">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">閱讀歷程</h2>
                  <p className="text-sm text-muted-foreground">最新在最上面。可刪除自己送出的錯誤紀錄。</p>
                </div>
              </div>

              <Separator className="my-4" />

              {!profile ? (
                <div className="text-sm text-muted-foreground">尚未建立個人資料。</div>
              ) : entries.length === 0 ? (
                <div className="text-sm text-muted-foreground">目前沒有紀錄。</div>
              ) : (
                <div className="space-y-3">
                  {entries.map((e) => (
                    <div key={e.id} className="rounded-2xl border bg-background/60 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{e.bookTitle}</div>
                            {statusBadge(e.status)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {e.className}｜{e.studentName}｜{new Date(e.timestampUtc).toLocaleString()}
                          </div>
                          {(e.author || e.publisher) && (
                            <div className="text-xs text-muted-foreground">{e.author ? `作者：${e.author}` : ""}{e.author && e.publisher ? "｜" : ""}{e.publisher ? `出版社：${e.publisher}` : ""}</div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">查看心得</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{e.bookTitle}</DialogTitle>
                              </DialogHeader>
                              <div className="text-sm whitespace-pre-wrap leading-7">{e.reflection}</div>
                              <DialogFooter>
                                <Button variant="secondary">關閉</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(e.id)}
                            disabled={loading}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            刪除
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="h-10" />
        </div>
      </section>
    </div>
  );
}
