import { useState } from "react";

/**
 * Shared hook for responsive sidebar state.
 * Returns { sidebarOpen, openSidebar, closeSidebar }
 */
export function useSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return {
    sidebarOpen,
    openSidebar: () => setSidebarOpen(true),
    closeSidebar: () => setSidebarOpen(false),
  };
}
