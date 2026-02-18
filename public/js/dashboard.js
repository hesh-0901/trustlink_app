import { db } from "../../js/firebase-init.js";
import { doc, getDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   PROTECTION ROUTE
================================ */
const userId = localStorage.getItem("userId");

if (!userId) {
  window.location.href = "../index.html";
}

/* ===============================
   LOAD USER DATA
================================ */
async function loadUser() {

  try {

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      localStorage.clear();
      window.location.href = "../index.html";
      return;
    }

    const user = userSnap.data();

    // Nom affiché
    document.getElementById("userName").textContent =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`;

    // Avatar initiales
    const initials =
      (user.firstName?.[0] || "") +
      (user.lastName?.[0] || "");

    document.getElementById("userAvatar").textContent =
      initials.toUpperCase();

    // Balance
    document.getElementById("balanceAmount").textContent =
      `${user.balance?.toFixed(2) || "0.00"}`;

    document.getElementById("currencyLabel").textContent =
      user.currency || "USD";

  } catch (error) {
    console.error(error);
  }
}

loadUser();
