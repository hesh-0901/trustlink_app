import { db } from "./firebase-init.js";
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* SESSION */
const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId)
  window.location.href = "/trustlink_app/index.html";

const input = document.getElementById("beneficiaryInput");
const addBtn = document.getElementById("addBtn");
const listContainer = document.getElementById("beneficiariesList");
const errorMsg = document.getElementById("errorMsg");

/* ===============================
   LOAD BENEFICIARIES
================================ */
async function loadBeneficiaries() {

  const q = query(
    collection(db, "beneficiaries"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);

  listContainer.innerHTML = "";

  for (const docSnap of snapshot.docs) {

    const data = docSnap.data();
    const beneficiaryId = data.beneficiaryId;

    const userSnap =
      await getDoc(doc(db, "users", beneficiaryId));

    if (!userSnap.exists()) continue;

    const user = userSnap.data();

    const div = document.createElement("div");
    div.className =
      "bg-white p-4 rounded-2xl shadow flex justify-between items-center";

    div.innerHTML = `
      <div>
        <p class="text-sm font-medium">
          ${user.firstName} ${user.lastName}
        </p>
        <p class="text-xs text-gray-500">
          ${user.username}
        </p>
      </div>
      <button
        onclick="removeBeneficiary('${docSnap.id}')"
        class="text-red-500 text-sm">
        Supprimer
      </button>
    `;

    listContainer.appendChild(div);
  }
}

loadBeneficiaries();

/* ===============================
   ADD BENEFICIARY
================================ */
addBtn.addEventListener("click", async () => {

  const walletAddress = input.value.trim();
  if (!walletAddress)
    return showError("Adresse requise");

  try {

    const walletSnap =
      await getDoc(doc(db, "wallets", walletAddress));

    if (!walletSnap.exists())
      return showError("Wallet introuvable");

    const wallet = walletSnap.data();

    if (wallet.userId === userId)
      return showError("Impossible d'ajouter soi-même");

    /* Vérifier doublon */
    const q = query(
      collection(db, "beneficiaries"),
      where("userId", "==", userId),
      where("beneficiaryId", "==", wallet.userId)
    );

    const existing = await getDocs(q);

    if (!existing.empty)
      return showError("Déjà ajouté");

    await addDoc(collection(db, "beneficiaries"), {
      userId,
      beneficiaryId: wallet.userId,
      createdAt: serverTimestamp()
    });

    input.value = "";
    errorMsg.classList.add("hidden");
    loadBeneficiaries();

  } catch (error) {
    console.error(error);
    showError("Erreur ajout");
  }
});

/* ===============================
   REMOVE
================================ */
async function removeBeneficiary(docId) {

  await deleteDoc(doc(db, "beneficiaries", docId));
  loadBeneficiaries();
}

window.removeBeneficiary = removeBeneficiary;

/* ===============================
   ERROR
================================ */
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}
