import { useState } from "react";
import { api } from "../../lib/api";
import styles from "./AccessCodeForm.module.css";

export default function AccessCodeForm({ roomId, onClaimed }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post(`/rooms/${roomId}/claim`, { accessCode: code });
      onClaimed();
    } catch {
      setError("Invalid code or room.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Enter your access code</h2>
        <p>The person who shared this link should have sent you a short code separately.</p>
        <input
          className={styles.codeInput}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="XXXX-XXXX"
          required
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={submitting} className={styles.primaryButton}>
          {submitting ? "Checking..." : "Continue"}
        </button>
      </form>
    </div>
  );
}