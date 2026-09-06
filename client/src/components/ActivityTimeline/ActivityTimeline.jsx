import styles from "./ActivityTimeline.module.css";

const describe = (event) => {
  const who = event.actor === "you" ? "You" : "The other party";
  const verbs = {
    created: "created the room",
    claimed: "claimed the room",
    uploaded: "uploaded a document",
    viewed: "viewed a document",
    downloaded: "downloaded a document",
    revoked: "revoked access to a document",
  };
  return `${who} ${verbs[event.type] || event.type}`;
};

export default function ActivityTimeline({ events }) {
  if (!events?.length) return <p className={styles.empty}>No activity yet.</p>;

  return (
    <ul className={styles.list}>
      {events.map((e, i) => (
        <li key={i} className={styles.item}>
          <span className={styles.time}>{new Date(e.timestamp).toLocaleString()}</span>
          <span>{describe(e)}</span>
        </li>
      ))}
    </ul>
  );
}