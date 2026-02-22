import { db } from "../js/firebase-init.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

  const userId =
    localStorage.getItem("userId") ||
    sessionStorage.getItem("userId");

  if (!userId) {
    window.location.href = "/trustlink_app/index.html";
    return;
  }

  try {

    const userSnap =
      await getDoc(doc(db, "users", userId));

    if (!userSnap.exists()) {
      window.location.href = "/trustlink_app/index.html";
      return;
    }

    const user = userSnap.data();

    /* ===============================
       USER INFO
    ================================= */

    document.getElementById("firstNameText")
      .textContent = user.firstName;

    document.getElementById("usernameText")
      .textContent = user.username;

    /* ===============================
       AVATAR BANQUE PRO
    ================================= */

    const avatar =
      `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}`;

    document.getElementById("userAvatar")
      .src = avatar;

    /* ===============================
       NOTIFICATIONS COUNT
    ================================= */

    const q = query(
      collection(db, "transactions"),
      where("participants", "array-contains", userId)
    );

    const snapshot = await getDocs(q);

    const badge =
      document.getElementById("notificationBadge");

    badge.textContent =
      snapshot.empty ? 0 : snapshot.size;

    if (snapshot.empty)
      badge.classList.add("hidden");

    /* ===============================
       LOGOUT
    ================================= */

    document.getElementById("logoutBtn")
      .addEventListener("click", () => {

        localStorage.clear();
        sessionStorage.clear();

        window.location.href =
          "/trustlink_app/index.html";
      });

  } catch (error) {
    console.error("Header error:", error);
    window.location.href = "/trustlink_app/index.html";
  }

});
