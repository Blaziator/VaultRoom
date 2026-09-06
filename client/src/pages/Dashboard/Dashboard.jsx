import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import CreateRoomModal from "../../components/CreateRoomModal/CreateRoomModal";
import logo from "../../assets/logo.svg"
import styles from "./Dashboard.module.css";

function RoomCard({ room }) {
  const isClaimed = Boolean(room.ownerId);

  return (
    <Link to={`/rooms/${room.publicId}`} className={styles.card}>
      <div className={styles.cardMain}>
        <span className={styles.roomIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M5 4.75A1.75 1.75 0 0 1 6.75 3h7.5L19 7.75v11.5A1.75 1.75 0 0 1 17.25 21h-10.5A1.75 1.75 0 0 1 5 19.25V4.75Z" />
            <path d="M14 3v5h5M8.5 13h7M8.5 16.5h5" />
          </svg>
        </span>

        <div>
          <span className={styles.cardTitle}>{room.title}</span>
          <span className={styles.cardSubtitle}>
            Secure document request room
          </span>
        </div>
      </div>

      <div className={styles.cardMeta}>
        <span
          className={`${styles.status} ${
            isClaimed ? styles.claimed : styles.awaiting
          }`}
        >
          <span className={styles.statusDot} />
          {isClaimed ? "Claimed" : "Awaiting owner"}
        </span>
        <span className={styles.arrow} aria-hidden="true">→</span>
      </div>
    </Link>
  );
}

function RoomSection({ title, description, rooms, emptyMessage }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {rooms.length > 0 && (
          <span className={styles.roomCount}>
            {rooms.length} {rooms.length === 1 ? "room" : "rooms"}
          </span>
        )}
      </div>

      {rooms.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">⌁</span>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {rooms.map((room) => (
            <RoomCard key={room.publicId} room={room} />
          ))}
        </div>
      )}
    </section>
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

  if (error) {
    return <p className={styles.feedback}>Unable to load rooms: {error}</p>;
  }

  if (!data) {
    return <p className={styles.feedback}>Loading your rooms…</p>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.siteHeader}>
        <Link to="/dashboard" className={styles.brand} aria-label="VaultRoom dashboard">
          <img src={logo} className={styles.logo} alt="VaultRoom" />
          <section className={styles.logoName}>VaultRoom</section>
        </Link>

        <button
          className={styles.primaryButton}
          onClick={() => setShowModal(true)}
        >
          <span aria-hidden="true">+</span>
          Create room
        </button>
      </header>

      <main className={styles.content}>

        <RoomSection
          title="Rooms I created"
          description="Manage requests and control document access."
          rooms={data.created}
          emptyMessage="You have not created a document room yet."
        />

        <RoomSection
          title="Shared with me"
          description="Rooms where someone has requested your documents."
          rooms={data.shared}
          emptyMessage="No document rooms have been shared with you yet."
        />
      </main>

      {showModal && (
        <CreateRoomModal
          onClose={() => setShowModal(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}