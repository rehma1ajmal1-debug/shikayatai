import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-card">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground">How It Works</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>1. Describe your issue in plain language</li>
              <li>2. We rewrite it as a formal complaint</li>
              <li>3. Get the right department & filing steps</li>
              <li>4. Download as PDF and file it</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Your Complaints</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/dashboard" className="hover:text-foreground">New complaint</Link></li>
              <li><Link to="/history" className="hover:text-foreground">Complaint history</Link></li>
              <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Privacy & Data</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Your complaints are private to your account.</li>
              <li>We don't sell or share your data.</li>
              <li>You can delete any complaint at any time.</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">About This Project</h4>
            <p className="mt-3 text-sm text-muted-foreground">
              ShikayatAI is an independent student project and is not affiliated with or endorsed by any government agency.
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ShikayatAI. Making civic voice easier.
        </div>
      </div>
    </footer>
  );
}