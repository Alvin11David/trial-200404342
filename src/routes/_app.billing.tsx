import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/billing")({
  head: () => ({ meta: [{ title: "Billing — Jambo ERP" }] }),
  component: Billing,
});

const invoices = [
  {
    id: "INV-10241",
    guest: "Sarah Nakato",
    date: "Jun 09",
    amount: "UGX 1,200,000",
    status: "Paid",
  },
  {
    id: "INV-10242",
    guest: "James Okello",
    date: "Jun 09",
    amount: "UGX 3,400,000",
    status: "Paid",
  },
  {
    id: "INV-10243",
    guest: "Priya Sharma",
    date: "Jun 10",
    amount: "UGX 980,000",
    status: "Pending",
  },
  {
    id: "INV-10244",
    guest: "David Mensah",
    date: "Jun 10",
    amount: "UGX 2,100,000",
    status: "Overdue",
  },
];

const statusStyle: Record<string, string> = {
  Paid: "bg-success/15 text-success border-success/30",
  Pending: "bg-warning/15 text-warning border-warning/30",
  Overdue: "bg-destructive/15 text-destructive border-destructive/30",
};

function Billing() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Invoices, folios &amp; payments.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Outstanding", value: "UGX 6.4M", tone: "warning" },
          { label: "Collected (MTD)", value: "UGX 184M", tone: "success" },
          { label: "Overdue", value: "UGX 2.1M", tone: "destructive" },
        ].map((s) => (
          <div key={s.label} className="glass card-hover rounded-2xl p-5">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div
              className={`mt-1 text-2xl font-bold ${s.tone === "warning" ? "text-warning" : s.tone === "success" ? "text-success" : "text-destructive"}`}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-3 font-medium">Invoice</th>
              <th className="px-3 py-3 font-medium">Guest</th>
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-b border-border/30 hover:bg-card/40">
                <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{i.id}</td>
                <td className="px-3 py-3 font-medium">{i.guest}</td>
                <td className="px-3 py-3 text-muted-foreground">{i.date}</td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusStyle[i.status]}`}
                  >
                    {i.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-semibold">{i.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
