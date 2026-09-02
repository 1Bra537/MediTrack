"use client";

import "./lib/amplify-config";
import { ToastProvider } from "./components/Toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}