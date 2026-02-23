import { db } from "../js/firebase-init.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

(async function initHeader() {

  try {

    /* ===============================
       SESSION CHECK
    ================================= */

    const userId =
      localStorage.getItem("userId") ||
      sessionStorage.getItem("userId");

    if (!userId) {
      window.location.href = "/trustlink_app/index.html";
      return;
    }

    /* ===============================
       FETCH USER
    ================================= */

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/trustlink_app/index.html";
      return;
    }

    const userData = userSnap.data();
    onSnapshot(userRef, (snap) => {

  if (!snap.exists()) return;

  const updatedUser = snap.data();

  if (avatarEl && updatedUser.avatarImage) {

    avatarEl.src =
      "/trustlink_app/assets/avatars/" +
      updatedUser.avatarImage;

    localStorage.setItem(
      "userAvatar",
      updatedUser.avatarImage
    );
  }

});

    /* ===============================
       INJECT USER DATA
    ================================= */

    const firstNameEl = document.getElementById("user-firstname");
    const usernameEl = document.getElementById("user-username");
    const avatarEl = document.getElementById("user-avatar");

    if (firstNameEl) firstNameEl.textContent = userData.firstName;
    if (usernameEl) usernameEl.textContent = userData.username;

/* ===============================
    AVATAR (NOUVEAU - STYLE CORPORATE)
================================= */
/* ===============================
   AVATAR (SYSTÈME INTERNE PRIORITAIRE)
================================= */

const AVATAR_PATH =
  "/trustlink_app/assets/avatars/";

if (avatarEl) {

  if (userData.avatarImage) {

    // Avatar interne enregistré en Firestore
    avatarEl.src =
      AVATAR_PATH + userData.avatarImage;

    // On met aussi en cache local
    localStorage.setItem(
      "userAvatar",
      userData.avatarImage
    );

  } else {

    // Fallback Dicebear
    const avatarStyle = "avataaars-neutral";

    const avatarUrl =
      `https://api.dicebear.com/7.x/${avatarStyle}/svg?` +
      `seed=${encodeURIComponent(userData.username)}` +
      `&radius=50`;

    avatarEl.src = avatarUrl;

    avatarEl.onerror = () => {
      avatarEl.src =
        "https://api.dicebear.com/7.x/initials/svg?seed=" +
        encodeURIComponent(userData.firstName);
    };
  }
}

    /* ===============================
       REAL-TIME NOTIFICATIONS
    ================================= */

    const badge = document.getElementById("notification-badge");

    if (badge) {

      const transactionsRef = collection(db, "transactions");

      const q = query(
        transactionsRef,
        where("participants", "array-contains", userId)
      );

      onSnapshot(q, (snapshot) => {

        const count = snapshot.size;

        if (count > 0) {
          badge.textContent = count > 9 ? "9+" : count;
          badge.classList.remove("hidden");
        } else {
          badge.classList.add("hidden");
        }

      });
    }

    /* ===============================
       LOGOUT
    ================================= */

    const logoutBtn = document.getElementById("logout-btn");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {

        localStorage.removeItem("userId");
        localStorage.removeItem("role");

        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("role");

        window.location.href = "/trustlink_app/index.html";

      });
    }

  } catch (error) {

    console.error("Header error:", error);

  }

})();
