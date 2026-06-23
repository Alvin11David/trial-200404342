export type ReceiptItem = {
  name: string;
  qty: number;
  price: number;
};

export type ReceiptData = {
  id: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  paymentMethod: string;
  table: string;
  cashier: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  businessTin: string;
};

export function printReceipt(r: ReceiptData) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-UG", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-UG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const rows = r.items
    .map(
      (it) => `
        <tr>
          <td style="padding:4px 0">${it.name} <span style="color:#888;font-size:11px">x${it.qty}</span></td>
          <td style="padding:4px 0;text-align:right">UGX ${(it.price * it.qty).toLocaleString()}</td>
        </tr>`,
    )
    .join("");

  const printWin = window.open("", "_blank");
  if (!printWin) {
    window.print();
    return;
  }

  printWin.document.write(`
<!DOCTYPE html>
<html>
<head><title>Receipt ${r.id}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #f8f9fa;
    display: flex;
    justify-content: center;
    padding: 40px 16px;
    color: #1a1a2e;
  }
  .receipt {
    width: 320px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    overflow: hidden;
  }
  .receipt-inner { padding: 32px 28px; }
  .header { text-align: center; margin-bottom: 24px; }
  .header h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
  .header .sub {
    font-size: 11px;
    color: #888;
    margin-top: 4px;
    line-height: 1.6;
  }
  .divider {
    border: none;
    border-top: 1.5px dashed #e0e0e0;
    margin: 16px 0;
  }
  .meta-grid {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #666;
    margin-bottom: 12px;
  }
  .meta-grid strong { color: #1a1a2e; }
  .items-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .items-table th {
    text-align: left;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #999;
    padding-bottom: 6px;
    border-bottom: 1px solid #eee;
  }
  .items-table th:last-child { text-align: right; }
  .totals { margin-top: 12px; }
  .totals .row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #666;
    padding: 3px 0;
  }
  .totals .total {
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 700;
    color: #1a1a2e;
    border-top: 1.5px solid #1a1a2e;
    padding-top: 8px;
    margin-top: 8px;
  }
  .payment-info {
    margin-top: 16px;
    padding: 12px;
    background: #f3f4f6;
    border-radius: 10px;
    font-size: 12px;
    text-align: center;
    color: #555;
  }
  .payment-info strong { color: #1a1a2e; }
  .footer {
    margin-top: 20px;
    text-align: center;
    font-size: 11px;
    color: #aaa;
    line-height: 1.6;
    border-top: 1px solid #eee;
    padding-top: 16px;
  }
  .badge {
    display: inline-block;
    background: #1a1a2e;
    color: #fff;
    font-size: 10px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .receipt { box-shadow: none; border-radius: 0; }
  }
</style>
</head>
<body>
  <div class="receipt">
    <div class="receipt-inner">
      <div class="header">
        <span class="badge">RECEIPT</span>
        <h1>${r.businessName}</h1>
        <div class="sub">${r.businessAddress}<br>${r.businessPhone} · ${r.businessEmail}<br>TIN: ${r.businessTin}</div>
      </div>

      <hr class="divider">

      <div class="meta-grid">
        <span>Receipt <strong>#${r.id}</strong></span>
        <span><strong>${dateStr}</strong> ${timeStr}</span>
      </div>
      <div class="meta-grid" style="margin-top:-8px">
        <span>Table <strong>${r.table}</strong></span>
        <span>Cashier <strong>${r.cashier}</strong></span>
      </div>

      <hr class="divider">

      <table class="items-table">
        <thead><tr><th>Item</th><th>Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="totals">
        <div class="row"><span>Subtotal</span><span>UGX ${r.subtotal.toLocaleString()}</span></div>
        <div class="row"><span>VAT (${Math.round(r.taxRate * 100)}%)</span><span>UGX ${r.tax.toLocaleString()}</span></div>
        <div class="total"><span>Total</span><span>UGX ${r.total.toLocaleString()}</span></div>
      </div>

      <div class="payment-info">
        Paid via <strong>${r.paymentMethod}</strong>
      </div>

      <div class="footer">
        Thank you for your visit!<br>
        Receipt is electronically generated
      </div>
    </div>
  </div>
</body>
</html>`);

  printWin.document.close();
  printWin.focus();

  const finishPrint = () => {
    printWin.close();
  };

  if (printWin.matchMedia) {
    const mediaQueryList = printWin.matchMedia("print");
    mediaQueryList.addEventListener("change", (mql) => {
      if (!mql.matches) finishPrint();
    });
  }

  setTimeout(() => {
    printWin.print();
  }, 300);
}
