import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LogOut, History, PlusCircle } from "lucide-react";
import { TopBar } from "@/components/site/top-bar";
import { SiteFooter } from "@/components/site/footer";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TopBar />
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span>ShikayatAI</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm"><PlusCircle className="mr-2 h-4 w-4" />New</Button>
            </Link>
            <Link to="/history">
              <Button variant="ghost" size="sm"><History className="mr-2 h-4 w-4" />History</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1"><Outlet /></main>
      <SiteFooter />
    </div>
  );
}