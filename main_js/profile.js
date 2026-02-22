import { db } from "../js/firebase-init.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

(async function initProfile() {

  const userId =
    localStorage.getItem("userId") ||
    sessionStorage.getItem("userId");

  if (!userId) {
    window.location.href = "/trustlink_app/index.html";
    return;
  }

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    window.location.href = "/trustlink_app/index.html";
    return;
  }

  const userData = userSnap.data();

  const avatarStyles = [
    "avataaars-neutral",
    "personas",
    "micah"
  ];

  let selectedStyle = userData.avatarStyle || "avataaars-neutral";

  const avatarEl = document.getElementById("profile-avatar");
  const nameEl = document.getElementById("profile-name");
  const usernameEl = document.getElementById("profile-username");
  const optionsContainer = document.getElementById("avatar-options");

  nameEl.textContent = userData.firstName;
  usernameEl.textContent = userData.username;

  function generateUrl(style) {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(userData.username)}&radius=50`;
  }

  avatarEl.src = generateUrl(selectedStyle);

  avatarStyles.forEach(style => {

    const img = document.createElement("img");
    img.src = generateUrl(style);
    img.className =
      "w-16 h-16 rounded-full cursor-pointer border-2";

    if (style === selectedStyle) {
      img.classList.add("border-[#1E2BE0]");
    } else {
      img.classList.add("border-transparent");
    }

    img.addEventListener("click", () => {
      selectedStyle = style;
      avatarEl.src = generateUrl(style);

      document.querySelectorAll("#avatar-options img")
        .forEach(i => i.classList.remove("border-[#1E2BE0]"));

      img.classList.add("border-[#1E2BE0]");
    });

    optionsContainer.appendChild(img);

  });

  document.getElementById("save-avatar")
    .addEventListener("click", async () => {

      await updateDoc(userRef, {
        avatarStyle: selectedStyle,
        updatedAt: new Date()
      });

      alert("Avatar mis à jour ✔️");

    });

})();
