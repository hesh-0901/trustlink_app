import { db } from "../../js/firebase-init.js";

import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot as onSnapshotCollection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   SESSION CHECK
================================ */
const userId = localStorage.getItem("userId");

if (!userId) {
  window.location.href = "/trustlink_app/index.html";
}

/* ===============================
   FORMAT MONEY
================================ */
function formatMoney(amount, currency) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "USD"
  }).format(amount);
}

/* ===============================
   LOAD USER (REALTIME)
================================ */
const userRef = doc(db, "users", userId);

onSnapshot(userRef, (docSnap) => {

  if (!docSnap.exists()) {
    localStorage.clear();
    window.location.href = "/trustlink_app/index.html";
    return;
  }

  const user = docSnap.data();

  if (!user.isActive) {
    localStorage.clear();
    window.location.href = "/trustlink_app/index.html";
    return;
  }

  // Nom
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`;
  document.getElementById("userName").textContent = fullName;

  // Avatar
  const initials =
    (user.firstName?.[0] || "") +
    (user.lastName?.[0] || "");

  document.getElementById("userAvatar").textContent =
    initials.toUpperCase();

  // Balance
  document.getElementById("balanceAmount").textContent =
    formatMoney(user.balance || 0, user.currency);

});

/* ===============================
   LOAD TRANSACTIONS
================================ */
const transactionsRef = collection(db, "transactions");

const q = query(
  transactionsRef,
  where("participants", "array-contains", userId),
  orderBy("createdAt", "desc"),
  limit(5)
);

onSnapshotCollection(q, (snapshot) => {

  const container = document.getElementById("transactionsList");

  if (!container) return;

  container.innerHTML = "";

  snapshot.forEach((doc) => {

    const tx = doc.data();

    const isSender = tx.fromUserId === userId;

    const div = document.createElement("div");

    div.className =
      "bg-white rounded-2xl p-4 shadow flex justify-between items-center";

    div.innerHTML = `
      <div class="flex items-center gap-3">

        <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg"
               fill="none"
               viewBox="0 0 24 24"
               stroke-width="1.8"
               stroke="currentColor"
               class="w-5 h-5 text-gray-500">
            <path stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6v6l4 2"/>
          </svg>
        </div>

        <div>
          <p class="text-sm font-medium text-textDark">
            ${isSender ? "Transfert envoyé" : "Paiement reçu"}
          </p>
          <p class="text-xs text-gray-400">
            ${new Date(tx.createdAt?.seconds * 1000).toLocaleString()}
          </p>
        </div>

      </div>

      <span class="text-sm font-semibold ${
        isSender ? "text-red-500" : "text-green-600"
      }">
        ${isSender ? "-" : "+"}
        ${formatMoney(tx.amount, tx.currency)}
      </span>
    `;

    container.appendChild(div);

  });

});

/* ===============================
   LOGOUT
================================ */
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/trustlink_app/index.html";
  });
}
