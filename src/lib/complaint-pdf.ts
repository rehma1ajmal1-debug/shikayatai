import { jsPDF } from "jspdf";

export interface ComplaintPdfData {
  subject: string;
  formal_complaint: string;
  department: string;
  urgency: string;
  suggested_evidence: string[];
  filing_location: string;
  category?: string | null;
  created_at?: string;
}

export function downloadComplaintPdf(c: ComplaintPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - marginX * 2;
  let y = 64;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 56) {
      doc.addPage();
      y = 64;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text("ShikayatAI — Formal Complaint", marginX, y);
  y += 24;

  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(1);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  doc.text(`Date: ${today}`, marginX, y);
  y += 18;
  doc.setTextColor(20, 20, 20);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Subject:", marginX, y);
  doc.setFont("helvetica", "normal");
  const subjectLines = doc.splitTextToSize(c.subject, maxWidth - 60);
  doc.text(subjectLines, marginX + 60, y);
  y += subjectLines.length * 14 + 10;

  const meta: [string, string][] = [
    ["Department:", c.department],
    ["Urgency:", c.urgency],
    ["Category:", c.category || "—"],
  ];
  meta.forEach(([label, value]) => {
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.text(label, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), marginX + 80, y);
    y += 16;
  });

  y += 12;
  ensureSpace(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Complaint", marginX, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const bodyLines = doc.splitTextToSize(c.formal_complaint, maxWidth);
  bodyLines.forEach((line: string) => {
    ensureSpace(16);
    doc.text(line, marginX, y);
    y += 14;
  });

  y += 12;
  ensureSpace(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Suggested Evidence to Attach", marginX, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  c.suggested_evidence.forEach((ev) => {
    const lines = doc.splitTextToSize(`• ${ev}`, maxWidth - 10);
    lines.forEach((line: string) => {
      ensureSpace(16);
      doc.text(line, marginX + 4, y);
      y += 14;
    });
  });

  y += 12;
  ensureSpace(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Where to File", marginX, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const locLines = doc.splitTextToSize(c.filing_location, maxWidth);
  locLines.forEach((line: string) => {
    ensureSpace(16);
    doc.text(line, marginX, y);
    y += 14;
  });

  const filename = `complaint-${c.subject.slice(0, 40).replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "shikayatai"}.pdf`;
  doc.save(filename);
}