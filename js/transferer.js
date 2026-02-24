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

/* ===============================
   SESSION
================================ */
const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId)
  window.location.href = "/trustlink_app/index.html";

/* ===============================
   ELEMENTS
================================ */
const walletSelect = document.getElementById("walletSelect");
const beneficiarySelect = document.getElementById("beneficiarySelect");
const manualWallet = document.getElementById("manualWallet");
const amountInput = document.getElementById("amount");
const currencyTag = document.getElementById("currencyTag");
const confirmBtn = document.getElementById("confirmBtn");
const errorMsg = document.getElementById("errorMsg");
const balanceInfo = document.getElementById("balanceInfo");
const walletReserved = document.getElementById("walletReserved");
const walletAvailable = document.getElementById("walletAvailable");
const transactionType = document.getElementById("transactionType");
const transactionMotif = document.getElementById("transactionMotif");

const confirmModal = document.getElementById("confirmModal");
const confirmDetails = document.getElementById("confirmDetails");
const cancelConfirm = document.getElementById("cancelConfirm");
const validateConfirm = document.getElementById("validateConfirm");
const loadingOverlay = document.getElementById("loadingOverlay");

const modeFriend = document.getElementById("modeFriend");
const modeManual = document.getElementById("modeManual");
const friendSection = document.getElementById("friendSection");
const manualSection = document.getElementById("manualSection");

/* ===============================
   STATE
================================ */
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
   LOAD BENEFICIARIES
================================ */
async function loadBeneficiaries() {

  const q = query(
    collection(db, "beneficiaries"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);

  beneficiarySelect.innerHTML =
    '<option value="">Choisir un bénéficiaire</option>';

  for (const docSnap of snapshot.docs) {

    const beneficiaryId =
      docSnap.data().beneficiaryId;

    const userSnap =
      await getDoc(doc(db, "users", beneficiaryId));

    if (!userSnap.exists()) continue;

    const user = userSnap.data();

    const option = document.createElement("option");
    option.value = beneficiaryId;
    option.textContent =
      `${user.firstName} ${user.lastName}`;

    beneficiarySelect.appendChild(option);
  }
}

loadBeneficiaries();

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

  walletReserved.textContent = reserved;
  walletAvailable.textContent = available;
  currencyTag.textContent = selectedWallet.currency;

  balanceInfo.classList.remove("hidden");
});

/* ===============================
   MODE SWITCH
================================ */
modeFriend.addEventListener("click", () => {

  modeFriend.classList.remove("bg-gray-200", "text-gray-600");
  modeFriend.classList.add("bg-blue-600", "text-white");

  modeManual.classList.remove("bg-blue-600", "text-white");
  modeManual.classList.add("bg-gray-200", "text-gray-600");

  friendSection.classList.remove("hidden");
  manualSection.classList.add("hidden");
});

modeManual.addEventListener("click", () => {

  modeManual.classList.remove("bg-gray-200", "text-gray-600");
  modeManual.classList.add("bg-blue-600", "text-white");

  modeFriend.classList.remove("bg-blue-600", "text-white");
  modeFriend.classList.add("bg-gray-200", "text-gray-600");

  friendSection.classList.add("hidden");
  manualSection.classList.remove("hidden");
});

/* ===============================
   AUTO FILL FRIEND WALLET
================================ */
beneficiarySelect.addEventListener("change", async () => {

  if (!selectedWallet) {
    showError("Choisissez un compte d'abord");
    return;
  }

  const beneficiaryId = beneficiarySelect.value;
  if (!beneficiaryId) return;

  const q = query(
    collection(db, "wallets"),
    where("userId", "==", beneficiaryId),
    where("currency", "==", selectedWallet.currency)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty)
    return showError("Pas de wallet compatible");

  manualWallet.value = snapshot.docs[0].id;
});

/* ===============================
   CONTINUER → CONFIRMATION
================================ */
confirmBtn.addEventListener("click", () => {

  const amount = parseFloat(amountInput.value);
  const toWalletId = manualWallet.value.trim();

  if (!selectedWallet || !amount || !toWalletId)
    return showError("Champs requis");

  confirmDetails.innerHTML = `
    <div><strong>De :</strong> ${selectedWallet.walletAddress}</div>
    <div><strong>Vers :</strong> ${toWalletId}</div>
    <div><strong>Montant :</strong> ${amount} ${selectedWallet.currency}</div>
    <div><strong>Type :</strong> ${transactionType.value}</div>
<div><strong>Motif :</strong> ${transactionMotif.value || "Non spécifié"}</div>
  `;

  confirmModal.classList.remove("hidden");
});

/* ===============================
   CANCEL CONFIRM
================================ */
cancelConfirm.addEventListener("click", () => {
  confirmModal.classList.add("hidden");
});

/* ===============================
   VALIDATE
================================ */
validateConfirm.addEventListener("click", async () => {

  const amount = parseFloat(amountInput.value);
  const walletId = walletSelect.value;
  const toWalletId = manualWallet.value.trim();

  try {

    confirmModal.classList.add("hidden");
    loadingOverlay.classList.remove("hidden");

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
  type: transactionType.value,
  status: "pending",

  fromUserId: userId,
  toUserId: toWallet.userId,

  fromWalletId: walletId,
  toWalletId: toWalletId,

  currency: fromWallet.currency,
  amount: amount,

  motifType: transactionType.value,
  customMotif: transactionMotif.value || "Transfert",

  participants: [userId, toWallet.userId],

  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});

    });

    location.reload();

  } catch (error) {

    loadingOverlay.classList.add("hidden");
    showError(error);

  }

});

/* ===============================
   ERROR HANDLER
================================ */
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}
