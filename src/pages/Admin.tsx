import { useEffect, useMemo, useState } from "react";
// 設計宣言：Paper-cut Neo‑Memphis 讀書蛻變主題
// 核心：高對比、紙雕層次、斜向流動、明確色彩編碼。
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

import { api } from "@/lib/api";
import { ADMIN_KEY_STORAGE } from "@/lib/config";
import type { ReadingEntry, ReviewStatus } from "@/lib/types";

function statusBadge(status: ReviewStatus) {
  if (status === "APPROVED") return <Badge className="bg-[var(--rps-teal)] text-[var(--rps-navy)]">通過</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive">退件</Badge>;
  return <Badge variant="secondary">待審核</Badge>;
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ReviewStatus>("PENDING");
  const [entries, setEntries] = useState<ReadingEntry[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ReadingEntry | null>(null);

  useEffect(() => {
    const k = localStorage.getItem(ADMIN_KEY_STORAGE);
    if (k) setAdminKey(k);
  }, []);

  async function load() {
    if (!adminKey.trim()) return toast.error("請輸入管理金鑰");
    setLoading(true);
    try {
      localStorage.setItem(ADMIN_KEY_STORAGE, adminKey.trim());
      const [list, ana] = await Promise.all([
        api.adminList({ adminKey: adminKey.trim(), status }),
        api.adminAnalytics({ adminKey: adminKey.trim() }),
      ]);
      setEntries(list.entries);
      setAnalytics(ana);
    } catch (e: any) {
      toast.error(e.message || "讀取失敗");
    } finally {
      setLoading(false);
    }
  }

  async function setEntryStatus(id: string, next: ReviewStatus) {
    setLoading(true);
    const t = toast.loading("更新中…");
    try {
      await api.adminSetStatus({ adminKey: adminKey.trim(), id, status: next });
      toast.success("已更新", { id: t });
      await load();
    } catch (e: any) {
      toast.error(e.message || "更新失敗", { id: t });
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    setLoading(true);
    const t = toast.loading("刪除中…");
    try {
      await api.adminDelete({ adminKey: adminKey.trim(), id });
      toast.success("已刪除", { id: t });
      await load();
    } catch (e: any) {
      toast.error(e.message || "刪除失敗", { id: t });
    } finally {
      setLoading(false);
    }
  }

  async function exportData(format: "csv" | "xlsx") {
    setLoading(true);
    const t = toast.loading("產生匯出檔…");
    try {
      const res = await api.adminExport({ adminKey: adminKey.trim(), format });
      toast.success("已產生匯出連結", { id: t });
      window.open(res.url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "匯出失敗", { id: t });
    } finally {
      setLoading(false);
    }
  }

  const editState = useMemo(() => {
    const e = editing;
    if (!e) return null;
    return {
      id: e.id,
      className: e.className,
      studentName: e.studentName,
      bookTitle: e.bookTitle,
      author: e.author,
      publisher: e.publisher,
      reflection: e.reflection,
    };
  }, [editing]);

  const [patch, setPatch] = useState<any>(null);

  useEffect(() => {
    setPatch(editState);
  }, [editState]);

  async function saveEdit() {
    if (!patch?.id) return;
    setLoading(true);
    const t = toast.loading("儲存中…");
    try {
      await api.adminUpdate({ adminKey: adminKey.trim(), id: patch.id, patch });
      toast.success("已儲存", { id: t });
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e.message || "儲存失敗", { id: t });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="font-display text-4xl">管理者後台</h1>
      <p className="text-muted-foreground mt-1">審核、編修、刪除、匯出資料。此頁需管理金鑰。</p>

      <div className="mt-6 grid lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 p-5 md:p-6">
          <h2 className="font-display text-2xl">登入</h2>
          <Separator className="my-4" />
          <div className="space-y-3">
            <div>
              <label className="text-sm">管理金鑰</label>
              <Input value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="由系統管理者設定" />
              <p className="text-xs text-muted-foreground mt-1">提醒：前端無法真正保密，真正權限請在 GAS 端驗證。</p>
            </div>
            <div>
              <label className="text-sm">篩選狀態</label>
              <Select value={status} onValueChange={(v) => setStatus(v as ReviewStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">待審核</SelectItem>
                  <SelectItem value="APPROVED">通過</SelectItem>
                  <SelectItem value="REJECTED">退件</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={load} disabled={loading} className="w-full">載入列表</Button>

            <Separator />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => exportData("csv")} disabled={loading}>
                匯出 CSV
              </Button>
              <Button variant="outline" onClick={() => exportData("xlsx")} disabled={loading}>
                匯出 Excel
              </Button>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-8 p-5 md:p-6">
          <Tabs defaultValue="review" className="w-full">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-display text-2xl">後台工作區</h2>
                <p className="text-sm text-muted-foreground">審核清單 + 統計圖表（年級閱讀比例／成長階段分佈）。</p>
              </div>
              <TabsList className="grid grid-cols-2 w-[240px]">
                <TabsTrigger value="review">審核</TabsTrigger>
                <TabsTrigger value="analytics">統計圖表</TabsTrigger>
              </TabsList>
            </div>

            <Separator className="my-4" />

            <TabsContent value="review">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="text-sm text-muted-foreground">目前沒有資料（或尚未載入）。</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>狀態</TableHead>
                      <TableHead>班級</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>書名</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{statusBadge(e.status)}</TableCell>
                        <TableCell>{e.className}</TableCell>
                        <TableCell>{e.studentName}</TableCell>
                        <TableCell className="max-w-[240px] truncate" title={e.bookTitle}>
                          {e.bookTitle}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditing(e);
                                setEditOpen(true);
                              }}
                            >
                              編修
                            </Button>
                            <Button size="sm" onClick={() => setEntryStatus(e.id, "APPROVED")} disabled={loading}>
                              通過
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setEntryStatus(e.id, "REJECTED")}
                              disabled={loading}
                            >
                              退件
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => remove(e.id)} disabled={loading}>
                              刪除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="analytics">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !analytics ? (
                <div className="text-sm text-muted-foreground">尚未載入分析資料（請先輸入金鑰並載入列表）。</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="rounded-xl border bg-background/60 p-3">
                      <div className="text-xs text-muted-foreground">通過紀錄</div>
                      <div className="font-display text-3xl">{analytics.meta?.approvedEntries ?? 0}</div>
                    </div>
                    <div className="rounded-xl border bg-background/60 p-3">
                      <div className="text-xs text-muted-foreground">學生人數（有通過）</div>
                      <div className="font-display text-3xl">{analytics.meta?.students ?? 0}</div>
                    </div>
                    <div className="rounded-xl border bg-background/60 p-3">
                      <div className="text-xs text-muted-foreground">年級解析</div>
                      <div className="text-sm mt-1">{analytics.meta?.gradeParseNote}</div>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    <Card className="p-4">
                      <div className="font-display text-xl">各年級閱讀比例（通過本數）</div>
                      <div className="text-xs text-muted-foreground mt-1">依班級欄位解析年級，無法解析者歸類為「未辨識」。</div>
                      <div className="mt-3 h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                            <Pie data={analytics.gradePie} dataKey="value" nameKey="name" outerRadius={110} innerRadius={52} paddingAngle={2}>
                              {analytics.gradePie.map((_: any, i: number) => (
                                <Cell
                                  key={i}
                                  fill={
                                    [
                                      "color-mix(in oklch, var(--rps-teal) 70%, white)",
                                      "color-mix(in oklch, var(--rps-sun) 75%, white)",
                                      "color-mix(in oklch, var(--rps-coral) 70%, white)",
                                      "color-mix(in oklch, var(--rps-navy) 60%, white)",
                                      "color-mix(in oklch, var(--rps-teal) 40%, white)",
                                      "color-mix(in oklch, var(--rps-sun) 45%, white)",
                                      "color-mix(in oklch, var(--rps-coral) 40%, white)",
                                    ][i % 7]
                                  }
                                  stroke="var(--border)"
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="font-display text-xl">成長階段分佈（以學生為單位）</div>
                      <div className="text-xs text-muted-foreground mt-1">每位學生依「通過本數」判定階段後統計人數。</div>
                      <div className="mt-3 h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                            <Pie data={analytics.stagePie} dataKey="value" nameKey="name" outerRadius={110} innerRadius={52} paddingAngle={2}>
                              {analytics.stagePie.map((seg: any) => (
                                <Cell
                                  key={seg.key}
                                  fill={
                                    seg.key === "egg"
                                      ? "color-mix(in oklch, var(--rps-sun) 70%, white)"
                                      : seg.key === "larva"
                                      ? "color-mix(in oklch, var(--rps-teal) 70%, white)"
                                      : seg.key === "pupa"
                                      ? "color-mix(in oklch, var(--rps-coral) 65%, white)"
                                      : "color-mix(in oklch, var(--rps-navy) 55%, white)"
                                  }
                                  stroke="var(--border)"
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>編修資料</DialogTitle>
          </DialogHeader>
          {!patch ? (
            <div className="text-sm text-muted-foreground">未選擇項目</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">班級</label>
                <Input value={patch.className || ""} onChange={(e) => setPatch({ ...patch, className: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">姓名</label>
                <Input value={patch.studentName || ""} onChange={(e) => setPatch({ ...patch, studentName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">書名</label>
                <Input value={patch.bookTitle || ""} onChange={(e) => setPatch({ ...patch, bookTitle: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">作者</label>
                <Input value={patch.author || ""} onChange={(e) => setPatch({ ...patch, author: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm">出版社</label>
                <Input value={patch.publisher || ""} onChange={(e) => setPatch({ ...patch, publisher: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm">心得</label>
                <Textarea value={patch.reflection || ""} rows={8} onChange={(e) => setPatch({ ...patch, reflection: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={saveEdit} disabled={loading || !patch?.id}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-10" />
    </div>
  );
}
