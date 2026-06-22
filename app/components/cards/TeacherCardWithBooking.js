"use client";

import { useConsultation } from "../ConsultationProvider";
import TeacherCard from "./TeacherCard";

export default function TeacherCardWithBooking({ bookLabel, ...props }) {
  const { open } = useConsultation();

  function handleBook(teacherName) {
    open(null, teacherName);
  }

  return <TeacherCard {...props} bookLabel={bookLabel} onBook={handleBook} />;
}
