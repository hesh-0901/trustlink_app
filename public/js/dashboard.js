/*public/js/dashboard.js*/
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

  createPaginationControls();
}

function createPaginationControls() {

  const container =
    document.getElementById("transactionsList");

  const btn = document.createElement("button");
  btn.className =
    "w-full mt-3 text-sm text-primaryStrong font-medium";
  btn.textContent = "Voir plus";

  btn.onclick = () => {
    currentPage++;
    loadNotifications(true);
  };

  container.appendChild(btn);
}

/* ===============================
   MODAL
================================ */

async function openModal(txId) {

  const snap =
    await getDoc(doc(db, "transactions", txId));

  if (!snap.exists()) return;

  const tx = snap.data();

  const modal = document.createElement("div");

  modal.className =
    "fixed inset-0 bg-black/40 flex items-center justify-center z-50";

  modal.innerHTML = `
    <div class="bg-white rounded-2xl p-6 w-[90%] max-w-md">

      <h3 class="text-lg font-semibold mb-4">
        Détails opération
      </h3>

      <div class="space-y-2 text-sm mb-6">
        <div><strong>Montant :</strong> ${formatMoney(tx.amount, tx.currency)}</div>
        <div><strong>Status :</strong> ${tx.status}</div>
        <div><strong>Type :</strong> ${tx.type || tx.category}</div>
      </div>

      <div class="flex gap-3">
        ${
          tx.status === "pending" &&
          tx.toUserId === userId
            ? `
            <button
              onclick="executeAction('${txId}','approve')"
              class="flex-1 bg-green-500 text-white py-2 rounded-xl">
              Approuver
            </button>

            <button
              onclick="executeAction('${txId}','reject')"
              class="flex-1 bg-red-500 text-white py-2 rounded-xl">
              Refuser
            </button>
            `
            : `
            <button
              onclick="closeModal()"
              class="w-full bg-gray-200 py-2 rounded-xl">
              Fermer
            </button>
            `
        }
      </div>

    </div>
  `;

  modal.id = "txModal";
  document.body.appendChild(modal);
}

function closeModal() {
  const modal = document.getElementById("txModal");
  if (modal) modal.remove();
}

window.closeModal = closeModal;

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

    transaction.update(txRef, {
      status:
        action === "approve"
          ? "completed"
          : "rejected",
      updatedAt: serverTimestamp()
    });

  });

  closeModal();
  loadNotifications();
}

window.executeAction = executeAction;

/* ===============================
   INIT
================================ */

loadUser();
loadWallets();
loadNotifications();
