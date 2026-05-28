import React from "react";
import CrudModule from "./CrudModule";

export default function Projects() {
  return (
    <CrudModule
      testIdPrefix="projects"
      title="Projects"
      endpoint="/projects"
      columns={[
        { k: "name", label: "Project" },
        { k: "status", label: "Status" },
        { k: "budget", label: "Budget", format: (v) => v ? `$${Number(v).toLocaleString()}` : "—" },
        { k: "start_date", label: "Start" },
      ]}
      fields={[
        { k: "name", label: "Project name" },
        { k: "description", label: "Description", type: "textarea" },
        { k: "status", label: "Status", type: "select", options: ["planning", "active", "on_hold", "completed"], default: "planning" },
        { k: "budget", label: "Budget (CAD)", type: "number", default: 0 },
        { k: "start_date", label: "Start date", type: "date" },
        { k: "end_date", label: "End date", type: "date" },
      ]}
    />
  );
}
