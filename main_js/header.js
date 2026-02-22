import { db } from "../js/firebase-init.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function initHeader() {

  const userId =
    localStorage.getItem("userId") ||
    sessionStorage.getItem("userId");

  if (!userId) {
    window.location.href = "/trustlink_app/index.html";
    return;
  }

  try {

    /* ================= USER ================= */

    const userSnap = await getDoc(doc(db, "users", userId));

    if (!userSnap.exists()) {
      window.location.href = "/trustlink_app/index.html";
      return;
    }

    const user = userSnap.data();

    document.getElementById("firstNameText").textContent =
      user.firstName;

    document.getElementById("usernameText").textContent =
      user.username;

    /* ================= AVATAR ================= */

    const avatarUrl =
      `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}`;

    document.getElementById("userAvatar").src = avatarUrl;

    /* ================= NOTIFICATIONS REALTIME ================= */

    const notifQuery = query(
      collection(db, "transactions"),
      where("participants", "array-contains", userId)
    );

    onSnapshot(notifQuery, (snapshot) => {

      const badge =
        document.getElementById("notificationBadge");

      if (snapshot.size > 0) {
        badge.textContent = snapshot.size;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }

    });

    /* ================= LOGOUT ================= */

    document.getElementById("logoutBtn")
      .addEventListener("click", () => {

        localStorage.clear();
        sessionStorage.clear();

        window.location.href =
          "/trustlink_app/index.html";
      });

  } catch (error) {
    console.error("HEADER ERROR:", error);
  }

}

/* 🔥 IMPORTANT */
initHeader();
