import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { formatDate, formatTime, today } from "./helpers";

export function exportToExcel(bills, filterLabel) {
  const rows = [];
  bills.forEach((bill) => {
    bill.items?.forEach((item) => {
      rows.push({
        "Bill ID": bill.id,
        Date: formatDate(bill.date),
        Time: formatTime(bill.date),
        Customer: bill.customer?.name || "-",
        Phone: bill.customer?.phone || "-",
        Payment: bill.paymentMode || "CASH",
        Item: item.name,
        Category: item.category || "-",
        Unit: item.unit,
        Qty: item.qty,
        "Price (₹)": item.price,
        "Item Total (₹)": item.total,
        "Bill Subtotal (₹)": bill.subtotal,
        "Discount %": bill.discountPct || 0,
        "Discount Amt (₹)": bill.discountAmt || 0,
        "Bill Total (₹)": bill.total,
        "Profit (₹)": bill.profit,
      });
    });
  });

  const summary = [
    {
      "": "SUMMARY",
      "Total Bills": bills.length,
      "Total Sales (₹)": bills.reduce((s, b) => s + b.total, 0).toFixed(2),
      "Total Profit (₹)": bills.reduce((s, b) => s + b.profit, 0).toFixed(2),
      "Cash Sales (₹)": bills
        .filter((b) => (b.paymentMode || "CASH") === "CASH")
        .reduce((s, b) => s + b.total, 0)
        .toFixed(2),
      "UPI Sales (₹)": bills
        .filter((b) => b.paymentMode === "UPI")
        .reduce((s, b) => s + b.total, 0)
        .toFixed(2),
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(rows);
  const ws2 = XLSX.utils.json_to_sheet(summary);

  ws1["!cols"] = [
    { wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 14 },
    { wch: 8 },  { wch: 16 }, { wch: 10 }, { wch: 8 },  { wch: 8 },
    { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 },
    { wch: 12 }, { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, "Bills Detail");
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([buf], { type: "application/octet-stream" }),
    `ManishDairy_${filterLabel}_${today()}.xlsx`
  );
}