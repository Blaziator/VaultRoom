import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import CreateRoomModal from "../../components/CreateRoomModal/CreateRoomModal";
import styles from "./Dashboard.module.css";

function RoomCard({ room }) {
  return (
    <Link to={`/rooms/${room.publicId}`} className={styles.card}>
      <span className={styles.cardTitle}>{room.title}</span>
      <span className={styles.cardStatus}>{room.ownerId ? "Claimed" : "Awaiting owner"}</span>
    </Link>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(() => {
    api.get("/rooms").then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  if (error) return <p>Error: {error}</p>;
  if (!data) return <p>Loading...</p>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>VaultRoom</h1>
        <button className={styles.primaryButton} onClick={() => setShowModal(true)}>
          + Create room
        </button>
      </div>

      <section>
        <h2>Rooms I created</h2>
        {data.created.length === 0 ? (
          <p className={styles.empty}>No rooms yet.</p>
        ) : (
          <div className={styles.grid}>
            {data.created.map((r) => (
              <RoomCard key={r.publicId} room={r} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Shared with me</h2>
        {data.shared.length === 0 ? (
          <p className={styles.empty}>Nothing shared with you yet.</p>
        ) : (
          <div className={styles.grid}>
            {data.shared.map((r) => (
              <RoomCard key={r.publicId} room={r} />
            ))}
          </div>
        )}
      </section>

      {showModal && <CreateRoomModal onClose={() => setShowModal(false)} onCreated={load} />}
    </div>
  );
}