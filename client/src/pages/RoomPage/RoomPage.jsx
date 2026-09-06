import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api, loginUrl } from "../../lib/api";
import AccessCodeForm from "../../components/AccessCodeForm/AccessCodeForm";
import DocumentCategoryCard from "../../components/DocumentCategoryCard/DocumentCategoryCard";
import ActivityTimeline from "../../components/ActivityTimeline/ActivityTimeline";
import styles from "./RoomPage.module.css";

export default function RoomPage() {
  const { roomId } = useParams();
  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState(null);
  const [showCollapsed, setShowCollapsed] = useState(false);

  const load = useCallback(async () => {
    try {
      const room = await api.get(`/rooms/${roomId}`);
      setData(room);
      if (room.status === "active") {
        const events = await api.get(`/rooms/${roomId}/timeline`);
        setTimeline(events);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [roomId]);

  useEffect(() => { load(); }, [load]);

  if (error === "Not authenticated") {
    return (
      <div className={styles.centered}>
        <h2>You've been invited to a document request</h2>
        <a href={loginUrl}><button className={styles.primaryButton}>Continue with NamoID</button></a>
      </div>
    );
  }

  if (error) return <div className={styles.centered}><p>{error}</p></div>;
  if (!data) return <p>Loading...</p>;

  if (data.status === "unclaimed") {
    return <AccessCodeForm roomId={roomId} onClaimed={load} />;
  }

  const grantsByRequest = Object.fromEntries(data.grants.map((g) => [g.requestId, g]));

  return (
    <div className={styles.page}>
      <h1>{data.room.title}</h1>
      <p className={styles.roleTag}>{data.room.isOwner ? "You are the document owner" : "You requested these documents"}</p>

      <div className={styles.checklist}>
        {data.requests.map((req) => (
          <DocumentCategoryCard
            key={req.publicId}
            roomId={roomId}
            request={req}
            grant={grantsByRequest[req._id]}
            isOwner={data.room.isOwner}
            onChange={load}
          />
        ))}
      </div>

      <div className={styles.timelineSection}>
        <button className={styles.toggle} onClick={() => setShowCollapsed((s) => !s)}>
          {showCollapsed ? "Hide" : "Show"} activity
        </button>
        {showCollapsed && <ActivityTimeline events={timeline} />}
      </div>
    </div>
  );
}