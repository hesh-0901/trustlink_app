import { db } from "../js/firebase-init.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   SESSION
================================ */

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId) {
  window.location.href = "/trustlink_app/index.html";
}

/* ===============================
   GLOBAL STATE
================================ */

let currentFilter = "all";
const container = document.getElementById("transactionsList");

/* ===============================
   FORMAT DATE
================================ */

function formatDate(timestamp) {
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleString("fr-FR");
}

/* ===============================
   RENDER TRANSACTIONS
================================ */

function renderTransactions(snapshot) {

  container.innerHTML = "";

  if (snapshot.empty) {
    container.innerHTML =
      `<p class="text-gray-400 text-sm text-center">Aucune transaction</p>`;
    return;
  }

  snapshot.forEach(doc => {

    const tx = doc.data();

    if (currentFilter !== "all" && tx.type !== currentFilter) {
      return;
    }

    const isDeposit = tx.type === "deposit";

    const div = document.createElement("div");

    div.className =
      "bg-white rounded-2xl p-4 shadow flex justify-between items-center";

    div.innerHTML = `
      <div class="flex items-center gap-3">

        <div class="w-10 h-10 rounded-full ${
          isDeposit ? "bg-green-100" : "bg-blue-100"
        } flex items-center justify-center">

          <i class="bi ${
            isDeposit ? "bi-arrow-down" : "bi-arrow-left-right"
          } ${
            isDeposit ? "text-green-600" : "text-blue-600"
          }"></i>

        </div>

        <div>
          <p class="text-sm font-medium">
            ${isDeposit ? "Dépôt" : "Transfert"}
          </p>
          <p class="text-xs text-gray-400">
            ${formatDate(tx.createdAt)}
          </p>
        </div>

      </div>

      <span class="text-sm font-semibold ${
        isDeposit ? "text-green-600" : "text-red-500"
      }">
        ${isDeposit ? "+" : "-"}
        ${tx.amount.toLocaleString()} ${tx.currency}
      </span>
    `;

    container.appendChild(div);

  });
}

/* ===============================
   REALTIME LISTENER
================================ */

const q = query(
  collection(db, "transactions"),
  where("participants", "array-contains", userId),
  orderBy("createdAt", "desc")
);

onSnapshot(q, renderTransactions);

/* ===============================
   FILTER HANDLER
================================ */

const buttons = document.querySelectorAll(".filter-btn");

buttons.forEach(btn => {

  btn.addEventListener("click", () => {

    currentFilter = btn.dataset.filter;

    buttons.forEach(b => {
      b.classList.remove("bg-primaryStrong", "text-white");
      b.classList.add("bg-white");
    });

    btn.classList.add("bg-primaryStrong", "text-white");

  });

});