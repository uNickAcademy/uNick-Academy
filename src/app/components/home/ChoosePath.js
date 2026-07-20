import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";
import PathCard from "../cards/PathCard";
import styles from "./ChoosePath.module.css";

const PATHS = [
  { key: "children", href: "/children", tone: "red", src: "/photos/lekcje/dzieci.jpg" },
  { key: "teenagers", href: "/teenagers", tone: "blue", src: "/photos/lekcje/mlodziez.jpg" },
  { key: "adults", href: "/adults", tone: "cream", src: "/photos/lekcje/dorosli.jpg" },
  { key: "companies", href: "/companies", tone: "sand", src: "/photos/lekcje/firmy.jpg" },
];

export default function ChoosePath({ dict, locale }) {
  const t = dict.home.choosePath;

  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
        <div className={styles.grid}>
          {PATHS.map((path, i) => (
            <Reveal as="div" key={path.key} delay={i * 70}>
              <PathCard
                {...t.paths[path.key]}
                href={`/${locale}${path.href}`}
                tone={path.tone}
                src={path.src}
                exploreLabel={dict.common.buttons.explore}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
