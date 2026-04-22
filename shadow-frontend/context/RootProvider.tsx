import React from "react";
import { SessionProvider } from "./session";
import { ThemeProvider } from "./theme";

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
