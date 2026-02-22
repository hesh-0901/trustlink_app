import { db } from "../js/firebase-init.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

(async function initHeader() {

  try {

    /* ===============================
       SESSION CHECK (local + session)
    ================================= */

    const userId =
      localStorage.getItem("userId") ||
      sessionStorage.getItem("userId");

    const role =
      localStorage.getItem("role") ||
      sessionStorage.getItem("role");

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

    document.getElementById("user-firstname").textContent =
      userData.firstName;

    document.getElementById("user-username").textContent =
      userData.username;

    /* ===============================
       AVATAR GENERATION (Dicebear)
    ================================= */

    const avatarStyle =
      userData.gender === "Femme"
        ? "adventurer-neutral"
        : "adventurer";

    const avatarUrl =
      `https://api.dicebear.com/7.x/${avatarStyle}/png?` +
      `seed=${encodeURIComponent(userData.username)}` +
      `&backgroundColor=EEF2FF`;

    document.getElementById("user-avatar").src = avatarUrl;

    /* ===============================
       REAL-TIME NOTIFICATIONS
    ================================= */

    const badge = document.getElementById("notification-badge");

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

    /* ===============================
       LOGOUT
    ================================= */

    const logoutBtn = document.getElementById("logout-btn");

    logoutBtn.addEventListener("click", () => {

      localStorage.removeItem("userId");
      localStorage.removeItem("role");

      sessionStorage.removeItem("userId");
      sessionStorage.removeItem("role");

      window.location.href = "/trustlink_app/index.html";

    });

  } catch (error) {

    console.error("Header init error:", error);

    localStorage.clear();
    sessionStorage.clear();

    window.location.href = "/trustlink_app/index.html";
  }

})();
