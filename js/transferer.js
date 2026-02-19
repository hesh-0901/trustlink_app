import { db } from "../js/firebase-init.js";
import {
collection,
query,
where,
getDocs,
doc,
getDoc,
setDoc,
runTransaction,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* SESSION */
const userId =
localStorage.getItem("userId") ||
sessionStorage.getItem("userId");

if (!userId) {
window.location.href = "/trustlink_app/index.html";
}

/* ELEMENTS */
const walletSelect = document.getElementById("walletSelect");
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

let recipientWalletData = null;

/* LOAD USER WALLETS */
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
`${wallet.walletAddress} (${wallet.currency}) - ${wallet.balance}`;
walletSelect.appendChild(option);
});
}

loadWallets();

/* LIVE VALIDATION DESTINATION */
recipientInput.addEventListener("input", async () => {

const walletAddress = recipientInput.value.trim();

if (walletAddress.length < 8) {
recipientPreview.classList.add("hidden");
return;
}

const walletRef = doc(db, "wallets", walletAddress);
const walletSnap = await getDoc(walletRef);

if (!walletSnap.exists()) {
recipientPreview.classList.add("hidden");
recipientWalletData = null;
return;
}

const wallet = walletSnap.data();

if (wallet.userId === userId) {
recipientPreview.classList.add("hidden");
recipientWalletData = null;
return;
}

const userRef = doc(db, "users", wallet.userId);
const userSnap = await getDoc(userRef);

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
});

/* TYPE COLOR SYSTEM */
const motifTypeSelect = document.getElementById("motifType");
const typePreview = document.getElementById("typePreview");
const typeIcon = document.getElementById("typeIcon");
const typeText = document.getElementById("typeText");

const typeConfig = {
standard: {
text: "Virement standard",
icon: "bi-arrow-left-right",
class: "bg-blue-50 text-blue-600"
},
loan: {
text: "Prêt personnel",
icon: "bi-cash-coin",
class: "bg-purple-50 text-purple-600"
},
repayment: {
text: "Remboursement de dette",
icon: "bi-check-circle",
class: "bg-green-50 text-green-600"
},
engagement: {
text: "Engagement financier",
icon: "bi-file-earmark-text",
class: "bg-orange-50 text-orange-600"
}
};

motifTypeSelect.addEventListener("change", () => {

const selected = motifTypeSelect.value;

if (!selected || !typeConfig[selected]) {
typePreview.classList.add("hidden");
return;
}

const config = typeConfig[selected];

typePreview.className =
`flex items-center gap-2 mt-3 px-4 py-3 rounded-xl text-sm font-medium ${config.class}`;

typeIcon.className = `bi ${config.icon}`;
typeText.textContent = config.text;
typePreview.classList.remove("hidden");
});

/* SUBMIT */
form.addEventListener("submit", async (e) => {
e.preventDefault();

const walletId = walletSelect.value;
const amount = parseFloat(document.getElementById("amount").value);
const motifType = motifTypeSelect.value;
const customMotif =
document.getElementById("customMotif").value.trim();

if (!walletId || !recipientWalletData ||
!amount || amount <= 0 ||
!motifType || !customMotif) {
return showError("Tous les champs sont obligatoires.");
}

try {

setLoading(true);

const txRef = doc(collection(db, "transactions"));

await setDoc(txRef, {
type: "transfer",
status: "pending",
fromUserId: userId,
toUserId: recipientWalletData.userId,
fromWalletId: walletId,
toWalletId: recipientWalletData.walletAddress,
currency: recipientWalletData.currency,
amount,
motifType,
customMotif,
participants: [userId, recipientWalletData.userId],
createdAt: serverTimestamp(),
updatedAt: serverTimestamp()
});

/* CREATE NOTIFICATION */
await setDoc(
doc(collection(db, "notifications")),
{
userId: recipientWalletData.userId,
type: "transfer_pending",
transactionId: txRef.id,
isRead: false,
createdAt: serverTimestamp()
}
);

form.reset();
recipientPreview.classList.add("hidden");
setLoading(false);

alert("Transfert en attente.");

} catch (error) {
console.error(error);
setLoading(false);
showError("Erreur transfert.");
}

});

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