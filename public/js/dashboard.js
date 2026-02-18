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

  // Nom complet
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`;

  document.getElementById("userName").textContent = fullName;

  // Nom sur les cartes
  const cardUserNameUSD = document.getElementById("cardUserNameUSD");
  const cardUserNameCDF = document.getElementById("cardUserNameCDF");

  if (cardUserNameUSD) cardUserNameUSD.textContent = fullName.toUpperCase();
  if (cardUserNameCDF) cardUserNameCDF.textContent = fullName.toUpperCase();

  // Avatar
  const initials =
    (user.firstName?.[0] || "") +
    (user.lastName?.[0] || "");

  document.getElementById("userAvatar").textContent =
    initials.toUpperCase();
});

/* ===============================
   LOAD WALLETS (USD + CDF)
================================ */
const walletsRef = collection(db, "wallets");

const walletQuery = query(
  walletsRef,
  where("userId", "==", userId)
);

onSnapshotCollection

/* ===============================
   LOAD TRANSACTIONS
================================ */
const transactionsRef = collection(db, "transactions");

const txQuery = query(
  transactionsRef,
  where("participants", "array-contains", userId),
  orderBy("createdAt", "desc"),
  limit(5)
);

onSnapshotCollection(txQuery, (snapshot) => {

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
          <i class="bi bi-clock-history text-gray-500"></i>
        </div>

        <div>
          <p class="text-sm font-medium">
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
   3D TILT EFFECT (ALL CARDS)
================================ */
const cards = document.querySelectorAll(".card-3d");

cards.forEach(card => {

  card.addEventListener("mousemove", (e) => {

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateY = ((x / rect.width) - 0.5) * 20;
    const rotateX = ((y / rect.height) - 0.5) * -20;

    card.style.transform =
      `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "rotateX(0deg) rotateY(0deg)";
  });

});

/* ===============================
   BALANCE COUNTER ANIMATION
================================ */
function animateBalance(elementId, targetValue, currency) {

  const element = document.getElementById(elementId);
  if (!element) return;

  let start = 0;
  const duration = 800;
  const increment = targetValue / (duration / 16);

  const counter = setInterval(() => {

    start += increment;

    if (start >= targetValue) {
      start = targetValue;
      clearInterval(counter);
    }

    if (currency === "CDF") {
      element.textContent =
        new Intl.NumberFormat("fr-FR").format(start) + " CDF";
    } else {
      element.textContent =
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency || "USD"
        }).format(start);
    }

  }, 16);
}

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
