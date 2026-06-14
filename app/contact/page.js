import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import PlaceholderMedia from "../components/PlaceholderMedia";
import UNickorn from "../components/UNickorn";
import ContactForm from "../components/ContactForm";
import { siteConfig, platformLinks } from "../lib/site-config";
import styles from "../components/sections.module.css";

export const metadata = {
  title: "Contact",
  description:
    "Get in touch with uNick Academy. Tell us who you are and we'll help you find the right programme — for you, your child, or your team.",
};

const FAQS = [
  {
    title: "How do I get started?",
    text: "Book a free consultation through this page or the button in the menu. We'll have a relaxed conversation about you (or your child, or your team) and suggest where you'd fit best.",
  },
  {
    title: "Online or in person?",
    text: "Both — whichever suits you. Many of our students mix the two depending on the week.",
  },
  {
    title: "What ages do you teach?",
    text: "Children, teenagers, adults and companies. Each programme has its own approach, but the same philosophy underneath.",
  },
  {
    title: "My child doesn't fit a 'normal' classroom. Is this still for them?",
    text: "That's exactly who we're for. Many of our students — children and adults — never felt comfortable in traditional education.",
  },
  {
    title: "How much does it cost?",
    text: "It depends on the programme and format. We'll talk through options that fit your goals and budget during your free consultation.",
  },
  {
    title: "I'm already a student — where do I log in?",
    text: "Use the Student Login link in the menu or footer to access your existing account. Nothing has changed there.",
  },
];

export default function ContactPage() {
  return (
    <>
      <div className={`container ${styles.hero}`}>
        <Reveal as="div">
          <span className="eyebrow">Contact</span>
          <h1 className={styles.title}>
            Tell us who you are. <span className={styles.accent}>We&rsquo;ll help you find your people.</span>
          </h1>
          <p className={styles.subtitle}>
            Whether you&rsquo;re curious for yourself, your child, or your whole team — start with a message.
            No forms in triplicate, no sales pressure. Just a real conversation.
          </p>
        </Reveal>
        <Reveal as="div" delay={120} className={styles.media}>
          <PlaceholderMedia tone="red" ratio="4:3" caption="A warm welcome — the academy's front door" />
          <UNickorn variant="sign" signText="Hello!" size={64} className={styles.unicornCorner} float />
        </Reveal>
      </div>

      <section className="section">
        <div className={`container ${styles.split}`}>
          <Reveal as="div">
            <ContactForm />
          </Reveal>

          <Reveal as="div" delay={100} className={styles.copy}>
            <span className="eyebrow">Other ways to reach us</span>
            <h2>Email, follow, or just say hello</h2>
            <p>
              Prefer email? Write to{" "}
              <a href={`mailto:${siteConfig.email}`} style={{ color: "var(--color-red)", fontWeight: 700 }}>
                {siteConfig.email}
              </a>{" "}
              and we&rsquo;ll get back to you within a day or two.
            </p>
            <p>
              You can also find us on{" "}
              <a href={siteConfig.social.instagram} target="_blank" rel="noreferrer" style={{ color: "var(--color-red)", fontWeight: 700 }}>
                Instagram
              </a>{" "}
              and{" "}
              <a href={siteConfig.social.facebook} target="_blank" rel="noreferrer" style={{ color: "var(--color-red)", fontWeight: 700 }}>
                Facebook
              </a>{" "}
              for stories, small wins and the occasional uNickorn sighting.
            </p>
            <p>
              Already part of the academy?{" "}
              <a href={platformLinks.studentLogin.href} style={{ color: "var(--color-blue)", fontWeight: 700 }}>
                {platformLinks.studentLogin.label}
              </a>{" "}
              keeps working exactly as before.
            </p>
            <PlaceholderMedia tone="sand" ratio="3:2" caption="Location — map / studio placeholder" />
          </Reveal>
        </div>
      </section>

      <section className={`section ${styles.altSection}`}>
        <div className="container">
          <SectionHeading eyebrow="Good to know" title="Frequently asked questions" />
          <div className={styles.cardGrid}>
            {FAQS.map((item) => (
              <div key={item.title} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
