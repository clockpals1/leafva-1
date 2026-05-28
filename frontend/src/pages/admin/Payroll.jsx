import React from "react";
import CrudModule from "./CrudModule";

export default function Payroll() {
  return (
    <CrudModule
      testIdPrefix="payroll"
      title="Payroll & Staff"
      endpoint="/employees"
      columns={[
        { k: "name", label: "Name" },
        { k: "role", label: "Role" },
        { k: "email", label: "Email" },
        { k: "salary", label: "Salary (CAD)", format: (v) => v ? `$${Number(v).toLocaleString()}` : "—" },
        { k: "status", label: "Status" },
      ]}
      fields={[
        { k: "name", label: "Full name" },
        { k: "email", label: "Email", type: "email" },
        { k: "role", label: "Role", default: "Technician" },
        { k: "salary", label: "Annual salary (CAD)", type: "number", default: 0 },
        { k: "status", label: "Status", type: "select", options: ["active", "on_leave", "terminated"], default: "active" },
        { k: "hire_date", label: "Hire date", type: "date" },
      ]}
    />
  );
}
