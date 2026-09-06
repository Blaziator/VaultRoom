import { useState } from "react";
import { api } from "../../lib/api";
import styles from "./CreateRoomModal.module.css";

const emptyCategory = () => ({ category: "", label: "", required: true, reason: "" });

export default function CreateRoomModal({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [categories, setCategories] = useState([emptyCategory()]);
  const [result, setResult] = useState(null); 
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const updateCategory = (index, field, value) => {
    setCategories((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addCategory = () => setCategories((prev) => [...prev, emptyCategory()]);
  const removeCategory = (index) => setCategories((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await api.post("/rooms", { title, categories });
      setResult(data); 
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <h2>Room created</h2>
          <p>Share both of these with the person you're requesting documents from — the code will not be shown again.</p>
          <div className={styles.codeBox}>{result.accessCode}</div>
          <div className={styles.linkBox}>{`${window.location.origin}/rooms/${result.roomId}`}</div>
          <button
            className={styles.primaryButton}
            onClick={() => {
              onCreated();
              onClose();
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <form className={styles.modal} onSubmit={handleSubmit}>
        <h2>Create room</h2>

        <label>Room title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} />

        <label>Documents needed</label>
        {categories.map((cat, i) => (
          <div key={i} className={styles.categoryRow}>
            <input
              placeholder="Category (e.g. Identity proof)"
              value={cat.category}
              onChange={(e) => updateCategory(i, "category", e.target.value)}
              required
            />
            <input
              placeholder="Label shown to the owner"
              value={cat.label}
              onChange={(e) => updateCategory(i, "label", e.target.value)}
              required
            />
            <textarea
              placeholder="Why you need this"
              value={cat.reason}
              onChange={(e) => updateCategory(i, "reason", e.target.value)}
              required
            />
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={cat.required}
                onChange={(e) => updateCategory(i, "required", e.target.checked)}
              />
              Required
            </label>
            {categories.length > 1 && (
              <button type="button" onClick={() => removeCategory(i)} className={styles.removeButton}>
                Remove
              </button>
            )}
          </div>
        ))}

        <button type="button" onClick={addCategory} className={styles.secondaryButton}>
          + Add another document
        </button>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.secondaryButton}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} className={styles.primaryButton}>
            {submitting ? "Creating..." : "Create room"}
          </button>
        </div>
      </form>
    </div>
  );
}