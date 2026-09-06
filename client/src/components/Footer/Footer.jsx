import { useLocation } from "react-router-dom";
import styles from "./Footer.module.css";

export default function Footer() {
  const { pathname } = useLocation();

  if (pathname === "/") {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <span>
        Built on the{" "}
        <a href="https://namoid.in" target="_blank" rel="noreferrer">
          NamoID
        </a>{" "}
        identity platform for the NamoID Community Challenges program.
        Independent community build — not an official NamoID product or
        endorsement.
      </span>
    </footer>
  );
}