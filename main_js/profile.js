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

  const avatarLibraries = [
    "adventurer","adventurer-neutral","avataaars","avataaars-neutral",
    "big-ears","big-ears-neutral","big-smile","bottts","bottts-neutral",
    "croodles","croodles-neutral","fun-emoji","icons","identicon",
    "initials","lorelei","lorelei-neutral","micah","miniavs",
    "notionists","notionists-neutral","open-peeps","personas",
    "pixel-art","pixel-art-neutral","rings","shapes","thumbs"
  ];

  let selectedStyle = userData.avatarStyle || "micah";

  const avatarEl = document.getElementById("profile-avatar");
  const nameEl = document.getElementById("profile-name");
  const usernameEl = document.getElementById("profile-username");
  const optionsContainer = document.getElementById("avatar-options");
  const searchInput = document.getElementById("avatar-search");

  nameEl.textContent = userData.firstName;
  usernameEl.textContent = userData.username;

  function generateUrl(style) {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(userData.username)}&radius=50`;
  }

  function renderAvatars(filter = "") {
    optionsContainer.innerHTML = "";

    avatarLibraries
      .filter(style => style.includes(filter.toLowerCase()))
      .forEach(style => {

        const img = document.createElement("img");
        img.src = generateUrl(style);
        img.className =
          "w-16 h-16 rounded-full cursor-pointer border-2 transition";

        if (style === selectedStyle) {
          img.classList.add("border-[#1E2BE0]");
        } else {
          img.classList.add("border-transparent");
        }

        img.addEventListener("click", () => {
          selectedStyle = style;
          avatarEl.src = generateUrl(style);
          renderAvatars(searchInput.value);
        });

        optionsContainer.appendChild(img);

      });
  }

  avatarEl.src = generateUrl(selectedStyle);
  renderAvatars();

  searchInput.addEventListener("input", (e) => {
    renderAvatars(e.target.value);
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
