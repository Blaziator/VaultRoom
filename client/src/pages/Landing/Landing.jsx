import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUrl, getSession } from "../../lib/api";
import logo from "../../assets/logo.svg";
import fingerprint from "../../assets/fingerprint.svg";
import styles from "./Landing.module.css";

export default function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        navigate("/dashboard", { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  if (checking) return null;

  return (
    <main className={styles.wrapper}>
      <div className={styles.backgroundGlow} />

      <div className={styles.brand}>
        <img src={logo} className={styles.logo} alt="VaultRoom" /> <span>VaultRoom</span>
      </div>

      <section className={styles.hero}>
        <h1>
          Request documents
          <br />
          On your terms
        </h1>

        <p>
          Replace sharing sensitive documents over chat or email with
          <br className={styles.desktopBreak} />
          identity-bound, expiring, revocable access.
        </p>

        <a href={loginUrl} className={styles.loginLink}>
          <button className={styles.primaryButton} type="button">
            <img src={fingerprint} className={styles.fingerprint} alt="" aria-hidden="true" />
            <span>Continue with NamoID</span>
          </button>
        </a>
      </section>
    </main>
  );
}