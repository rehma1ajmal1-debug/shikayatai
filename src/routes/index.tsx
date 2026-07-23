import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FileText, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import heroImage from "@/assets/hero-citizens.jpg";
import { TopBar } from "@/components/site/top-bar";
import { SiteFooter } from "@/components/site/footer";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="tracking-tight">ShikayatAI</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" } as never}>
              <Button>Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by AI
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              File civic complaints that <span className="text-primary">actually get read.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Describe a broken road, a water leak, or a power cut in plain language. ShikayatAI turns it into a formal complaint, tells you which department handles it, how urgent it is, and where to file it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup" } as never}>
                <Button size="lg" className="shadow-[var(--shadow-elegant)]">Create free account</Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline">I already have an account</Button>
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <img
              src={heroImage}
              alt="Illustration of a diverse group of citizens together, one holding a smartphone, in front of a civic building."
              width={1536}
              height={1024}
              className="h-auto w-full max-w-xl"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: FileText, title: "Plain to professional", body: "Type the problem naturally in English or Urdu. We produce a formal, respectful complaint ready to submit." },
            { icon: Building2, title: "Right department", body: "We identify the responsible authority — water, electricity, roads, sanitation, police — and where the complaint typically goes." },
            { icon: ShieldCheck, title: "Evidence checklist", body: "Get a list of photos, videos and documents to attach so your complaint is taken seriously." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
