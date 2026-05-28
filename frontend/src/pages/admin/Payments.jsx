import React from "react";
import CrudModule from "./CrudModule";

export default function Payments() {
  return (
    <CrudModule
      testIdPrefix="payments"
      title="Payments"
      endpoint="/payments"
      columns={[
        { k: "amount", label: "Amount", format: (v) => `$${Number(v).toFixed(2)}` },
        { k: "method", label: "Method" },
        { k: "reference", label: "Reference" },
        { k: "invoice_id", label: "Invoice" },
        { k: "received_at", label: "Received", format: (v) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
      fields={[
        { k: "amount", label: "Amount (CAD)", type: "number", default: 0 },
        { k: "method", label: "Method", type: "select", options: ["bank_transfer", "etransfer", "cheque", "credit_card", "cash"], default: "bank_transfer" },
        { k: "invoice_id", label: "Invoice ID (optional)" },
        { k: "client_id", label: "Client ID (optional)" },
        { k: "reference", label: "Reference / memo" },
        { k: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
