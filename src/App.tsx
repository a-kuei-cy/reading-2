import { Link, Route, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Router } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "@/pages/Home";
import Leaderboard from "@/pages/Leaderboard";
import Admin from "@/pages/Admin";
import Certificate from "@/pages/Certificate";
import NotFound from "@/pages/NotFound";

function AppRouter() {
  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/certificate" component={Certificate} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <div className="min-h-screen">
            <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/55 no-print">
              <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
                <Link href="/" className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-sm">
                    <span className="text-lg">🦋</span>
                  </div>
                  <div className="leading-tight">
                    <div className="font-display text-base">興嘉國小學生閱讀護照</div>
                    <div className="text-[11px] text-muted-foreground">Xingjia Elementary School Reading Passport</div>
                  </div>
                </Link>

                <nav className="flex items-center gap-1 text-sm">
                  <Link href="/" className="px-3 py-2 rounded-lg hover:bg-accent">學生端</Link>
                  <Link href="/leaderboard" className="px-3 py-2 rounded-lg hover:bg-accent">排行榜</Link>
                  <Link href="/certificate" className="px-3 py-2 rounded-lg hover:bg-accent">證書</Link>
                  <Link href="/admin" className="px-3 py-2 rounded-lg hover:bg-accent">管理者</Link>
                </nav>
              </div>
            </header>

            <main>
              <AppRouter />
            </main>

            <footer className="border-t mt-12 no-print">
              <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
                <div>© {new Date().getFullYear()} 學生閱讀護照系統｜前端 GitHub Pages + Google Apps Script + Google 試算表</div>
              </div>
            </footer>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
