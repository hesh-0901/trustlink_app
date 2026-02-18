import { db } from "../js/firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp,
  addDoc
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
   LOAD WALLETS
================================ */

const walletSelect = document.getElementById("walletSelect");

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
    option.textContent = `${wallet.currency} - ${wallet.walletAddress}`;

    walletSelect.appendChild(option);
  });
}

loadWallets();

/* ===============================
   FORM HANDLER
================================ */

const form = document.getElementById("depositForm");
const errorMsg = document.getElementById("errorMsg");
const submitBtn = document.getElementById("submitBtn");
const btnText = document.getElementById("btnText");
const btnSpinner = document.getElementById("btnSpinner");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const walletId = walletSelect.value;
  const method = document.getElementById("methodSelect").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const motif = document.getElementById("motif").value.trim();

  /* ===============================
     VALIDATION
  ================================= */

  if (!walletId || !method || !amount || amount <= 0 || !motif) {
    return showError("Tous les champs sont obligatoires.");
  }

  try {

    setLoading(true);

    const walletRef = doc(db, "wallets", walletId);

    await runTransaction(db, async (transaction) => {

      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists()) {
        throw "Wallet introuvable.";
      }

      const walletData = walletDoc.data();

      if (walletData.userId !== userId) {
        throw "Accès interdit.";
      }

      const newBalance = walletData.balance + amount;

      /* UPDATE WALLET */
      transaction.update(walletRef, {
        balance: newBalance,
        updatedAt: serverTimestamp()
      });

      /* CREATE TRANSACTION */
      const txRef = doc(collection(db, "transactions"));

      transaction.set(txRef, {
        type: "deposit",
        userId,
        walletId,
        currency: walletData.currency,
        method,
        amount,
        motif,
        participants: [userId],
        createdAt: serverTimestamp()
      });

    });

    form.reset();
    setLoading(false);
    alert("Dépôt effectué avec succès.");

  } catch (error) {
    console.error(error);
    setLoading(false);
    showError("Erreur lors du dépôt.");
  }

});

/* ===============================
   UI HELPERS
================================ */

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}

function setLoading(state) {
  submitBtn.disabled = state;
  btnSpinner.classList.toggle("hidden", !state);
  btnText.textContent = state ? "Traitement..." : "Confirmer dépôt";
}
