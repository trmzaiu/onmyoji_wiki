<template>
  <div id="app">
    <header class="header">
      <div class="nav-container">
        <div class="nav-content grid grid-cols-[auto_1fr] gap-x-4">
          <!-- Logo -->
          <div class="row-span-3 flex items-start">
            <img
              src="/images/Logo.webp"
              alt="Onmyoji Logo"
              class="max-w-[200px] h-auto"
            />
          </div>

          <!-- Text -->
          <div class="p-2">&nbsp;</div>
          <div>
            <span class="text-xl font-bold text-black">Onmyoji Wiki</span>
          </div>

          <!-- Nav -->
          <nav
            class="flex space-x-5 text-sm font-semibold text-black uppercase px-2 mx-auto"
          >
            <div class="nav-menu flex space-x-6">
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

    <div
      v-show="showStickyNav"
      class="sticky-nav fixed top-0 left-0 w-full bg-[#891727] text-white shadow-md z-[2000] transition-all duration-300"
    >
      <div class="max-w-[1200px] mx-auto flex items-center px-6 py-3">
        <img
          src="/images/Logo.webp"
          alt="Logo"
          style="height: 50px; padding-left: 20px; padding-right: 20px"
        />

        <nav class="flex flex-1 text-sm font-semibold uppercase mx-auto">
          <div class="nav-menu flex space-x-6">
            <NuxtLink to="/" class="hover:text-gray-200">Explore</NuxtLink>
            <div class="dropdown" @mouseleave="closeDropdown">
              <button
                class="hover:text-gray-200 cursor-pointer dropdown-toggle"
                @mouseenter="openDropdown"
                @click="toggleDropdown"
              >
                ONMYOJI
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
                </div>
              </div>
            </div>

            <NuxtLink to="/shikigami" class="hc">Shikigami</NuxtLink>
            <NuxtLink to="/souls" class="hover:text-gray-200">Souls</NuxtLink>
            <NuxtLink to="/pets" class="hover:text-gray-200">Pets</NuxtLink>
          </div>
        </nav>
      </div>
    </div>

    <button
      v-show="showBackToTop"
      @click="scrollToTop"
      class="back-to-top"
      title="Back to Top"
    >
      ↑
    </button>

    <main>
      <div class="main-container"><slot /></div>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isDropdownOpen: false,
      showStickyNav: false,
      showBackToTop: false,
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

<style scoped>
html {
  scroll-behavior: smooth;
}
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: "Rubik", "Long Cang", "National Park", "Yuji Syuku", sans-serif;
  background: #891727;
  color: #f4f1e8;
  min-height: 100vh;
}

/* Header Styles */
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

.nav-container {
  width: 1200px; /* Giới hạn độ rộng */
  margin: 0 auto; /* Nằm giữa màn hình */
  display: flex;
  justify-content: flex-start; /* Cho nội dung canh trái */
  align-items: center;
  padding: 0 20px;
}

.nav-content {
  display: grid;
  grid-template-columns: auto 1fr;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 30px;
  align-items: center;
}

.nav-item {
  color: #0e191a;
  text-decoration: none;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s ease;
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 0.5px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-item:hover {
  color: #d0d0d0;
}

/* Dropdown Styles */
.dropdown {
  position: relative;
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dropdown-arrow {
  font-size: 10px;
  transition: transform 0.3s ease;
}

.dropdown.active .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: #d0d0d0;
  min-width: 250px;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(187, 184, 184, 0.3);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  z-index: 1000;
  margin-top: 0px;
}

.dropdown-menu.active {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  display: block;
  padding: 12px 20px;
  color: #0e191a;
  text-decoration: none;
  border-bottom: 1px solid rgba(187, 184, 184, 0.3);
  transition: all 0.3s ease;
  font-size: 14px;
  text-transform: none;
  letter-spacing: normal;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  color: #3a3a3a;
}

/* Active Link Styles */
.nav-item.router-link-active,
.dropdown-item.router-link-active,
.submenu-item.router-link-active {
  color: #3a3a3a;
}

.toggle-switch {
  position: relative;
  width: 44px;
  height: 22px;
  flex-shrink: 0;
}

.toggle-switch input[type="checkbox"] {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.slider {
  position: absolute;
  cursor: pointer;
  background-color: #ccc;
  border-radius: 22px;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition: 0.4s;
}

.slider::before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

.toggle-switch input:checked + .slider {
  background-color: #a51919;
}
.toggle-switch input:checked + .slider::before {
  transform: translateX(22px);
}

.toggle-labels {
  position: absolute;
  width: 100%;
  top: 50%;
  left: 0;
  display: flex;
  justify-content: space-between;
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: bold;
  color: white;
  padding: 0 5px;
  pointer-events: none;
  user-select: none;
}

.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: #891727;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  z-index: 3000;
}

.back-to-top:hover {
  background: #d01f1f;
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  gap: 30px;
}

.content-section {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid #3a3a3a4d;
}
</style>
