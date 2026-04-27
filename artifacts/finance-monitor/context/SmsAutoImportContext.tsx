import React, { createContext, useContext, type ReactNode } from "react";

import { useSmsAutoImport, type UseSmsAutoImportApi } from "@/hooks/useSmsAutoImport";

const SmsAutoImportContext = createContext<UseSmsAutoImportApi | null>(null);

export function SmsAutoImportProvider({ children }: { children: ReactNode }) {
  const api = useSmsAutoImport();
  return (
    <SmsAutoImportContext.Provider value={api}>
      {children}
    </SmsAutoImportContext.Provider>
  );
}

export function useSmsAutoImportContext(): UseSmsAutoImportApi {
  const ctx = useContext(SmsAutoImportContext);
  if (!ctx) {
    throw new Error(
      "useSmsAutoImportContext must be used inside SmsAutoImportProvider",
    );
  }
  return ctx;
}
