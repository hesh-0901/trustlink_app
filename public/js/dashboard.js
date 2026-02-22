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
  startAfter,
  getDocs,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   SESSION
================================ */

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId)
  window.location.href = "/trustlink_app/index.html";

/* ===============================
   FORMAT
================================ */

function formatMoney(amount, currency) {
  if (currency === "CDF")
    return new Intl.NumberFormat("fr-FR").format(amount) + " CDF";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD"
  }).format(amount);
}

/* ===============================
   USER LOAD
================================ */

async function loadUser() {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists())
    window.location.href = "/trustlink_app/index.html";

  const user = snap.data();
  const header = document.getElementById("userName");
  if (header)
    header.textContent =
      user.username || `${user.firstName} ${user.lastName}`;
}

/* ===============================
   WALLET LOAD
================================ */

async function loadWallets() {

  const q = query(
    collection(db, "wallets"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);

  snapshot.forEach(docSnap => {
    const wallet = docSnap.data();
    if (!wallet.isActive) return;

    const el = document.getElementById(
      wallet.currency === "USD"
        ? "balanceUSD"
        : "balanceCDF"
    );

    if (el)
      el.textContent =
        formatMoney(wallet.balance, wallet.currency);
  });
}

/* ===============================
   NOTIFICATIONS (4 PER PAGE)
================================ */

let lastDoc = null;
let currentPage = 1;
const pageSize = 4;

async function loadNotifications(next = false) {

  const container =
    document.getElementById("transactionsList");

  if (!next) {
    container.innerHTML = "";
    lastDoc = null;
    currentPage = 1;
  }

  let q = query(
    collection(db, "transactions"),
    where("participants", "array-contains", userId),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );

  if (lastDoc)
    q = query(
      collection(db, "transactions"),
      where("participants", "array-contains", userId),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(pageSize)
    );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  lastDoc = snapshot.docs[snapshot.docs.length - 1];

  snapshot.forEach(docSnap => {

    const tx = docSnap.data();
    const txId = docSnap.id;

    const div = document.createElement("div");

    div.className =
      "bg-white rounded-2xl p-4 shadow flex items-center justify-between cursor-pointer";

    div.onclick = () => openModal(txId);

    div.innerHTML = `
      <div class="flex items-center gap-3">

        <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <i class="bi bi-bell text-primaryStrong"></i>
        </div>

        <div>
          <p class="text-sm font-medium">
            ${tx.category === "request"
              ? "Nouvelle demande"
              : "Transaction"}
          </p>
          <p class="text-xs text-gray-400">
            ${formatMoney(tx.amount, tx.currency)}
          </p>
        </div>

      </div>
    `;

    container.appendChild(div);
  });
}

function createPagination() {

  const container =
    document.getElementById("transactionsList");

  const pagination = document.createElement("div");

  pagination.className =
    "flex justify-center items-center gap-4 mt-6 text-sm";

  pagination.innerHTML = `
    <button
      ${currentPage === 1 ? "disabled" : ""}
      onclick="changePage(${currentPage - 1})"
      class="text-primaryStrong disabled:opacity-30">
      ‹
    </button>

    <span class="font-medium">
      ${currentPage} / ${totalPages}
    </span>

    <button
      ${currentPage === totalPages ? "disabled" : ""}
      onclick="changePage(${currentPage + 1})"
      class="text-primaryStrong disabled:opacity-30">
      ›
    </button>
  `;

  container.appendChild(pagination);
}

function changePage(page) {
  loadNotifications(page);
}

window.changePage = changePage;
/* ===============================
   MODAL
================================ */
async function openModal(txId) {

  const snap =
    await getDoc(doc(db, "transactions", txId));

  if (!snap.exists()) return;

  const tx = snap.data();

  const counterpartyId =
    tx.fromUserId === userId
      ? tx.toUserId
      : tx.fromUserId;

  const userSnap =
    await getDoc(doc(db, "users", counterpartyId));

  const user = userSnap.exists()
    ? userSnap.data()
    : null;

  const avatar =
    user
      ? `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}`
      : "";

  const modal = document.createElement("div");

  modal.className =
    "fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50";

  modal.innerHTML = `
    <div class="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full sm:w-[90%] max-w-md animate-slideUp">

      <div class="flex justify-center mb-4">
        <div class="w-14 h-1 bg-gray-300 rounded-full"></div>
      </div>

      <div class="flex flex-col items-center mb-6">

        <img src="${avatar}"
             class="w-16 h-16 rounded-full mb-3"/>

        <h3 class="text-lg font-semibold">
          ${getTitle(tx)}
        </h3>

        <p class="text-sm text-gray-400">
          ${formatDate(tx.createdAt)}
        </p>
      </div>

      <div class="space-y-3 text-sm mb-6">

        <div class="flex justify-between">
          <span>Montant</span>
          <span class="font-semibold">
            ${formatMoney(tx.amount, tx.currency)}
          </span>
        </div>

        <div class="flex justify-between">
          <span>Status</span>
          <span class="capitalize">
            ${tx.status}
          </span>
        </div>

        <div class="flex justify-between">
          <span>Type</span>
          <span>
            ${tx.type || tx.category}
          </span>
        </div>

      </div>

      ${
        tx.status === "pending" &&
        tx.toUserId === userId
          ? `
          <div class="flex gap-3">
            <button
              onclick="executeAction('${txId}','approve')"
              class="flex-1 bg-green-500 text-white py-3 rounded-xl">
              Approuver
            </button>
            <button
              onclick="executeAction('${txId}','reject')"
              class="flex-1 bg-red-500 text-white py-3 rounded-xl">
              Refuser
            </button>
          </div>
          `
          : `
          <button
            onclick="closeModal()"
            class="w-full bg-gray-200 py-3 rounded-xl">
            Fermer
          </button>
          `
      }

    </div>
  `;

  modal.id = "txModal";
  document.body.appendChild(modal);
}

/* ===============================
   EXECUTE ACTION
================================ */
async function executeAction(txId, action) {

  const txRef = doc(db, "transactions", txId);

  await runTransaction(db, async (transaction) => {

    const txDoc = await transaction.get(txRef);
    if (!txDoc.exists())
      throw "Introuvable";

    const tx = txDoc.data();

    if (tx.status !== "pending")
      throw "Déjà traité";

    if (tx.toUserId !== userId)
      throw "Non autorisé";

    transaction.update(txRef, {
      status: action === "approve"
        ? "completed"
        : "rejected",
      updatedAt: serverTimestamp()
    });

  });

  closeModal();
  loadNotifications();
}

window.executeAction = executeAction;
window.closeModal = closeModal;

/* ===============================
   Helpers
================================ */
function formatDate(timestamp) {

  if (!timestamp) return "";

  const date = new Date(timestamp.seconds * 1000);

  return date.toLocaleDateString("fr-FR") +
         " • " +
         date.toLocaleTimeString("fr-FR", {
           hour: "2-digit",
           minute: "2-digit"
         });
}

function getTitle(tx) {

  if (tx.category === "request")
    return "Nouvelle demande";

  if (tx.type === "transfer")
    return tx.fromUserId === userId
      ? "Transfert envoyé"
      : "Transfert reçu";

  return "Opération";
}

function getIconConfig(tx) {

  if (tx.category === "request")
    return {
      icon: "bi-question-circle",
      bg: "bg-yellow-100",
      color: "text-yellow-600"
    };

  if (tx.type === "transfer")
    return {
      icon: "bi-arrow-left-right",
      bg: "bg-blue-100",
      color: "text-blue-600"
    };

  return {
    icon: "bi-bell",
    bg: "bg-gray-100",
    color: "text-gray-600"
  };
}

/* ===============================
   INIT
================================ */

loadUser();
loadWallets();
loadNotifications();
