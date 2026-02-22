import { db } from "../js/firebase-init.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   GET USER SESSION
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
  } catch (err) {
    console.error(err);
    logout();
  }
});

/* ===============================
   INJECT DATA
================================ */
function injectUserData(data) {
  const firstName = data.firstName;
  const username = data.username;
  const gender = data.gender;

  document.getElementById("greetingDisplay").textContent =
    `Bonjour ${firstName}`;

  document.getElementById("usernameDisplay").textContent =
    username;

  generateAvatar(firstName, gender);
}

/* ===============================
   AVATAR GENERATOR
================================ */
function generateAvatar(name, gender) {
  const baseUrl = "https://api.dicebear.com/7.x/";

  const style =
    gender === "Femme"
      ? "adventurer-neutral"
      : "adventurer";

  const avatarUrl =
    `${baseUrl}${style}/svg?seed=${name}&backgroundColor=0f172a`;

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
  .addEventListener("click", logout);
