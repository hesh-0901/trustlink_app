import { db } from "./firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId)
  window.location.href = "/trustlink_app/index.html";

const walletSelect = document.getElementById("walletSelect");
const beneficiarySelect = document.getElementById("beneficiarySelect");
const manualWallet = document.getElementById("manualWallet");
const amountInput = document.getElementById("amount");
const currencyTag = document.getElementById("currencyTag");
const confirmBtn = document.getElementById("confirmBtn");
const errorMsg = document.getElementById("errorMsg");
const loadingOverlay = document.getElementById("loadingOverlay");

const walletBalance = document.getElementById("walletBalance");
const walletReserved = document.getElementById("walletReserved");
const walletAvailable = document.getElementById("walletAvailable");
const walletCurrency = document.getElementById("walletCurrency");

const friendSection = document.getElementById("friendSection");
const manualSection = document.getElementById("manualSection");
const modeFriend = document.getElementById("modeFriend");
const modeManual = document.getElementById("modeManual");

const friendPreview = document.getElementById("friendPreview");
const friendAvatar = document.getElementById("friendAvatar");
const friendName = document.getElementById("friendName");
const friendUsername = document.getElementById("friendUsername");

let selectedWallet = null;

/* ===============================
   LOAD WALLETS
================================ */
async function loadWallets() {

  const q = query(
    collection(db, "wallets"),
    where("userId", "==", userId),
    where("isActive", "==", true)
  );

  const snapshot = await getDocs(q);

  snapshot.forEach(docSnap => {
    const wallet = docSnap.data();

    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent =
      `${wallet.currency} - ${wallet.walletAddress}`;

    walletSelect.appendChild(option);
  });
}

loadWallets();

/* ===============================
   WALLET CHANGE
================================ */
walletSelect.addEventListener("change", async () => {

  const walletDoc =
    await getDoc(doc(db, "wallets", walletSelect.value));

  if (!walletDoc.exists()) return;

  selectedWallet = walletDoc.data();

  const reserved = selectedWallet.reservedBalance || 0;
  const available = selectedWallet.balance - reserved;

  walletCurrency.textContent = selectedWallet.currency;
  walletBalance.textContent = selectedWallet.balance;
  walletReserved.textContent = reserved;
  walletAvailable.textContent = available;
  currencyTag.textContent = selectedWallet.currency;
});

/* ===============================
   MODE SWITCH
================================ */
modeFriend.addEventListener("click", () => {
  friendSection.classList.remove("hidden");
  manualSection.classList.add("hidden");
  modeFriend.classList.replace("bg-gray-200", "bg-blue-600");
  modeFriend.classList.replace("text-gray-600", "text-white");
});

modeManual.addEventListener("click", () => {
  friendSection.classList.add("hidden");
  manualSection.classList.remove("hidden");
});

/* ===============================
   CONFIRM
================================ */
confirmBtn.addEventListener("click", async () => {

  const amount = parseFloat(amountInput.value);
  const walletId = walletSelect.value;
  const toWalletId = manualWallet.value.trim();

  if (!walletId || !toWalletId || !amount)
    return showError("Champs requis");

  try {

    loadingOverlay.classList.remove("hidden");
    confirmBtn.disabled = true;

    await runTransaction(db, async (transaction) => {

      const fromRef = doc(db, "wallets", walletId);
      const toRef = doc(db, "wallets", toWalletId);
      const txRef = doc(collection(db, "transactions"));

      const fromDoc = await transaction.get(fromRef);
      const toDoc = await transaction.get(toRef);

      if (!fromDoc.exists())
        throw "Wallet source introuvable";

      if (!toDoc.exists())
        throw "Destinataire introuvable";

      const fromWallet = fromDoc.data();
      const toWallet = toDoc.data();

      const reserved = fromWallet.reservedBalance || 0;
      const available = fromWallet.balance - reserved;

      if (amount > available)
        throw "Solde insuffisant";

      transaction.update(fromRef, {
        reservedBalance: reserved + amount,
        updatedAt: serverTimestamp()
      });

      transaction.set(txRef, {
        category: "transfer",
        type: "transfer",
        status: "pending",
        fromUserId: userId,
        toUserId: toWallet.userId,
        fromWalletId: walletId,
        toWalletId: toWalletId,
        currency: fromWallet.currency,
        amount: amount,
        participants: [userId, toWallet.userId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

    });

    loadingOverlay.classList.add("hidden");
    showSuccess();

  } catch (error) {

    loadingOverlay.classList.add("hidden");
    confirmBtn.disabled = false;
    showError(error);

  }

});

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

function showSuccess() {

  const modal = document.createElement("div");

  modal.className =
    "fixed inset-0 bg-black/40 flex items-center justify-center z-50";

  modal.innerHTML = `
    <div class="bg-white p-6 rounded-2xl shadow-xl text-center space-y-4">
      <i class="bi bi-check-circle text-green-500 text-4xl"></i>
      <div class="font-semibold text-gray-800">
        Transaction effectuée
      </div>
      <div class="text-sm text-gray-500">
        Votre virement est en attente de validation.
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => {
    modal.remove();
    location.reload();
  }, 2000);
}
