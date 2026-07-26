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
  language?: string | null;
}

function pdfFilename(c: ComplaintPdfData) {
  return `complaint-${c.subject.slice(0, 40).replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "shikayatai"}.pdf`;
}

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Urdu/Nastaliq is not supported by jsPDF core fonts, so we rasterise styled HTML. */
async function downloadUrduComplaintPdf(c: ComplaintPdfData) {
  const html2canvas = (await import("html2canvas")).default;

  const body = `
    <div id="sheet" style="width:794px;box-sizing:border-box;padding:56px;background:#ffffff;color:#141414;font-family:'Noto Nastaliq Urdu','Jameel Noori Nastaleeq',serif;">
      <div style="font-size:24px;font-weight:700;color:#1e40af;font-family:Helvetica,Arial,sans-serif;">ShikayatAI — Formal Complaint</div>
      <div style="border-bottom:1px solid #1e40af;margin:14px 0 16px;"></div>
      <div style="font-size:12px;color:#5a5a5a;font-family:Helvetica,Arial,sans-serif;">Date: ${esc(todayLabel())}</div>

      <div dir="rtl" style="margin-top:22px;font-size:20px;line-height:2.2;">${esc(c.subject)}</div>

      <table style="margin-top:18px;font-size:13px;font-family:Helvetica,Arial,sans-serif;border-collapse:collapse;">
        <tr><td style="font-weight:700;padding:3px 12px 3px 0;">Department:</td><td>${esc(c.department)}</td></tr>
        <tr><td style="font-weight:700;padding:3px 12px 3px 0;">Urgency:</td><td>${esc(c.urgency)}</td></tr>
        <tr><td style="font-weight:700;padding:3px 12px 3px 0;">Category:</td><td>${esc(c.category || "—")}</td></tr>
      </table>

      <div style="margin-top:24px;font-size:15px;font-weight:700;color:#1e40af;font-family:Helvetica,Arial,sans-serif;">Complaint</div>
      <div dir="rtl" style="margin-top:10px;font-size:17px;line-height:2.6;white-space:pre-wrap;">${esc(c.formal_complaint)}</div>

      <div style="margin-top:24px;font-size:15px;font-weight:700;color:#1e40af;font-family:Helvetica,Arial,sans-serif;">Suggested Evidence to Attach</div>
      <ul style="margin:8px 0 0;padding-left:20px;font-size:13px;line-height:1.7;font-family:Helvetica,Arial,sans-serif;">
        ${c.suggested_evidence.map((e) => `<li>${esc(e)}</li>`).join("")}
      </ul>

      <div style="margin-top:24px;font-size:15px;font-weight:700;color:#1e40af;font-family:Helvetica,Arial,sans-serif;">Where to File</div>
      <div style="margin-top:8px;font-size:13px;line-height:1.7;font-family:Helvetica,Arial,sans-serif;">${esc(c.filing_location)}</div>
    </div>`;

  // Rendered inside an isolated iframe so the app's stylesheet (which uses
  // oklch colors that html2canvas cannot parse) never reaches the clone.
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;height:1200px;border:0;background:#ffffff;";
  document.body.appendChild(frame);

  try {
    const fdoc = frame.contentDocument!;
    fdoc.open();
    fdoc.write(
      `<!doctype html><html><head><meta charset="utf-8">` +
        `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap">` +
        `</head><body style="margin:0;background:#ffffff;color:#141414;">${body}</body></html>`,
    );
    fdoc.close();

    const fonts = (fdoc as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.load) {
      await Promise.all([
        fonts.load("400 17px 'Noto Nastaliq Urdu'"),
        fonts.load("700 20px 'Noto Nastaliq Urdu'"),
      ]).catch(() => undefined);
      await fonts.ready.catch(() => undefined);
    }
    await new Promise((r) => setTimeout(r, 150));

    const sheet = fdoc.getElementById("sheet") as HTMLElement;
    frame.style.height = `${sheet.scrollHeight + 40}px`;

    const canvas = await html2canvas(sheet, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const img = canvas.toDataURL("image/jpeg", 0.95);

    let remaining = imgHeight;
    let offset = 0;
    while (remaining > 0) {
      doc.addImage(img, "JPEG", 0, -offset, imgWidth, imgHeight);
      remaining -= pageHeight;
      offset += pageHeight;
      if (remaining > 0) doc.addPage();
    }

    doc.save(pdfFilename(c));
  } finally {
    frame.remove();
  }
}

export async function downloadComplaintPdf(c: ComplaintPdfData) {
  if (c.language === "Urdu") {
    await downloadUrduComplaintPdf(c);
    return;
  }
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

  doc.save(pdfFilename(c));
}