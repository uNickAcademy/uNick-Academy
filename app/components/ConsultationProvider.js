"use client";

import { createContext, useCallback, useContext, useState } from "react";
import ConsultationModal from "./ConsultationModal";

const ConsultationContext = createContext({
  open: () => {},
  close: () => {},
  isOpen: false,
  audience: undefined,
});

/**
 * Provides a single, site-wide "Book a Free Consultation" modal.
 * Wrap the app once (in the root layout) and call `open()` from
 * any client component to launch it — optionally pre-selecting
 * the audience (children / teenagers / adults / companies).
 */
export function ConsultationProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [audience, setAudience] = useState(undefined);

  const open = useCallback((preselectAudience) => {
    setAudience(preselectAudience);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return (
    <ConsultationContext.Provider value={{ open, close, isOpen, audience }}>
      {children}
      <ConsultationModal isOpen={isOpen} onClose={close} audience={audience} />
    </ConsultationContext.Provider>
  );
}

export function useConsultation() {
  return useContext(ConsultationContext);
}
