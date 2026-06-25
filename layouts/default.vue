<template>
  <div id="app">
    <header class="header">
      <div class="nav-container">
        <div class="nav-content">
          <!-- Logo -->
          <div class="flex items-start">
            <img src="/images/Logo.webp" alt="Onmyoji Logo" />
          </div>

          <!-- Nav -->
          <nav>
            <div class="nav-menu">
              <NuxtLink to="/" class="nav-item">ExpLore</NuxtLink>
              <!-- Dropdown -->
              <div class="dropdown" @mouseleave="closeDropdown">
                <button
                  class="nav-item dropdown-toggle"
                  @mouseenter="openDropdown"
                  @click="toggleDropdown"
                >
                  Onmyoji
                  <span class="dropdown-arrow">▼</span>
                </button>

                <div class="dropdown-menu" :class="{ active: isDropdownOpen }">
                  <!-- Factions -->
                  <div class="dropdown-item">
                    <NuxtLink to="/onmyoji/Seimei" class="submenu-label">Seimei</NuxtLink>
                    <NuxtLink to="/onmyoji/Kagura" class="submenu-label">Kagura</NuxtLink>
                    <NuxtLink to="/onmyoji/Hiromasa" class="submenu-label"
                      >Hiromasa</NuxtLink
                    >
                    <NuxtLink to="/onmyoji/Yao_Bikuni" class="submenu-label"
                      >Yao Bikuni</NuxtLink
                    >
                    <NuxtLink to="/onmyoji/Minamoto_no_Yorimitsu" class="submenu-label"
                      >Yorimitsu</NuxtLink
                    >
                    <NuxtLink to="/onmyoji/Fujiwara_no_Michinaga" class="submenu-label"
                      >Michinaga</NuxtLink
                    >
                  </div>
                </div>
              </div>

              <NuxtLink to="/shikigami" class="nav-item">Shikigami</NuxtLink>
              <NuxtLink to="/souls" class="nav-item">Souls</NuxtLink>
              <NuxtLink to="/pets" class="nav-item">Pets</NuxtLink>
            </div>
          </nav>
        </div>
      </div>
    </header>

    <div v-show="showStickyNav" class="sticky-nav">
      <div class="nav-container">
        <div class="nav-content sticky-content">
          <!-- Logo -->
          <div class="flex items-start">
            <img src="/images/Logo.webp" alt="Onmyoji Logo" />
          </div>

          <!-- Nav -->
          <nav>
            <div class="nav-menu">
              <NuxtLink to="/" class="nav-item"> Explore </NuxtLink>

              <div class="dropdown" @mouseleave="closeDropdown">
                <button
                  class="nav-item dropdown-toggle"
                  @mouseenter="openDropdown"
                  @click="toggleDropdown"
                >
                  Onmyoji
                  <span class="dropdown-arrow"> ▼ </span>
                </button>

                <div class="dropdown-menu" :class="{ active: isDropdownOpen }">
                  <div class="dropdown-item">
                    <NuxtLink to="/onmyoji/Seimei" class="submenu-label">
                      Seimei
                    </NuxtLink>

                    <NuxtLink to="/onmyoji/Kagura" class="submenu-label">
                      Kagura
                    </NuxtLink>

                    <NuxtLink to="/onmyoji/Hiromasa" class="submenu-label">
                      Hiromasa
                    </NuxtLink>

                    <NuxtLink to="/onmyoji/Yao_Bikuni" class="submenu-label">
                      Yao Bikuni
                    </NuxtLink>

                    <NuxtLink to="/onmyoji/Minamoto_no_Yorimitsu" class="submenu-label">
                      Yorimitsu
                    </NuxtLink>

                    <NuxtLink to="/onmyoji/Fujiwara_no_Michinaga" class="submenu-label">
                      Michinaga
                    </NuxtLink>
                  </div>
                </div>
              </div>

              <NuxtLink to="/shikigami" class="nav-item"> Shikigami </NuxtLink>

              <NuxtLink to="/souls" class="nav-item"> Souls </NuxtLink>

              <NuxtLink to="/pets" class="nav-item"> Pets </NuxtLink>
            </div>
          </nav>
        </div>
      </div>
    </div>

    <button
      v-show="showBackToTop"
      @click="scrollToTop"
      class="back-to-top"
      title="Back to Top"
    >
      ⮝
    </button>

    <button
      v-show="showBackToTop"
      @click="scrollToBottom"
      class="back-to-bottom"
      title="Scroll to Bottom"
    >
      ⮟
    </button>

    <main>
      <div class="main-container"><slot /></div>
    </main>

    <footer
      class="footer mt-20 border-t border-white/10 bg-gradient-to-b from-[#891727] to-[#5f0f1a] text-white"
    >
      <div
        class="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-6 py-12 md:grid-cols-3"
      >
        <!-- Logo -->
        <div class="flex flex-col gap-4">
          <img src="/images/Logo.webp" alt="Onmyoji Wiki Logo" class="h-16 w-fit" />

          <p class="max-w-[280px] text-sm leading-6 text-gray-300">
            Explore the world of Onmyoji, Shikigami, Souls, and more in one simple and
            organized wiki.
          </p>
        </div>

        <!-- Navigation -->
        <div>
          <h3 class="mb-4 text-lg font-semibold">Navigation</h3>

          <ul class="space-y-3 text-sm text-gray-300">
            <li>
              <NuxtLink to="/" class="transition hover:pl-1 hover:text-white">
                Home
              </NuxtLink>
            </li>

            <li>
              <NuxtLink to="/onmyoji" class="transition hover:pl-1 hover:text-white">
                Onmyoji
              </NuxtLink>
            </li>

            <li>
              <NuxtLink to="/shikigami" class="transition hover:pl-1 hover:text-white">
                Shikigami
              </NuxtLink>
            </li>

            <li>
              <NuxtLink to="/souls" class="transition hover:pl-1 hover:text-white">
                Souls
              </NuxtLink>
            </li>

            <li>
              <NuxtLink to="/pets" class="transition hover:pl-1 hover:text-white">
                Pets
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Info -->
        <div>
          <h3 class="mb-4 text-lg font-semibold">About</h3>

          <p class="text-sm leading-6 text-gray-300">
            Fan-made Onmyoji Wiki built for learning, exploring characters, and finding
            useful game information quickly.
          </p>
        </div>
      </div>

      <!-- Bottom -->
      <div class="border-t border-white/10 px-6 py-5 text-center text-sm text-gray-400">
        © 2025 Onmyoji Wiki. All rights reserved.
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isDropdownOpen: false,
      showStickyNav: false,
      showBackToTop: false,
      showBackToBottom: false,
    };
  },
  mounted() {
    window.addEventListener("scroll", this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    handleScroll() {
      this.showStickyNav = window.scrollY > 150;
      this.showBackToTop = window.scrollY > 300;
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    scrollToBottom() {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    },

    openDropdown() {
      this.isDropdownOpen = true;
    },
    closeDropdown() {
      setTimeout(() => {
        this.isDropdownOpen = false;
        this.activeSubmenu = null;
      }, 100);
    },
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
    },
  },
};
</script>

