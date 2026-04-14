import React, { createContext, useContext, useState } from "react";

type ModeContextType = {
  isOnline: boolean;
  setIsOnline: (val: boolean) => void;
};

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(false); // Default to Offline (Mock Data)
  return (
    <ModeContext.Provider value={{ isOnline, setIsOnline }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) throw new Error("useMode must be used within ModeProvider");
  return context;
}