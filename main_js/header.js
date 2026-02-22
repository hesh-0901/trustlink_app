import { db } from "../js/firebase-init.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   GET SESSION USER
================================ */
function getCurrentUserId() {
  return (
    localStorage.getItem("userId") ||
    sessionStorage.getItem("userId")
  );
}

/* ===============================
   LOAD USER DATA
================================ */
document.addEventListener("DOMContentLoaded", async () => {

  const userId = getCurrentUserId();

  if (!userId) {
    window.location.href = "/trustlink_app/index.html";
    return;
  }

  try {

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      logout();
      return;
    }

    const data = userSnap.data();

    injectUserData(data);

  } catch (error) {
    console.error("Header error:", error);
    logout();
  }

});

/* ===============================
   INJECT USER DATA
================================ */
function injectUserData(data) {

  document.getElementById("greetingDisplay").textContent =
    `Bonjour ${data.firstName}`;

  document.getElementById("usernameDisplay").textContent =
    data.username;

  generateAvatar(data.firstName, data.gender);

}

/* ===============================
   AVATAR GENERATION
================================ */
function generateAvatar(name, gender) {

  const style =
    gender === "Femme"
      ? "personas"
      : "adventurer";

  const avatarUrl =
    `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(name)}&size=128`;

  document.getElementById("userAvatar").src = avatarUrl;

}

/* ===============================
   LOGOUT
================================ */
function logout() {

  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  sessionStorage.clear();

  window.location.href = "/trustlink_app/index.html";

}

document
  .getElementById("logoutBtn")
  ?.addEventListener("click", logout);
