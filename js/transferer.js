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

if (!userId) {
  window.location.href = "/trustlink_app/index.html";
}

/* ===============================
   ELEMENTS
================================ */
const walletSelect = document.getElementById("walletSelect");
const walletInfo = document.getElementById("walletInfo");
const recipientInput = document.getElementById("recipientWallet");
const recipientPreview = document.getElementById("recipientPreview");
const recipientAvatar = document.getElementById("recipientAvatar");
const recipientName = document.getElementById("recipientName");
const recipientUsername = document.getElementById("recipientUsername");
const errorMsg = document.getElementById("errorMsg");
const form = document.getElementById("transferForm");
const submitBtn = document.getElementById("submitBtn");
const btnText = document.getElementById("btnText");
const btnSpinner = document.getElementById("btnSpinner");

let selectedWallet = null;
let recipientWalletData = null;

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
      `${wallet.walletAddress} (${wallet.currency})`;

    walletSelect.appendChild(option);
  });
}

loadWallets();

/* ===============================
   WALLET CHANGE
================================ */
walletSelect.addEventListener("change", async () => {

  const walletId = walletSelect.value;
  if (!walletId) return;

  const walletDoc = await getDoc(doc(db, "wallets", walletId));
  if (!walletDoc.exists()) return;

  selectedWallet = walletDoc.data();

  const available =
    selectedWallet.balance - (selectedWallet.reservedBalance || 0);

  walletInfo.textContent =
    `Solde disponible : ${available} ${selectedWallet.currency}`;
});

/* ===============================
   DEST VALIDATION
================================ */
recipientInput.addEventListener("blur", async () => {

  const walletAddress = recipientInput.value.trim();
  if (!walletAddress) return;

  const walletSnap = await getDoc(doc(db, "wallets", walletAddress));

  if (!walletSnap.exists()) {
    hideRecipient();
    return showError("Wallet introuvable.");
  }

  const wallet = walletSnap.data();

  if (wallet.userId === userId) {
    hideRecipient();
    return showError("Impossible d'envoyer à soi-même.");
  }

  if (selectedWallet &&
      wallet.currency !== selectedWallet.currency) {
    hideRecipient();
    return showError("Devise incompatible.");
  }

  const userSnap =
    await getDoc(doc(db, "users", wallet.userId));

  if (!userSnap.exists()) return;

  const user = userSnap.data();

  recipientAvatar.src =
    `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}`;

  recipientName.textContent =
    `${user.firstName} ${user.lastName}`;

  recipientUsername.textContent =
    user.username;

  recipientPreview.classList.remove("hidden");
  recipientWalletData = wallet;
  errorMsg.classList.add("hidden");
});

function hideRecipient() {
  recipientPreview.classList.add("hidden");
  recipientWalletData = null;
}

/* ===============================
   SUBMIT
================================ */
form.addEventListener("submit", async (e) => {

  e.preventDefault();

  const walletId = walletSelect.value;
  const amount = parseFloat(document.getElementById("amount").value);
  const motifType = document.getElementById("motifType").value;
  const customMotif =
    document.getElementById("customMotif").value.trim();

  if (!walletId ||
      !recipientWalletData ||
      !amount ||
      amount <= 0 ||
      !motifType ||
      !customMotif) {
    return showError("Tous les champs sont obligatoires.");
  }

  try {

    setLoading(true);

    const fromWalletRef = doc(db, "wallets", walletId);
    const txRef = doc(collection(db, "transactions"));

    await runTransaction(db, async (transaction) => {

      const fromDoc = await transaction.get(fromWalletRef);
      if (!fromDoc.exists())
        throw "Wallet introuvable";

      const fromWallet = fromDoc.data();

      const reserved =
        fromWallet.reservedBalance || 0;

      const available =
        fromWallet.balance - reserved;

      if (amount > available)
        throw "Solde insuffisant";

      /* 🔒 Reserve funds */
      transaction.update(fromWalletRef, {
        reservedBalance: reserved + amount,
        updatedAt: serverTimestamp()
      });

      /* 📝 Create transaction */
      transaction.set(txRef, {
        type: "transfer",
        status: "pending",
        fromUserId: userId,
        toUserId: recipientWalletData.userId,
        fromWalletId: walletId,
        toWalletId: recipientWalletData.walletAddress,
        currency: fromWallet.currency,
        amount,
        motifType,
        customMotif,
        participants: [userId, recipientWalletData.userId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

    });

    form.reset();
    hideRecipient();
    setLoading(false);
    alert("Transfert en attente ✔️");

  } catch (error) {
    console.error(error);
    setLoading(false);
    showError(error);
  }
});

/* ===============================
   HELPERS
================================ */
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}

function setLoading(state) {
  submitBtn.disabled = state;
  btnSpinner.classList.toggle("hidden", !state);
  btnText.textContent =
    state ? "Traitement..." : "Confirmer transfert";
}
