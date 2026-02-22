import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

document.addEventListener("DOMContentLoaded", async () => {
  const user = auth.currentUser;

  if (!user) return;

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();

    const firstName = data.firstName;
    const username = data.username;
    const gender = data.gender;

    // Injection texte
    document.getElementById("greetingDisplay").textContent = `Bonjour ${firstName}`;
    document.getElementById("usernameDisplay").textContent = username;

    // Avatar génération dynamique
    generateAvatar(firstName, gender);
  }
});

// Avatar generator
function generateAvatar(name, gender) {
  const baseUrl = "https://api.dicebear.com/7.x/";

  let style = gender === "Femme"
    ? "adventurer-neutral"
    : "adventurer";

  const avatarUrl = `${baseUrl}${style}/svg?seed=${name}&backgroundColor=0f172a`;

  document.getElementById("userAvatar").src = avatarUrl;
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/index.html";
});
