import { db } from "../js/firebase-init.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   SESSION
================================ */
function getCurrentUserId() {
  return (
    localStorage.getItem("userId") ||
    sessionStorage.getItem("userId")
  );
}

/* ===============================
   LOAD USER
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

    const user = userSnap.data();

    injectUser(user);

  } catch (error) {
    console.error("Header error:", error);
    logout();
  }

});

/* ===============================
   INJECT DATA
================================ */
function injectUser(user) {

  document.getElementById("firstNameDisplay").textContent =
    user.firstName;

  document.getElementById("usernameDisplay").textContent =
    user.username;

  generateAvatar(user);

}

/* ===============================
   AVATAR DYNAMIQUE
================================ */
function generateAvatar(user) {

  const seed = user.firstName + user.username;

  const style =
    user.gender === "Femme"
      ? "personas"
      : "adventurer";

  const avatarUrl =
    `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(seed)}&size=128`;

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
