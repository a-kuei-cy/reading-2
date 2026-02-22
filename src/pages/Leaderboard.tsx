import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { ClassLeaderboardRow, LeaderboardRow } from "@/lib/types";
import { Medal } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

function TopBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Badge className="bg-[var(--rps-sun)] text-[var(--rps-navy)]">冠軍</Badge>;
  if (rank === 2) return <Badge className="bg-[color-mix(in_oklch,var(--rps-teal)_55%,white)] text-[var(--rps-navy)]">亞軍</Badge>;
  if (rank === 3) return <Badge className="bg-[color-mix(in_oklch,var(--rps-coral)_55%,white)] text-[var(--rps-navy)]">季軍</Badge>;
  return null;
}

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [individuals, setIndividuals] = useState<LeaderboardRow[]>([]);
  const [classes, setClasses] = useState<ClassLeaderboardRow[]>([]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.getLeaderboards();
      setIndividuals(res.individuals);
      setClasses(res.classes);
    } catch (e: any) {
      toast.error(e.message || "讀取排行榜失敗");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const top3 = useMemo(() => individuals.slice(0, 3), [individuals]);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl">排行榜</h1>
          <p className="text-muted-foreground mt-1">只統計「通過」的閱讀本數。</p>
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-20 mt-3" />
                <Skeleton className="h-4 w-40 mt-2" />
              </Card>
            ))
          : top3.map((r) => (
              <motion.div key={r.rank} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: r.rank * 0.05 }}>
                <Card className="p-5 border-2" style={{ borderColor: r.rank === 1 ? "color-mix(in oklch, var(--rps-sun) 70%, transparent)" : "var(--border)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Medal className="h-5 w-5" />
                      <div className="font-display text-xl">第 {r.rank} 名</div>
                    </div>
                    <TopBadge rank={r.rank} />
                  </div>
                  <div className="mt-3">
                    <div className="text-sm text-muted-foreground">{r.className}</div>
                    <div className="font-medium text-lg">{r.studentName}</div>
                    <div className="font-display text-4xl mt-2">{r.approvedCount}</div>
                    <div className="text-xs text-muted-foreground">本（通過）</div>
                  </div>
                </Card>
              </motion.div>
            ))}
      </div>

      <div className="mt-8">
        <Card className="p-5 md:p-6">
          <Tabs defaultValue="individual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">個人排行榜</TabsTrigger>
              <TabsTrigger value="class">班級排行榜</TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="mt-4">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[90px]">名次</TableHead>
                      <TableHead>班級</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead className="text-right">通過本數</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {individuals.map((r) => (
                      <TableRow key={r.rank} className={r.rank <= 3 ? "bg-[color-mix(in_oklch,var(--rps-sun)_10%,transparent)]" : ""}>
                        <TableCell className="font-medium">{r.rank}</TableCell>
                        <TableCell>{r.className}</TableCell>
                        <TableCell>{r.studentName}</TableCell>
                        <TableCell className="text-right font-display text-lg">{r.approvedCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="class" className="mt-4">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[90px]">名次</TableHead>
                      <TableHead>班級</TableHead>
                      <TableHead className="text-right">平均通過本數</TableHead>
                      <TableHead className="text-right">人數</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((r) => (
                      <TableRow key={r.rank}>
                        <TableCell className="font-medium">{r.rank}</TableCell>
                        <TableCell>{r.className}</TableCell>
                        <TableCell className="text-right font-display text-lg">{r.averageApprovedCount.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{r.studentCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <div className="h-10" />
    </div>
  );
}
