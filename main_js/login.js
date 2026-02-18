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
   SHA-256 Hash
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
   LOGIN
================================ */
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const phoneNumber = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!phoneNumber || !password) {
    showError("Veuillez remplir tous les champs.");
    return;
  }

  try {

    const passwordHash = await hashPassword(password);

    const q = query(
      collection(db, "users"),
      where("phoneNumber", "==", phoneNumber)
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

    // ✅ SESSION
    localStorage.setItem("userId", userDoc.id);
    localStorage.setItem("role", userData.role);
    localStorage.setItem("phoneNumber", userData.phoneNumber);

    // ✅ Redirect
    window.location.href = "dashboard.html";

  } catch (error) {
    console.error(error);
    showError("Erreur interne.");
  }
});

/* ===============================
   ERROR
================================ */
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}