<style src="/assets/css/styles.css"></style>

<style>
#app {
  font-family: "Noto Sans", sans-serif;
  background: #891727;
  color: #f4f1e8;
}

/* Header */
.header {
  position: relative;
  background: url("/images/Background.png") center center no-repeat;
  background-size: cover;
  width: 100%;
  height: 180px;
  display: flex;
  align-items: flex-end;
}

.header::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(165, 25, 25, 0) 0%, #891727 100%);
  z-index: 1;
}

.header > * {
  position: relative;
  z-index: 2;
}

/* Nav */
.nav-container {
  width: 100%;
  max-width: 1280px;

  margin: 0 auto;
  padding: 0 18px;

  position: relative;
  z-index: 10;
}

.nav-content {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: end;
  gap: 20px;
}

/* Logo */
.nav-content img {
  width: 200px;
  height: auto;
}

/* Nav Menu */
.nav-menu {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-item,
.dropdown-toggle {
  position: relative;

  color: rgba(0, 0, 0, 0.88);

  font-family: "Fira Sans", sans-serif;

  font-size: 18px;

  text-transform: uppercase;
  text-decoration: none;

  padding: 10px 18px;

  transition: color 0.25s ease;

  overflow: hidden;
  cursor: pointer;
}

/* hover glow */
.nav-item::before,
.dropdown-toggle::before {
  content: "";

  position: absolute;
  inset: 0;

  transform: translateX(-120%);
  transition: transform 0.5s ease;
}

.nav-item:hover::before,
.dropdown-toggle:hover::before {
  transform: translateX(120%);
}

.nav-item:hover,
.dropdown-toggle:hover {
  color: #fff;

  transform: translateY(-2px);
}

/* active route */
.router-link-active {
  color: #fff !important;
}

/* Dropdown */
.dropdown {
  position: relative;
}

.dropdown-arrow {
  font-size: 10px;
  opacity: 0.8;

  transition: transform 0.25s ease;
}

.dropdown-menu {
  position: absolute;

  top: 100%;
  left: 0;

  min-width: 260px;

  padding: 10px;

  border-radius: 10px;

  background: linear-gradient(to bottom, rgba(35, 35, 35, 0.98), rgba(20, 20, 20, 0.98));

  border: 1px solid rgba(255, 255, 255, 0.08);

  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(165, 25, 25, 0.15);

  backdrop-filter: blur(10px);

  opacity: 0;
  visibility: hidden;

  transform: translateY(6px) scale(0.98);

  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;

  z-index: 1000;
}

.dropdown::after {
  content: "";

  position: absolute;

  left: 0;
  top: 100%;

  width: 100%;
  height: 14px;
}

.dropdown-menu.active {
  opacity: 1;
  visibility: visible;

  transform: translateY(0) scale(1);
}

.dropdown-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: "Fira Sans", sans-serif;
}

