import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { Toaster } from "react-hot-toast";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" containerStyle={{ zIndex: 100000 }} />
      <Header />
      <main className="pt-16">
        <Outlet />{" "}
      </main>
    </div>
  );
};

export default MainLayout;