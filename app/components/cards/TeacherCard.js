import Image from "next/image";
import PlaceholderMedia from "../PlaceholderMedia";
import styles from "./TeacherCard.module.css";

export default function TeacherCard({ name, role, photo, tone = "blue" }) {
  return (
    <div className={styles.card}>
      {photo ? (
        <div className={styles.photoFrame}>
          <Image
            src={photo}
            alt={name}
            width={400}
            height={400}
            className={styles.photo}
          />
        </div>
      ) : (
        <PlaceholderMedia caption={name} tone={tone} ratio="1:1" />
      )}
      <h3 className={styles.name}>{name}</h3>
      {role && <span className={styles.subject}>{role}</span>}
    </div>
  );
}
