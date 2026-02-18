import { db } from "../js/firebase-init.js";
import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   HASH
================================ */
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ===============================
   RANDOM STRING
================================ */
function randomBlock(length = 4) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/* ===============================
   REMOVE ACCENTS
================================ */
function cleanString(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

/* ===============================
   REGISTER
================================ */
const form = document.getElementById("registerForm");
const errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const birthDate = document.getElementById("birthDate").value;
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if (!firstName || !lastName || !birthDate || !phone || !password || !confirmPassword) {
    return showError("Tous les champs sont obligatoires.");
  }

  if (password !== confirmPassword) {
    return showError("Les mots de passe ne correspondent pas.");
  }

  try {

    // Vérifie si user existe déjà
    const existingUser = await getDoc(doc(db, "users", phone));
    if (existingUser.exists()) {
      return showError("Ce numéro est déjà enregistré.");
    }

    const salt = randomBlock(16);
    const passwordHash = await hashPassword(password, salt);

    // USERNAME
    const cleanFirst = cleanString(firstName);
    const cleanLast = cleanString(lastName);

    const partFirst = (cleanFirst.slice(0,2) || "XX").padEnd(2,"X");
    const partLast = (cleanLast.slice(0,2) || "XX").padEnd(2,"X");

    const day = birthDate.split("-")[2];

    const username = `TL-${partFirst}${partLast}${day}`;

    // WALLET BASE
    const walletBase = `TL-${randomBlock()}-${randomBlock()}`;

    /* ===============================
       CREATE USER
    ================================= */
    await setDoc(doc(db, "users", phone), {
      firstName,
      lastName,
      birthDate,
      phoneNumber: phone,
      username,
      walletBase,
      role: "user",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      passwordHash,
      salt
    });

    /* ===============================
       CREATE USD WALLET
    ================================= */
    await setDoc(doc(db, "wallets", `${walletBase}-01`), {
      userId: phone,
      walletBase,
      walletAddress: `${walletBase}-01`,
      currency: "USD",
      currencyCode: "01",
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    /* ===============================
       CREATE CDF WALLET
    ================================= */
    await setDoc(doc(db, "wallets", `${walletBase}-02`), {
      userId: phone,
      walletBase,
      walletAddress: `${walletBase}-02`,
      currency: "CDF",
      currencyCode: "02",
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    window.location.href = "/trustlink_app/index.html";

  } catch (error) {
    console.error(error);
    showError("Erreur lors de la création.");
  }

});

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}
