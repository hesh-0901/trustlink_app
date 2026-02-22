import { db } from "../../js/firebase-init.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId)
  window.location.href = "/trustlink_app/index.html";

const pageSize = 12;
let currentPage = 1;
let totalPages = 1;

async function loadApprovals(page = 1) {

  const container =
    document.getElementById("approvalList");

  container.innerHTML = "";
  currentPage = page;

  const q = query(
    collection(db, "transactions"),
    where("toUserId", "==", userId),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    container.innerHTML =
      `<div class="text-center text-gray-400 py-10 text-sm">
        Aucune approbation en attente
      </div>`;
    return;
  }

  totalPages =
    Math.ceil(snapshot.docs.length / pageSize);

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const docs =
    snapshot.docs.slice(start, end);

  for (const docSnap of docs) {

    const tx = docSnap.data();
    const txId = docSnap.id;

    const userSnap =
      await getDoc(doc(db, "users", tx.fromUserId));

    const user =
      userSnap.exists() ? userSnap.data() : null;

    const name =
      user
        ? `${user.firstName} ${user.lastName}`
        : "Utilisateur";

    const div = document.createElement("div");

    div.className =
      "bg-white rounded-2xl p-4 shadow-sm";

    div.innerHTML = `
      <div class="flex justify-between items-center">

        <div>
          <p class="text-sm font-semibold">
            ${name}
          </p>
          <p class="text-xs text-gray-500">
            ${tx.type}
          </p>
        </div>

        <span class="text-sm font-bold text-primaryStrong">
          ${formatMoney(tx.amount, tx.currency)}
        </span>

      </div>

      <div class="flex gap-3 mt-4">

        <button
          onclick="approveTx('${txId}')"
          class="flex-1 bg-green-500 text-white py-2 rounded-xl">
          ✔
        </button>

        <button
          onclick="rejectTx('${txId}')"
          class="flex-1 bg-red-500 text-white py-2 rounded-xl">
          ✖
        </button>

      </div>
    `;

    container.appendChild(div);
  }

  createPagination(container);
}

function createPagination(container) {

  const pagination =
    document.createElement("div");

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
  loadApprovals(page);
}

window.changePage = changePage;

async function approveTx(txId) {

  const txRef =
    doc(db, "transactions", txId);

  await runTransaction(db, async (transaction) => {

    const txDoc =
      await transaction.get(txRef);

    if (!txDoc.exists())
      throw "Introuvable";

    const tx = txDoc.data();

    if (tx.status !== "pending")
      throw "Déjà traité";

    transaction.update(txRef, {
      status: "completed",
      updatedAt: serverTimestamp()
    });

  });

  loadApprovals();
}

async function rejectTx(txId) {

  const txRef =
    doc(db, "transactions", txId);

  await runTransaction(db, async (transaction) => {

    const txDoc =
      await transaction.get(txRef);

    if (!txDoc.exists())
      throw "Introuvable";

    const tx = txDoc.data();

    if (tx.status !== "pending")
      throw "Déjà traité";

    transaction.update(txRef, {
      status: "rejected",
      updatedAt: serverTimestamp()
    });

  });

  loadApprovals();
}

window.approveTx = approveTx;
window.rejectTx = rejectTx;

function formatMoney(amount, currency) {
  if (currency === "CDF")
    return new Intl.NumberFormat("fr-FR")
      .format(amount) + " CDF";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD"
  }).format(amount);
}

loadApprovals();
