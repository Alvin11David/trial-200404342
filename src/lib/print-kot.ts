export type KotTicketLine = {
  name: string;
  qty: number;
  modifiers: string[];
  specialNotes?: string;
  status: string;
  courseLabel?: string;
};

export type KotTicketData = {
  id: string;
  station: "kitchen" | "bar";
  stationLabel: string;
  outletName: string;
  orderType: string;
  table: string;
  deliveryName?: string;
  coverCount?: number;
  orderItems: KotTicketLine[];
  printCount?: number;
  isReprint?: boolean;
  voided?: boolean;
};

export function printKotTicket(t: KotTicketData) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-UG", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" });

  const courseOrder = ["Starter", "Main", "Dessert"];
  const grouped = new Map<string, KotTicketLine[]>();
  for (const line of t.orderItems) {
    const key = line.courseLabel ?? "All";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(line);
  }
  const courseKeys = [...grouped.keys()].sort(
    (a, b) => (courseOrder.indexOf(a) === -1 ? 99 : courseOrder.indexOf(a)) - (courseOrder.indexOf(b) === -1 ? 99 : courseOrder.indexOf(b)),
  );

  const renderLine = (line: KotTicketLine) => {
    const sub = [
      ...line.modifiers.map((m) => `  · ${m}`),
      ...(line.specialNotes ? [`  ✎ ${line.specialNotes}`] : []),
      line.status === "voided" ? "  · VOIDED" : "",
    ].filter(Boolean);
    return `
      <tr>
        <td style="padding:4px 0;vertical-align:top">
          <span style="font-size:14px;font-weight:600;${line.status === "voided" ? "text-decoration:line-through;color:#b91c1c;" : ""}">${line.qty} × ${line.name}</span>
          ${sub.length ? `<div style="font-size:11px;color:#6b7280;margin-top:2px;line-height:1.5">${sub.join("<br>")}</div>` : ""}
        </td>
      </tr>`;
  };

  const rows = courseKeys
    .map((course) => {
      const lines = grouped.get(course)!.map(renderLine).join("");
      return course === "All"
        ? lines
        : `<tr><td style="padding-top:8px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:600">— ${course} —</td></tr>${lines}`;
    })
    .join("");

  const stationBadge = t.station === "bar" ? "#b45309" : "#15803d";
  const printWin = window.open("", "_blank");
  if (!printWin) {
    window.print();
    return;
  }

  printWin.document.write(`
<!DOCTYPE html>
<html>
<head><title>${t.stationLabel} Ticket ${t.id}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #f8f9fa;
    display: flex;
    justify-content: center;
    padding: 40px 16px;
    color: #111827;
  }
  .ticket { width: 300px; background: #fff; border-radius: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
  .ticket-inner { padding: 28px 24px; }
  .header { text-align: center; margin-bottom: 20px; }
  .badge {
    display: inline-block;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    letter-spacing: 1px;
    background: ${stationBadge};
    margin-bottom: 8px;
  }
  .badge.reprint { background: #111827; margin-left: 4px; }
  .header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.3px; }
  .header .sub { font-size: 11px; color: #6b7280; margin-top: 4px; }
  .divider { border: none; border-top: 1.5px dashed #d1d5db; margin: 14px 0; }
  .meta { display: flex; justify-content: space-between; font-size: 11px; color: #4b5563; margin-bottom: 6px; }
  .meta strong { color: #111827; }
  .items { width: 100%; border-collapse: collapse; }
  .course-divider td { color: #9ca3af; }
  .void-stamp {
    margin: 16px auto 0;
    width: fit-content;
    padding: 4px 16px;
    border: 2px solid #b91c1c;
    color: #b91c1c;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 2px;
    transform: rotate(-4deg);
  }
  .footer { margin-top: 18px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #eee; padding-top: 12px; line-height: 1.6; }
  @media print { body { background: #fff; padding: 0; } .ticket { box-shadow: none; border-radius: 0; } }
</style>
</head>
<body>
  <div class="ticket">
    <div class="ticket-inner">
      <div class="header">
        <span class="badge">${t.stationLabel} · ${t.station.toUpperCase()}</span>${t.isReprint ? `<span class="badge reprint">REPRINT</span>` : ""}
        <h1>${t.outletName}</h1>
        <div class="sub">${t.orderType}${t.table ? ` · Table ${t.table}` : ""}${t.coverCount ? ` · ${t.coverCount} covers` : ""}${t.deliveryName ? ` · ${t.deliveryName}` : ""}</div>
      </div>
      <hr class="divider">
      <div class="meta"><span>Ticket <strong>#${t.id}</strong></span><span><strong>${dateStr}</strong> ${timeStr}</span></div>
      <div class="meta"><span>Order <strong>${t.orderType}</strong></span><span>Print <strong>#${t.printCount ?? 1}${t.isReprint ? " (reprint)" : ""}</strong></span></div>
      <hr class="divider">
      <table class="items">
        <tbody>${rows}</tbody>
      </table>
      ${t.voided ? `<div class="void-stamp">VOIDED</div>` : ""}
      <div class="footer">
        Kitchen / Bar staff — please call or flag any issues.<br>
        Ticket is electronically generated
      </div>
    </div>
  </div>
</body>
</html>`);

  printWin.document.close();
  printWin.focus();

  const finishPrint = () => printWin.close();
  if (printWin.matchMedia) {
    const mql = printWin.matchMedia("print");
    mql.addEventListener("change", (ev) => {
      if (!ev.matches) finishPrint();
    });
  }
  setTimeout(() => printWin.print(), 300);
}
