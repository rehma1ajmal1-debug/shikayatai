import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — ShikayatAI" },
      { name: "description", content: "Sign in or create your ShikayatAI account to generate and save formal complaints." },
      { property: "og:title", content: "Sign in — ShikayatAI" },
      { property: "og:description", content: "Access your complaint history and generate new formal complaints." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: (redirect as "/dashboard") ?? "/dashboard" });
    });
  }, [navigate, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
      password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72),
    });
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Welcome back");
      }
      navigate({ to: (redirect as "/dashboard") ?? "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4" style={{ background: "var(--gradient-subtle)" }}>
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-semibold text-foreground">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span>ShikayatAI</span>
        </Link>
        <Card className="p-6 shadow-[var(--shadow-elegant)]">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Save every complaint you generate and access it anytime."
              : "Sign in to continue filing complaints."}
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>Already have an account?{" "}
                <button className="font-medium text-primary hover:underline" onClick={() => setMode("signin")}>Sign in</button>
              </>
            ) : (
              <>New here?{" "}
                <button className="font-medium text-primary hover:underline" onClick={() => setMode("signup")}>Create an account</button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}