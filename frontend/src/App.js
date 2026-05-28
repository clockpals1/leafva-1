import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import PublicLayout from "./components/PublicLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Assistant from "./pages/Assistant";
import Contact from "./pages/Contact";
import Legal from "./pages/Legal";

import AdminLogin from "./pages/admin/Login";
import AdminLayout from "./pages/admin/Layout";
import Dashboard from "./pages/admin/Dashboard";
import Tickets from "./pages/admin/Tickets";
import Clients from "./pages/admin/Clients";
import Projects from "./pages/admin/Projects";
import Invoices from "./pages/admin/Invoices";
import Payments from "./pages/admin/Payments";
import Bookkeeping from "./pages/admin/Bookkeeping";
import Payroll from "./pages/admin/Payroll";
import PurchaseOrders from "./pages/admin/PurchaseOrders";
import EmailComposer from "./pages/admin/EmailComposer";
import Settings from "./pages/admin/Settings";

import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: "#1A1A1A",
            border: "1px solid rgba(212,175,55,0.3)",
            color: "#F3F4F6",
          },
        }}
      />
      <Routes>
        {/* Public site */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/legal/:doc" element={<Legal />} />
          <Route path="/legal" element={<Navigate to="/legal/privacy" replace />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="clients" element={<Clients />} />
          <Route path="projects" element={<Projects />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="payments" element={<Payments />} />
          <Route path="bookkeeping" element={<Bookkeeping />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="purchase-orders" element={<PurchaseOrders />} />
          <Route path="email" element={<EmailComposer />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
