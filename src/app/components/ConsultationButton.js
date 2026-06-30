"use client";

import Button from "./Button";
import { useConsultation } from "./ConsultationProvider";

/**
 * The persistent "Book a Free Consultation" call-to-action.
 * Opens the shared consultation modal, optionally pre-selecting
 * an audience (e.g. "child", "teen", "adult", "company").
 */
/**
 * @param {{ audience?: string, children?: import("react").ReactNode, onClick?: (e: import("react").MouseEvent) => void, [key: string]: any }} props
 */
export default function ConsultationButton({ audience, children, onClick, ...rest }) {
  const { open, dict } = useConsultation();

  const handleClick = (e) => {
    open(audience);
    onClick?.(e);
  };

  return (
    <Button onClick={handleClick} {...rest}>
      {children || dict.common.buttons.bookConsultation}
    </Button>
  );
}