.submenu-label {
  color: rgba(255, 255, 255, 0.82);

  padding: 10px 12px;

  border-radius: 6px;

  transition: background 0.2s ease, color 0.2s ease, padding-left 0.2s ease;
}

.submenu-label:hover {
  background: rgba(165, 25, 25, 0.18);

  color: #fff;

  padding-left: 18px;
}

/* Sticky Nav */
.sticky-nav {
  position: fixed;
  top: 0;
  left: 0;

  width: 100%;

  background: linear-gradient(to bottom, rgba(25, 25, 25, 0.96), rgba(137, 23, 39, 0.96));

  backdrop-filter: blur(12px);

  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45), 0 0 20px rgba(165, 25, 25, 0.12);

  z-index: 2000;

  animation: stickySlideDown 0.35s ease;
}

.sticky-content {
  align-items: center;

  padding: 10px 0;
}

.sticky-nav img {
  width: 120px;
  height: auto;

  transition: transform 0.3s ease;
}

.sticky-nav .nav-item,
.sticky-nav .dropdown-toggle {
  font-size: 16px;

  padding: 8px 16px;
}

@keyframes stickySlideDown {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Footer */
.footer a {
  transition: color 0.3s ease;
}
.footer a:hover {
  color: #d0d0d0;
}

/* ========================================
   Ancient Scroll Buttons
======================================== */

.back-to-top,
.back-to-bottom {
  position: fixed;

  right: 24px;

  width: 58px;
  height: 58px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid rgba(255, 190, 190, 0.28);

  border-radius: 50%;

  cursor: pointer;

  font-size: 24px;
  font-weight: 700;

  color: #ffe6e6;

  background: radial-gradient(
    circle at top,
    rgba(165, 25, 25, 0.96),
    rgba(92, 12, 18, 0.98)
  );

  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.38), 0 0 12px rgba(165, 25, 25, 0.12),
    inset 0 1px 0 rgba(255, 220, 220, 0.1), inset 0 -2px 6px rgba(0, 0, 0, 0.35);

  backdrop-filter: blur(4px);

  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease,
    background 0.28s ease;

  z-index: 999;
}

/* Ancient inner ring */
.back-to-top::before,
.back-to-bottom::before {
  content: "";

  position: absolute;
  inset: 5px;

  border-radius: 50%;

  border: 1px solid rgba(255, 220, 220, 0.08);

  pointer-events: none;
}

/* Decorative mark */
.back-to-top::after,
.back-to-bottom::after {
  content: "✦";

  position: absolute;

  bottom: 6px;
  right: 8px;

  font-size: 9px;

  color: rgba(255, 210, 210, 0.5);

  pointer-events: none;
}

/* Position */
.back-to-top {
  bottom: 98px;
}

.back-to-bottom {
  bottom: 24px;
}

/* Hover */
.back-to-top:hover,
.back-to-bottom:hover {
  transform: translateY(-4px) scale(1.05);

  border-color: rgba(255, 220, 220, 0.48);

  background: radial-gradient(
    circle at top,
    rgba(195, 35, 45, 0.98),
    rgba(110, 15, 22, 1)
  );

  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.42), 0 0 18px rgba(165, 25, 25, 0.22),
    inset 0 1px 0 rgba(255, 230, 230, 0.16);
}

/* Click */
.back-to-top:active,
.back-to-bottom:active {
  transform: scale(0.94);
}
</style>
