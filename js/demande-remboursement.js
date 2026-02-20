import { db } from "./firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId)
  window.location.href = "/trustlink_app/index.html";

const walletSelect = document.getElementById("walletSelect");
const beneficiarySelect = document.getElementById("beneficiarySelect");
const manualUser = document.getElementById("manualUser");
const amountInput = document.getElementById("amount");
const motifInput = document.getElementById("motif");
const summaryBox = document.getElementById("summaryBox");
const confirmBtn = document.getElementById("confirmBtn");
const errorMsg = document.getElementById("errorMsg");
const currencyTag = document.getElementById("currencyTag");

let selectedCurrency = null;
let selectedUserId = null;

/* LOAD WALLETS */
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
    option.value = wallet.currency;
    option.textContent = wallet.currency;
    walletSelect.appendChild(option);
  });
}

loadWallets();

/* LOAD BENEFICIARIES */
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
    option.textContent = `${user.firstName} ${user.lastName}`;

    beneficiarySelect.appendChild(option);
  }
}

loadBeneficiaries();

/* EVENTS */
walletSelect.addEventListener("change", () => {
  selectedCurrency = walletSelect.value;
  currencyTag.textContent = selectedCurrency || "";
  updateSummary();
});

beneficiarySelect.addEventListener("change", () => {
  selectedUserId = beneficiarySelect.value;
  manualUser.value = "";
});

manualUser.addEventListener("blur", async () => {

  const username = manualUser.value.trim();
  if (!username) return;

  const q = query(
    collection(db, "users"),
    where("username", "==", username)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty)
    return showError("Utilisateur introuvable");

  const userDoc = snapshot.docs[0];

  if (userDoc.id === userId)
    return showError("Impossible de se demander à soi-même");

  selectedUserId = userDoc.id;
  beneficiarySelect.value = "";
});

/* SUMMARY */
amountInput.addEventListener("input", updateSummary);

function updateSummary() {

  if (!selectedCurrency || !amountInput.value) {
    summaryBox.classList.add("hidden");
    return;
  }

  summaryBox.innerHTML = `
    <div><strong>Montant :</strong> ${amountInput.value} ${selectedCurrency}</div>
    <div><strong>Type :</strong> Demande de remboursement</div>
  `;

  summaryBox.classList.remove("hidden");
}

/* CONFIRM */
confirmBtn.addEventListener("click", async () => {

  const amount = parseFloat(amountInput.value);
  const motif = motifInput.value.trim();

  if (!selectedCurrency || !selectedUserId || !amount || amount <= 0)
    return showError("Champs requis");

  try {

    await addDoc(collection(db, "transactions"), {

      category: "request",
      type: "repayment_request",

      fromUserId: userId,
      toUserId: selectedUserId,

      fromWalletId: null,
      toWalletId: null,

      currency: selectedCurrency,
      amount,
      motif,

      status: "pending",

      participants: [userId, selectedUserId],

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    alert("Demande envoyée ✔️");
    window.location.href = "/trustlink_app/dashboard.html";

  } catch (error) {
    console.error(error);
    showError("Erreur lors de l'envoi");
  }

});

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}
