import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Nav from "./Nav";
import Footer from "./Footer";
import ChatDock from "./ChatDock";

export default function PublicLayout() {
  const { pathname } = useLocation();
  const hideDock = pathname.startsWith("/assistant") || pathname.startsWith("/contact");

  return (
    <div className="min-h-screen flex flex-col bg-leafva-bg">
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {!hideDock && <ChatDock />}
    </div>
  );
}
