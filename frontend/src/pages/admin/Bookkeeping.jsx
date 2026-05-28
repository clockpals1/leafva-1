import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import CrudModule from "./CrudModule";

export default function Bookkeeping() {
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  useEffect(() => { api.get("/bookkeeping/summary").then(r => setSummary(r.data)); }, []);

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Box label="Income" v={`$${summary.income.toFixed(2)}`} pos />
        <Box label="Expense" v={`$${summary.expense.toFixed(2)}`} neg />
        <Box label="Net" v={`$${summary.net.toFixed(2)}`} accent />
      </div>
      <CrudModule
        testIdPrefix="bookkeeping"
        title="Bookkeeping Ledger"
        endpoint="/bookkeeping"
        columns={[
          { k: "date", label: "Date", format: (v) => v ? new Date(v).toLocaleDateString() : "—" },
          { k: "type", label: "Type" },
          { k: "category", label: "Category" },
          { k: "amount", label: "Amount", format: (v) => `$${Number(v).toFixed(2)}` },
          { k: "description", label: "Description" },
        ]}
        fields={[
          { k: "type", label: "Type", type: "select", options: ["income", "expense"], default: "expense" },
          { k: "category", label: "Category", default: "general" },
          { k: "amount", label: "Amount (CAD)", type: "number", default: 0 },
          { k: "description", label: "Description" },
          { k: "reference", label: "Reference (receipt/invoice #)" },
          { k: "date", label: "Date", type: "date" },
        ]}
      />
    </div>
  );
}

function Box({ label, v, pos, neg, accent }) {
  const color = pos ? "text-emerald-400" : neg ? "text-red-400" : accent ? "text-gold" : "text-white";
  return (
    <div className="rounded-xl border border-subtle bg-leafva-card p-5">
      <div className="text-[10px] uppercase tracking-widest text-muted-leaf">{label}</div>
      <div className={`font-display text-2xl mt-2 ${color}`}>{v}</div>
    </div>
  );
}
