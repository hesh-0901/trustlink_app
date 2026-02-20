/**/
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

/* ELEMENTS */
const usernameInput = document.getElementById("usernameInput");
const previewBox = document.getElementById("previewBox");
const previewAvatar = document.getElementById("previewAvatar");
const previewName = document.getElementById("previewName");
const previewUsername = document.getElementById("previewUsername");
const addBtn = document.getElementById("addBtn");
const listContainer = document.getElementById("beneficiariesList");
const errorMsg = document.getElementById("errorMsg");

let selectedUser = null;

/* ===============================
   LOAD LIST
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
    const userSnap =
      await getDoc(doc(db, "users", data.beneficiaryId));

    if (!userSnap.exists()) continue;

    const user = userSnap.data();

    const div = document.createElement("div");
    div.className =
      "bg-white p-4 rounded-2xl shadow flex justify-between items-center";

    div.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}"
             class="w-10 h-10 rounded-full"/>
        <div>
          <p class="text-sm font-medium">
            ${user.firstName} ${user.lastName}
          </p>
          <p class="text-xs text-gray-500">
            ${user.username}
          </p>
        </div>
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
   USERNAME SEARCH
================================ */
usernameInput.addEventListener("blur", async () => {

  const username =
    usernameInput.value.trim().replace("@", "");

  if (!username) return;

  const q = query(
    collection(db, "users"),
    where("username", "==", username)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty)
    return showError("Utilisateur introuvable");

  const userDoc = snapshot.docs[0];
  const user = userDoc.data();

  if (userDoc.id === userId)
    return showError("Impossible d'ajouter soi-même");

  /* Vérifier doublon */
  const existingQuery = query(
    collection(db, "beneficiaries"),
    where("userId", "==", userId),
    where("beneficiaryId", "==", userDoc.id)
  );

  const existing = await getDocs(existingQuery);
  if (!existing.empty)
    return showError("Déjà ajouté");

  selectedUser = {
    id: userDoc.id,
    ...user
  };

  previewAvatar.src =
    `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}`;

  previewName.textContent =
    `${user.firstName} ${user.lastName}`;

  previewUsername.textContent =
    user.username;

  previewBox.classList.remove("hidden");
  addBtn.classList.remove("hidden");
  errorMsg.classList.add("hidden");
});

/* ===============================
   ADD CONFIRM
================================ */
addBtn.addEventListener("click", async () => {

  if (!selectedUser) return;

  await addDoc(collection(db, "beneficiaries"), {
    userId,
    beneficiaryId: selectedUser.id,
    createdAt: serverTimestamp()
  });

  usernameInput.value = "";
  previewBox.classList.add("hidden");
  addBtn.classList.add("hidden");
  selectedUser = null;

  loadBeneficiaries();
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
  previewBox.classList.add("hidden");
  addBtn.classList.add("hidden");
}
