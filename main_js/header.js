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

  console.log("HEADER LOADED");

  const userId =
    localStorage.getItem("userId") ||
    sessionStorage.getItem("userId");

  if (!userId) {
    console.log("No userId");
    return;
  }

  try {

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.log("User not found");
      return;
    }

    const user = userSnap.data();

    document.getElementById("firstNameText").textContent =
      user.firstName;

    document.getElementById("usernameText").textContent =
      user.username;

    /* Crypto avatar */
    document.getElementById("userAvatar").src =
      `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}`;

    /* Notifications count */
    const q = query(
      collection(db, "transactions"),
      where("participants", "array-contains", userId)
    );

    const snapshot = await getDocs(q);

    const badge =
      document.getElementById("notificationBadge");

    badge.textContent = snapshot.size;

    if (snapshot.size === 0)
      badge.classList.add("hidden");

    /* Logout */
    document.getElementById("logoutBtn")
      .addEventListener("click", () => {

        localStorage.clear();
        sessionStorage.clear();

        window.location.href =
          "/trustlink_app/index.html";
      });

  } catch (err) {
    console.error("HEADER ERROR:", err);
  }

});
