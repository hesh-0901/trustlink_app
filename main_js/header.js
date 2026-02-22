<header class="bg-gradient-to-r from-[#0F1ACD] via-[#1E2BE0] to-[#3D4BFF]
               px-5 pt-4 pb-4 text-white shadow-md">

  <div class="flex items-center justify-between">

    <!-- LEFT -->
    <div class="flex items-center gap-3">

      <img id="userAvatar"
           class="w-10 h-10 rounded-full object-cover
                  border border-white/40 shadow-sm"/>

      <div class="leading-tight">
        <p class="text-xs opacity-80">
          GM 👋
        </p>

        <p id="firstNameText"
           class="text-sm font-semibold tracking-tight">
          User
        </p>

        <p id="usernameText"
           class="text-[10px] opacity-60">
          @username
        </p>
      </div>

    </div>

    <!-- RIGHT -->
    <div class="flex items-center gap-4">

      <!-- Notification -->
      <div class="relative cursor-pointer">
        <i class="bi bi-bell text-lg"></i>
        <span id="notificationBadge"
              class="absolute -top-1 -right-2
                     bg-red-500 text-white
                     text-[9px] px-1 py-[1px]
                     rounded-full font-semibold">
          0
        </span>
      </div>

      <!-- Logout -->
      <button id="logoutBtn"
              class="bg-white/10 hover:bg-white/20
                     p-2 rounded-lg transition">
        <i class="bi bi-box-arrow-right text-base"></i>
      </button>

    </div>

  </div>

</header>
