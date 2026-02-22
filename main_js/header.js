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

    /* ===============================
       INJECT USER DATA
    ================================= */

    const firstNameEl = document.getElementById("user-firstname");
    const usernameEl = document.getElementById("user-username");
    const avatarEl = document.getElementById("user-avatar");

    if (firstNameEl) firstNameEl.textContent = userData.firstName;
    if (usernameEl) usernameEl.textContent = userData.username;

    /* ===============================
       AVATAR
    ================================= */

    const avatarStyle =
      userData.gender === "Femme"
        ? "adventurer-neutral"
        : "adventurer";

    const avatarUrl =
      `https://api.dicebear.com/7.x/${avatarStyle}/png?` +
      `seed=${encodeURIComponent(userData.username)}` +
      `&backgroundColor=EEF2FF`;

    if (avatarEl) avatarEl.src = avatarUrl;

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
