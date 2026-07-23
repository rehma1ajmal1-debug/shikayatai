import { FileText } from "lucide-react";

export function TopBar() {
  return (
    <div className="w-full bg-[oklch(0.22_0.09_255)] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-1.5 text-xs">
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <FileText className="h-3.5 w-3.5" />
          <span>ShikayatAI · Civic Complaints Portal</span>
        </div>
        <span className="hidden text-white/70 sm:inline">Independent student project</span>
      </div>
    </div>
  );
}