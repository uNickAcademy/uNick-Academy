"use client";

import { useState } from "react";
import Reveal from "../Reveal";
import { useConsultation } from "../ConsultationProvider";
import TeacherCard from "./TeacherCard";
import TeacherBioModal from "./TeacherBioModal";

export default function TeacherGrid({ teachers, dict, cardGridClassName }) {
  const { open } = useConsultation();
  const [openTeacherName, setOpenTeacherName] = useState(null);

  const handleBook = (teacherName) => {
    setOpenTeacherName(null);
    open(null, teacherName);
  };

  const openTeacher = teachers.find((teacher) => teacher.name === openTeacherName) || null;

  return (
    <>
      <div className={cardGridClassName}>
        {teachers.map((teacher, i) => (
          <Reveal as="div" key={teacher.name} delay={Math.min(i * 60, 300)}>
            <TeacherCard
              {...teacher}
              bookLabel={dict.common.buttons.bookLesson || "Book a lesson"}
              onBook={handleBook}
              onPhotoClick={setOpenTeacherName}
            />
          </Reveal>
        ))}
      </div>
      {openTeacher && (
        <TeacherBioModal
          teacher={openTeacher}
          t={dict.meetUs.team}
          bookLabel={dict.common.buttons.bookLesson || "Book a lesson"}
          onBook={handleBook}
          onClose={() => setOpenTeacherName(null)}
        />
      )}
    </>
  );
}
