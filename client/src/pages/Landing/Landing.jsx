import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUrl, getSession } from "../../lib/api";
import styles from "./Landing.module.css";

export default function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getSession().then((session) => {
      if (session) navigate("/dashboard", { replace: true });
      else setChecking(false);
    });
  }, [navigate]);

  if (checking) return null; 

  return (
    <main className={styles.wrapper}>
      <div className={styles.content}>
        <h1>VaultRoom</h1>
        <p>Request and share documents with identity-bound, expiring, revocable access — not chat or email.</p>
        <a href={loginUrl}>
          <button className={styles.primaryButton}>Continue with NamoID</button>
        </a>
      </div>
    </main>
  );
}