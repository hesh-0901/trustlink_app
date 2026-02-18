import { db } from "./firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

/* ===============================
   SHA-256 Hash Function
================================ */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ===============================
   LOGIN EVENT
================================ */
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    showError("Veuillez remplir tous les champs.");
    return;
  }

  try {

    const passwordHash = await hashPassword(password);

    const q = query(
      collection(db, "users"),
      where("username", "==", username)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      showError("Utilisateur introuvable.");
      return;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    if (!userData.isActive) {
      showError("Compte désactivé.");
      return;
    }

    if (userData.passwordHash !== passwordHash) {
      showError("Mot de passe incorrect.");
      return;
    }

    // ✅ SESSION STORAGE
    localStorage.setItem("userId", userDoc.id);
    localStorage.setItem("username", userData.username);
    localStorage.setItem("role", userData.role);

    // ✅ Redirect
    window.location.href = "dashboard.html";

  } catch (error) {
    console.error(error);
    showError("Erreur interne.");
  }
});

/* ===============================
   Error Display
================================ */
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}
