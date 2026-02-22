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

/* ELEMENTS */
const walletSelect = document.getElementById("walletSelect");
const beneficiarySelect = document.getElementById("beneficiarySelect");
const manualWallet = document.getElementById("manualWallet");
const amountInput = document.getElementById("amount");
const currencyTag = document.getElementById("currencyTag");
const summaryBox = document.getElementById("summaryBox");
const confirmBtn = document.getElementById("confirmBtn");
const errorMsg = document.getElementById("errorMsg");

const walletBalance = document.getElementById("walletBalance");
const walletReserved = document.getElementById("walletReserved");
const walletAvailable = document.getElementById("walletAvailable");
const walletCurrency = document.getElementById("walletCurrency");

let selectedWallet = null;
let selectedRecipient = null;

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

  for (const docSnap of snapshot.docs) {

    const beneficiaryId = docSnap.data().beneficiaryId;
    const userSnap = await getDoc(doc(db, "users", beneficiaryId));

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

  walletCurrency.textContent = selectedWallet.currency;
  walletBalance.textContent = selectedWallet.balance;
  walletReserved.textContent = reserved;
  walletAvailable.textContent = available;
  currencyTag.textContent = selectedWallet.currency;
});

/* ===============================
   BENEFICIARY SELECT
================================ */
beneficiarySelect.addEventListener("change", async () => {

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

  selectedRecipient = snapshot.docs[0].data();
  manualWallet.value = selectedRecipient.walletAddress;
});

/* ===============================
   SUMMARY UPDATE
================================ */
amountInput.addEventListener("input", updateSummary);

function updateSummary() {

  if (!selectedWallet || !amountInput.value) {
    summaryBox.classList.add("hidden");
    return;
  }

  summaryBox.innerHTML = `
    <div><strong>Montant:</strong> ${amountInput.value} ${selectedWallet.currency}</div>
    <div><strong>Disponible après:</strong>
      ${(selectedWallet.balance - (selectedWallet.reservedBalance || 0) - amountInput.value)}
    </div>
  `;

  summaryBox.classList.remove("hidden");
}

/* ===============================
   CONFIRM
================================ */
confirmBtn.addEventListener("click", async () => {

  const amount = parseFloat(amountInput.value);
  const recipientAddress = manualWallet.value.trim();

  if (!selectedWallet || !recipientAddress || !amount)
    return showError("Champs requis");

  try {

    const fromRef = doc(db, "wallets", walletSelect.value);
    const txRef = doc(collection(db, "transactions"));

    await runTransaction(db, async (transaction) => {

  const fromRef = doc(db, "wallets", walletSelect.value);
  const toRef = doc(db, "wallets", recipientAddress);
  const txRef = doc(collection(db, "transactions"));

  /* =========================
     🔹 TOUS LES READS D'ABORD
  ========================= */

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

  /* =========================
     🔹 ENSUITE LES WRITES
  ========================= */

  transaction.update(fromRef, {
    reservedBalance: reserved + amount,
    updatedAt: serverTimestamp()
  });

      transaction.set(txRef, {
        category: "transfer", // 🔥 OBLIGATOIRE pour les rules
        type: "transfer",
      
        status: "pending",
      
        fromUserId: userId,
        toUserId: toWallet.userId,
      
        fromWalletId: walletSelect.value,
        toWalletId: recipientAddress,
      
        currency: fromWallet.currency,
        amount: amount,
      
        motifType: document.getElementById("motifType").value,
        customMotif: document.getElementById("customMotif").value || "Transfert",
      
        participants: [userId, toWallet.userId],
      
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

});

    alert("Virement en attente ✔️");
    location.reload();

  } catch (error) {
    showError(error);
  }

});

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}
