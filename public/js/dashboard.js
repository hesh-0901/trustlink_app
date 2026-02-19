/*public/js/dashboard.js*/
import { db } from "../../js/firebase-init.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* ===============================
   SESSION CHECK
================================ */

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId) {
  window.location.href = "/trustlink_app/index.html";
}

/* ===============================
   FORMAT MONEY
================================ */

function formatMoney(amount, currency) {
  if (currency === "CDF") {
    return new Intl.NumberFormat("fr-FR").format(amount) + " CDF";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD"
  }).format(amount);
}

/* ===============================
   BALANCE ANIMATION
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

    element.textContent = formatMoney(
      Math.floor(start),
      currency
    );

  }, 16);
}

/* ===============================
   LOAD USER INFO
================================ */

async function loadUser() {

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/trustlink_app/index.html";
    return;
  }

  const user = userSnap.data();

  if (!user.isActive) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/trustlink_app/index.html";
    return;
  }

  const header = document.getElementById("userName");

  if (header) {
    header.textContent =
      user.username || `${user.firstName} ${user.lastName}`;
  }
}

/* ===============================
   LOAD WALLETS REALTIME
================================ */

function loadWallets() {

  const walletsRef = collection(db, "wallets");

  const walletQuery = query(
    walletsRef,
    where("userId", "==", userId)
  );

  onSnapshot(walletQuery, (snapshot) => {

    snapshot.forEach((docSnap) => {

      const wallet = docSnap.data();

      if (!wallet.isActive) return;

      if (wallet.currency === "USD") {
        animateBalance("balanceUSD", wallet.balance, "USD");
      }

      if (wallet.currency === "CDF") {
        animateBalance("balanceCDF", wallet.balance, "CDF");
      }

    });

  });

}

/* ===============================
   LOAD TRANSACTIONS REALTIME
================================ */

function loadTransactions() {

  const transactionsRef = collection(db, "transactions");

  const txQuery = query(
    transactionsRef,
    where("participants", "array-contains", userId),
    orderBy("createdAt", "desc"),
    limit(5)
  );

  onSnapshot(txQuery, (snapshot) => {

    const container = document.getElementById("transactionsList");
    if (!container) return;

    container.innerHTML = "";

    snapshot.forEach((docSnap) => {
    
      const tx = docSnap.data();
      const txId = docSnap.id;
      const isSender = tx.fromUserId === userId;


      const div = document.createElement("div");

      div.className =
        "bg-white rounded-2xl p-4 shadow flex justify-between items-center";

      div.innerHTML = `
        <div class="flex items-center gap-3">

          <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <i class="bi bi-arrow-left-right text-gray-500"></i>
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

<div class="flex items-center gap-3">

        <span class="text-sm font-semibold ${
          isSender ? "text-red-500" : "text-green-600"
        }">
          ${isSender ? "-" : "+"}
          ${formatMoney(tx.amount, tx.currency)}
        </span>
      
        ${
          tx.status === "pending" && tx.toUserId === userId
            ? `
              <button
                onclick="approveTransfer('${txId}')"
                class="px-3 py-1 bg-green-500 text-white text-xs rounded-lg">
                Approuver
              </button>
            `
            : ""
        }
      
      </div>

      `;

      container.appendChild(div);

    });

  });

}

/* ===============================
   LOGOUT
================================ */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/trustlink_app/index.html";
  });
}
/* ===============================
   NOUVEAU
================================ */
async function approveTransfer(txId) {

  try {

    const txRef = doc(db, "transactions", txId);

    await runTransaction(db, async (transaction) => {

      const txDoc = await transaction.get(txRef);
      if (!txDoc.exists())
        throw "Transaction introuvable";

      const tx = txDoc.data();

      if (tx.status !== "pending")
        throw "Déjà traité";

      const fromWalletRef = doc(db, "wallets", tx.fromWalletId);
      const toWalletRef = doc(db, "wallets", tx.toWalletId);

      const fromDoc = await transaction.get(fromWalletRef);
      const toDoc = await transaction.get(toWalletRef);

      if (!fromDoc.exists() || !toDoc.exists())
        throw "Wallet introuvable";

      const fromWallet = fromDoc.data();
      const toWallet = toDoc.data();

      /* Vérification sécurité */
      if (fromWallet.reservedBalance < tx.amount)
        throw "Incohérence réserve";

      /* Débit réel */
      transaction.update(fromWalletRef, {
        balance: fromWallet.balance - tx.amount,
        reservedBalance: fromWallet.reservedBalance - tx.amount,
        updatedAt: serverTimestamp()
      });

      /* Crédit */
      transaction.update(toWalletRef, {
        balance: toWallet.balance + tx.amount,
        updatedAt: serverTimestamp()
      });

      /* Update status */
      transaction.update(txRef, {
        status: "completed",
        updatedAt: serverTimestamp()
      });

    });

    alert("Transfert approuvé ✔️");

  } catch (error) {
    console.error(error);
    alert(error);
  }
}

window.approveTransfer = approveTransfer;

/* ===============================
   REJECT TRANSFER
================================ */
async function rejectTransfer(txId) {

  try {

    const txRef = doc(db, "transactions", txId);

    await runTransaction(db, async (transaction) => {

      const txDoc = await transaction.get(txRef);
      if (!txDoc.exists())
        throw "Transaction introuvable";

      const tx = txDoc.data();

      if (tx.status !== "pending")
        throw "Déjà traité";

      const fromWalletRef = doc(db, "wallets", tx.fromWalletId);
      const fromDoc = await transaction.get(fromWalletRef);

      if (!fromDoc.exists())
        throw "Wallet introuvable";

      const fromWallet = fromDoc.data();

      /* Libération des fonds */
      transaction.update(fromWalletRef, {
        reservedBalance: fromWallet.reservedBalance - tx.amount,
        updatedAt: serverTimestamp()
      });

      transaction.update(txRef, {
        status: "rejected",
        updatedAt: serverTimestamp()
      });

    });

    alert("Transfert refusé ❌");

  } catch (error) {
    console.error(error);
    alert(error);
  }
}

window.rejectTransfer = rejectTransfer;

/* ===============================
   INIT
================================ */

loadUser();
loadWallets();
loadTransactions();
