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
let currentPage = 1;
const pageSize = 4;
let totalPages = 1;

async function loadNotifications(page = 1) {

  const container =
    document.getElementById("transactionsList");

  container.innerHTML = "";
  currentPage = page;

  const baseQuery = query(
    collection(db, "transactions"),
    where("participants", "array-contains", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(baseQuery);

  if (snapshot.empty) {
    container.innerHTML =
      `<div class="text-center text-gray-400 text-sm py-6">
        Aucune notification
      </div>`;
    return;
  }

  totalPages =
    Math.ceil(snapshot.docs.length / pageSize);

  if (currentPage > totalPages)
    currentPage = totalPages;

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  const docs =
    snapshot.docs.slice(start, end);

 for (const docSnap of docs) {

  const tx = docSnap.data();
  const txId = docSnap.id;

  const counterpartyId =
    tx.fromUserId === userId
      ? tx.toUserId
      : tx.fromUserId;

  const userSnap =
    await getDoc(doc(db, "users", counterpartyId));

  const counterparty =
    userSnap.exists()
      ? userSnap.data()
      : null;

  const avatar =
    counterparty
      ? `https://api.dicebear.com/7.x/avataaars/png?seed=${counterparty.username}`
      : "";

  const name =
    counterparty
      ? `${counterparty.firstName} ${counterparty.lastName}`
      : "Utilisateur";

  const div = document.createElement("div");

  div.className =
    "bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer";

  div.onclick = () => openModal(txId);

  div.innerHTML = `
    <div class="flex gap-3">

      <!-- Avatar -->
      <img src="${avatar}"
           class="w-12 h-12 rounded-full object-cover border border-gray-200"/>

      <!-- Content -->
      <div class="flex-1 min-w-0">

        <div class="flex justify-between items-start">

          <div>
            <p class="text-sm font-semibold text-gray-800">
              ${name}
            </p>

            <p class="text-xs text-gray-500">
              ${formatNotificationType(tx)}
            </p>
          </div>

          <span class="text-sm font-semibold ${
            tx.toUserId === userId
              ? "text-green-600"
              : "text-red-500"
          }">
            ${formatMoney(tx.amount, tx.currency)}
          </span>

        </div>

        <p class="text-xs text-gray-400 mt-2">
          ${formatDate(tx.createdAt)}
        </p>

      </div>

    </div>
  `;

  container.appendChild(div);
}

  createPagination();
}

/* ===============================
   PAGINATION
================================ */

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

  if (document.getElementById("txModal")) return;

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

  const fullName =
    user
      ? `${user.firstName} ${user.lastName}`
      : "Utilisateur";

  const modal = document.createElement("div");

  modal.className =
    "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50";

  modal.onclick = (e) => {
    if (e.target.id === "txModal") closeModal();
  };

  modal.innerHTML = `
    <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:w-[92%] max-w-md p-6 shadow-2xl animate-slideUp">

      <!-- Barre drag -->
      <div class="flex justify-center mb-5">
        <div class="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>

      <!-- Avatar + Nom -->
          <div class="flex flex-col items-center mb-6">
          
            <div class="relative">
          
              <img src="${avatar}"
                   class="w-20 h-20 rounded-full mb-3 border border-gray-200 shadow-sm"/>
          
              <button
                onclick="downloadAvatar('${avatar}')"
                class="absolute -bottom-2 -right-2 bg-primaryStrong text-white rounded-full p-2 shadow-md active:scale-95 transition">
                <i class="bi bi-download text-sm"></i>
              </button>
          
            </div>
          
            <h3 class="text-lg font-semibold mt-4">
              ${getTitle(tx)}
            </h3>
          
            <p class="text-sm text-gray-400">
              ${formatDate(tx.createdAt)}
            </p>
          
          </div>

      <!-- Carte détails -->
      <div class="bg-gray-50 rounded-2xl p-4 space-y-4 text-sm mb-6">

        <div class="flex justify-between">
          <span class="text-gray-500">Montant</span>
          <span class="font-semibold text-primaryStrong text-base">
            ${formatMoney(tx.amount, tx.currency)}
          </span>
        </div>

        <div class="flex justify-between">
          <span class="text-gray-500">Statut</span>
          <span class="capitalize font-medium ${
            tx.status === "completed"
              ? "text-green-600"
              : tx.status === "rejected"
              ? "text-red-500"
              : "text-yellow-500"
          }">
            ${tx.status}
          </span>
        </div>

        <div class="flex justify-between">
          <span class="text-gray-500">Type</span>
          <span class="font-medium">
            ${tx.type || tx.category}
          </span>
        </div>

            ${
              tx.customMotif || tx.motif
                ? `
                <div class="pt-4 border-t border-gray-200">
                  <span class="block text-gray-500 mb-2 text-xs uppercase tracking-wide">
                    Motif
                  </span>
                  <p class="text-gray-700 text-sm leading-relaxed break-words whitespace-pre-wrap">
                    ${tx.customMotif || tx.motif}
                  </p>
                </div>
                `
                : ""
            }

      </div>

      ${
        tx.status === "pending" &&
        tx.toUserId === userId
          ? `
          <div class="flex gap-3">
            <button
              onclick="executeAction('${txId}','approve')"
              class="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition">
              Approuver
            </button>
            <button
              onclick="executeAction('${txId}','reject')"
              class="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition">
              Refuser
            </button>
          </div>
          `
          : `
          <button
            onclick="closeModal()"
            class="w-full bg-gray-200 hover:bg-gray-300 py-3 rounded-xl font-medium transition">
            Fermer
          </button>
          `
      }

    </div>
  `;

  modal.id = "txModal";
  document.body.appendChild(modal);
}

function closeModal() {
  const modal = document.getElementById("txModal");
  if (modal) modal.remove();
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
   NOUVEAU
================================ */
function buildNotificationTitle(tx, user) {

  const name =
    user
      ? `${user.firstName} ${user.lastName}`
      : "Utilisateur";

  if (tx.category === "request")
    return `${name} vous a envoyé une demande`;

  if (tx.type === "transfer") {

    if (tx.fromUserId === userId)
      return `Vous avez envoyé un transfert à ${name}`;

    return `${name} vous a envoyé un transfert`;
  }

  return "Nouvelle activité";
}


function getNotificationSubtitle(tx) {

  if (tx.category === "request")
    return tx.type === "fund_request"
      ? "Demande de fonds"
      : "Demande de remboursement";

  if (tx.type === "transfer")
    return "Transfert";

  return tx.status;
}
/* ===============================
   NOUVEAU 2
================================ */
function formatNotificationType(tx) {

  if (tx.category === "request") {
    if (tx.type === "fund_request")
      return "Demande de fonds";
    if (tx.type === "repayment_request")
      return "Demande de remboursement";
    return "Demande";
  }

  if (tx.type === "transfer")
    return "Transfert";

  return "Opération";
}
/* ===============================
   TELECHARGEMENT
================================ */
function downloadAvatar(url) {

  const link = document.createElement("a");
  link.href = url;
  link.download = "avatar.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.downloadAvatar = downloadAvatar;

/* ===============================
   INIT
================================ */

loadUser();
loadWallets();
loadNotifications();
