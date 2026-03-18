"use client";

import { Toaster } from "sonner";

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        duration: 3200,
        style: {
          borderRadius: "14px",
          border: "1px solid rgba(191, 152, 83, 0.25)",
          background:
            "linear-gradient(135deg, rgba(16,18,24,0.95), rgba(34,38,48,0.94))",
          color: "#f8fafc",
          boxShadow: "0 20px 40px rgba(0,0,0,0.32)",
          backdropFilter: "blur(10px)",
          fontFamily: "Inter, sans-serif",
        },
      }}
    />
  );
}
