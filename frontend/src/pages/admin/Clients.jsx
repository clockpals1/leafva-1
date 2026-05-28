import React from "react";
import CrudModule from "./CrudModule";

export default function Clients() {
  return (
    <CrudModule
      testIdPrefix="clients"
      title="Clients (CRM)"
      endpoint="/clients"
      columns={[
        { k: "name", label: "Name" },
        { k: "company", label: "Company" },
        { k: "email", label: "Email" },
        { k: "phone", label: "Phone" },
        { k: "status", label: "Status" },
      ]}
      fields={[
        { k: "name", label: "Full name" },
        { k: "company", label: "Company" },
        { k: "email", label: "Email", type: "email" },
        { k: "phone", label: "Phone" },
        { k: "address", label: "Address" },
        { k: "status", label: "Status", type: "select", options: ["lead", "active", "inactive"], default: "lead" },
        { k: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
