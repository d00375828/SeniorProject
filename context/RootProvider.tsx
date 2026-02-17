import React from "react";
import { AuthProvider } from "./auth";
import { ProfileProvider } from "./profile";
import { RecordingsProvider } from "./recordings";
import { ThemeProvider } from "./theme";

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <RecordingsProvider>{children}</RecordingsProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
