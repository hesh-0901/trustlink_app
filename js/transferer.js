import { db } from "../js/firebase-init.js";
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
   LOAD USER WALLETS
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
    option.textContent = `${wallet.currency} - Solde: ${wallet.balance}`;

    walletSelect.appendChild(option);
  });
}

loadWallets();

/* ===============================
   FORM HANDLER
================================ */

const form = document.getElementById("transferForm");
const errorMsg = document.getElementById("errorMsg");
const submitBtn = document.getElementById("submitBtn");
const btnText = document.getElementById("btnText");
const btnSpinner = document.getElementById("btnSpinner");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const walletId = walletSelect.value;
  const recipientPhone = document.getElementById("recipientPhone").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const motif = document.getElementById("motif").value.trim();

  if (!walletId || !recipientPhone || !amount || amount <= 0 || !motif) {
    return showError("Tous les champs sont obligatoires.");
  }

  if (recipientPhone === userId) {
    return showError("Vous ne pouvez pas vous transférer à vous-même.");
  }

  try {

    setLoading(true);

    const senderWalletRef = doc(db, "wallets", walletId);

    await runTransaction(db, async (transaction) => {

      const senderWalletDoc = await transaction.get(senderWalletRef);

      if (!senderWalletDoc.exists()) throw "Wallet introuvable.";

      const senderData = senderWalletDoc.data();

      if (senderData.userId !== userId)
        throw "Accès interdit.";

      if (senderData.balance < amount)
        throw "Solde insuffisant.";

      /* FIND RECIPIENT WALLET */

      const recipientWalletQuery = query(
        collection(db, "wallets"),
        where("userId", "==", recipientPhone),
        where("currency", "==", senderData.currency)
      );

      const recipientSnapshot = await getDocs(recipientWalletQuery);

      if (recipientSnapshot.empty)
        throw "Bénéficiaire introuvable.";

      const recipientWalletDoc = recipientSnapshot.docs[0];
      const recipientWalletRef = recipientWalletDoc.ref;
      const recipientData = recipientWalletDoc.data();

      /* UPDATE BALANCES */

      transaction.update(senderWalletRef, {
        balance: senderData.balance - amount,
        updatedAt: serverTimestamp()
      });

      transaction.update(recipientWalletRef, {
        balance: recipientData.balance + amount,
        updatedAt: serverTimestamp()
      });

      /* CREATE TRANSACTION */

      const txRef = doc(collection(db, "transactions"));

      transaction.set(txRef, {
        type: "transfer",
        fromUserId: userId,
        toUserId: recipientPhone,
        walletId,
        currency: senderData.currency,
        amount,
        motif,
        participants: [userId, recipientPhone],
        createdAt: serverTimestamp()
      });

    });

    form.reset();
    setLoading(false);
    alert("Transfert effectué avec succès.");

  } catch (error) {
    console.error(error);
    setLoading(false);
    showError(error.toString());
  }

});

/* ===============================
   UI
================================ */

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}

function setLoading(state) {
  submitBtn.disabled = state;
  btnSpinner.classList.toggle("hidden", !state);
  btnText.textContent = state ? "Traitement..." : "Confirmer transfert";
}
