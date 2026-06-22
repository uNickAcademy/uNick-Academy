"use client";

import { createContext, useCallback, useContext, useState } from "react";
import ConsultationModal from "./ConsultationModal";
import { getDictionary } from "../lib/dictionaries";

const ConsultationContext = createContext({
  open: () => {},
  close: () => {},
  isOpen: false,
  audience: undefined,
  dict: getDictionary("en"),
});

/**
 * Provides a single, site-wide "Book a Free Consultation" modal.
 * Wrap the app once (in the root layout) and call `open()` from
 * any client component to launch it — optionally pre-selecting
 * the audience (children / teenagers / adults / companies).
 */
export function ConsultationProvider({ children, locale }) {
  const [isOpen, setIsOpen] = useState(false);
  const [audience, setAudience] = useState(undefined);
  const [teacher, setTeacher] = useState(undefined);
  const dict = getDictionary(locale);

  const open = useCallback((preselectAudience, preselectTeacher) => {
    setAudience(preselectAudience);
    setTeacher(preselectTeacher);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return (
    <ConsultationContext.Provider value={{ open, close, isOpen, audience, teacher, dict }}>
      {children}
      <ConsultationModal isOpen={isOpen} onClose={close} audience={audience} teacher={teacher} dict={dict} />
    </ConsultationContext.Provider>
  );
}

export function useConsultation() {
  return useContext(ConsultationContext);
}
