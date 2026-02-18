import { db } from "../js/firebase-init.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");
const rememberCheckbox = document.getElementById("rememberMe");

/* ===============================
   DISABLE BROWSER AUTOFILL
================================ */
document.getElementById("phone").setAttribute("autocomplete", "off");
document.getElementById("password").setAttribute("autocomplete", "new-password");

/* ===============================
   HASH WITH SALT
================================ */
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
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
  const rememberMe = rememberCheckbox.checked;

  if (!phoneNumber || !password) {
    return showError("Veuillez remplir tous les champs.");
  }

  try {

    const userRef = doc(db, "users", phoneNumber);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return showError("Utilisateur introuvable.");
    }

    const userData = userSnap.data();

    if (!userData.isActive) {
      return showError("Compte désactivé.");
    }

    const hashedInput = await hashPassword(password, userData.salt);

    if (hashedInput !== userData.passwordHash) {
      return showError("Mot de passe incorrect.");
    }

    // ===============================
    // SESSION CONTROL
    // ===============================

    if (rememberMe) {
      localStorage.setItem("userId", phoneNumber);
      localStorage.setItem("role", userData.role);
    } else {
      sessionStorage.setItem("userId", phoneNumber);
      sessionStorage.setItem("role", userData.role);
    }

    window.location.href = "/trustlink_app/public/dashboard.html";

  } catch (err) {
    console.error(err);
    showError("Erreur interne.");
  }
});

/* ===============================
   ERROR DISPLAY
================================ */
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}
