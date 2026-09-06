import { useState } from "react";
import { api } from "../../lib/api";
import styles from "./DocumentCategoryCard.module.css";

function statusFor(grant) {
  if (!grant) return { label: "Pending", cls: "pending" };
  if (grant.revokedAt) return { label: "Revoked", cls: "revoked" };
  if (new Date(grant.expiresAt) < new Date()) return { label: "Expired", cls: "expired" };
  return { label: "Verified", cls: "verified" };
}

export default function DocumentCategoryCard({ roomId, request, grant, isOwner, onChange }) {
  const [file, setFile] = useState(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const status = statusFor(grant);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !expiresAt) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("expiresAt", new Date(expiresAt).toISOString());

    try {
      const res = await fetch(`/api/rooms/${roomId}/requests/${request.publicId}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData, 
      });
      if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRevoke = async () => {
    await api.patch(`/rooms/${roomId}/grants/${grant.publicId}/revoke`);
    onChange();
  };

  const handleView = () => window.open(`/api/rooms/${roomId}/grants/${grant.publicId}/download?mode=inline`, "_blank");
  const handleDownload = () => window.open(`/api/rooms/${roomId}/grants/${grant.publicId}/download`, "_blank");

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.label}>{request.label}</span>
        <span className={request.required ? styles.required : styles.optional}>
          {request.required ? "Required" : "Optional"}
        </span>
      </div>
      <p className={styles.reason}>{request.reason}</p>

      <div className={`${styles.statusBadge} ${styles[status.cls]}`}>{status.label}</div>

      {grant && (
        <div className={styles.grantInfo}>
          <span className={styles.filename}>{grant.filename}</span>
          <span className={styles.expiry}>
            {grant.revokedAt ? "Revoked" : `Expires ${new Date(grant.expiresAt).toLocaleDateString()}`}
          </span>
        </div>
      )}

      {isOwner && !grant && (
        <form onSubmit={handleUpload} className={styles.uploadForm}>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
          <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} required />
          <button type="submit" disabled={uploading} className={styles.primaryButton}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      )}
      {isOwner && grant && !grant.revokedAt && (
        <button onClick={handleRevoke} className={styles.revokeButton}>Revoke access</button>
      )}

      {!isOwner && grant && !grant.revokedAt && new Date(grant.expiresAt) > new Date() && (
        <div className={styles.actions}>
          <button onClick={handleView} className={styles.secondaryButton}>View</button>
          <button onClick={handleDownload} className={styles.secondaryButton}>Download</button>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}