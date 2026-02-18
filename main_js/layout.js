async function loadHeader() {

  const headerContainer = document.getElementById("header-container");
  if (!headerContainer) return;

  const res = await fetch("/trustlink_app/partials/header.html");
  const html = await res.text();

  headerContainer.innerHTML = html;

  await new Promise(resolve => setTimeout(resolve, 50));

  await import("/trustlink_app/main_js/header.js");
}

async function loadNavbar() {

  const navContainer = document.getElementById("navbar-container");
  if (!navContainer) return;

  const res = await fetch("/trustlink_app/partials/nav.html");
  const html = await res.text();

  navContainer.innerHTML = html;
}
/* ===============================
   NOUVEAU
================================ */

function setActiveNav() {

  const links = document.querySelectorAll(".nav-link");
  const currentPath = window.location.pathname;

  links.forEach(link => {

    if (link.getAttribute("href") === currentPath) {
      link.classList.add("text-primaryStrong");
    }

  });
}

document.addEventListener("DOMContentLoaded", () => {
  setActiveNav();
});

/* ===============================
   INIT
================================ */

document.addEventListener("DOMContentLoaded", async () => {
  await loadHeader();
  await loadNavbar();
});
