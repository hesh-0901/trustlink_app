import { db } from "../js/firebase-init.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
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

    /* ===============================
       USER DATA
    ================================= */

    const userRef = doc(db, "users", userId);

    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      window.location.href = "/trustlink_app/index.html";
      return;
    }

    const user = userSnap.data();

    // Nom
    document.getElementById("firstNameText")
      .textContent = user.firstName;

    document.getElementById("usernameText")
      .textContent = user.username;

    /* ===============================
       AVATAR BASED ON GENDER
    ================================= */

    let avatarUrl;

    if (user.gender === "Femme") {
      avatarUrl =
        `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}&gender=female`;
    } else {
      avatarUrl =
        `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}&gender=male`;
    }

    document.getElementById("userAvatar").src = avatarUrl;

    /* ===============================
       REALTIME NOTIFICATIONS
    ================================= */

    const notifQuery = query(
      collection(db, "transactions"),
      where("participants", "array-contains", userId)
    );

    onSnapshot(notifQuery, (snapshot) => {

      const badge =
        document.getElementById("notificationBadge");

      const count = snapshot.size;

      if (count > 0) {
        badge.textContent = count;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }

    });

    /* ===============================
       LOGOUT
    ================================= */

    document.getElementById("logoutBtn")
      .addEventListener("click", () => {

        localStorage.removeItem("userId");
        localStorage.removeItem("role");
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("role");

        window.location.href =
          "/trustlink_app/index.html";
      });

  } catch (err) {
    console.error("HEADER ERROR:", err);
  }

});
