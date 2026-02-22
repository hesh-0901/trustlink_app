import { db } from "../js/firebase-init.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

(async function initHeader() {

  try {

    /* ===============================
       SESSION CHECK
    ================================= */

    const userId =
      localStorage.getItem("userId") ||
      sessionStorage.getItem("userId");

    if (!userId) {
      window.location.href = "/trustlink_app/index.html";
      return;
    }

    /* ===============================
       FETCH USER
    ================================= */

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/trustlink_app/index.html";
      return;
    }

    const userData = userSnap.data();

    /* ===============================
       INJECT USER DATA
    ================================= */

    const firstNameEl = document.getElementById("user-firstname");
    const usernameEl = document.getElementById("user-username");
    const avatarEl = document.getElementById("user-avatar");

    if (firstNameEl) firstNameEl.textContent = userData.firstName;
    if (usernameEl) usernameEl.textContent = userData.username;

    /* ===============================
       AVATAR
    ================================= */

/* ===============================
    AVATAR (NOUVEAU - STYLE CORPORATE)
================================= */

// On utilise 'avataaars' qui est le standard pour le look professionnel moderne
const avatarStyle = "avataaars";

// Paramètres pour forcer le look "Business/Executive"
// clothing: blazerShirt (blazer), graphicShirt (plus décontracté chic), shirtCrewNeck
const businessOptions = [
  "accessoriesProbability=0", // Moins de gadgets pour rester sérieux
  "clothing=blazerShirt,shirtCrewNeck,shirtVNeck", // Tenues pro uniquement
  "clothingColor=262e33,65c9ff,f4f4f4", // Couleurs sobres : gris sombre, bleu ciel, blanc
  "top=shortHair,longHair,sides,shavedSides", // Coiffures propres
  "backgroundType=solid,gradientLinear", // Fond propre
  "backgroundColor=b6e3f4,c0aede,d1d5db" // Couleurs de fond premium/sobres
].join("&");

// Construction de l'URL avec le seed unique (username)
const avatarUrl = 
  `https://api.dicebear.com/7.x/${avatarStyle}/svg?` + 
  `seed=${encodeURIComponent(userData.username)}&` + 
  `${businessOptions}`;

// Note : J'utilise .svg pour une netteté parfaite sur mobile (retina/OLED)
if (avatarEl) {
  avatarEl.src = avatarUrl;
  // Optionnel : Ajout d'une bordure fine pour le côté institutionnel
  avatarEl.style.border = "2px solid #1E2BE015"; 
  avatarEl.style.borderRadius = "50%";
}

    /* ===============================
       REAL-TIME NOTIFICATIONS
    ================================= */

    const badge = document.getElementById("notification-badge");

    if (badge) {

      const transactionsRef = collection(db, "transactions");

      const q = query(
        transactionsRef,
        where("participants", "array-contains", userId)
      );

      onSnapshot(q, (snapshot) => {

        const count = snapshot.size;

        if (count > 0) {
          badge.textContent = count > 9 ? "9+" : count;
          badge.classList.remove("hidden");
        } else {
          badge.classList.add("hidden");
        }

      });
    }

    /* ===============================
       LOGOUT
    ================================= */

    const logoutBtn = document.getElementById("logout-btn");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {

        localStorage.removeItem("userId");
        localStorage.removeItem("role");

        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("role");

        window.location.href = "/trustlink_app/index.html";

      });
    }

  } catch (error) {

    console.error("Header error:", error);

  }

})();
