<template>
  <div id="app">
    <header class="header">
      <div class="nav-container mx-auto grid grid-cols-[auto_1fr] gap-x-4">
        <!-- Logo -->
        <div class="row-span-3 flex items-center p-2">
          <img
            src="/images/Logo.webp"
            alt="Onmyoji Logo" 
            class="max-w-[200px] h-auto mx-auto"
          />
        </div>

        <!-- Text -->
        <div class="p-2">&nbsp;</div>
        <div>
          <span class="text-xl font-bold text-black">Onmyoji Wiki</span>
        </div>

        <!-- Nav -->
        <nav class="flex space-x-5 text-sm font-semibold text-black uppercase px-2">
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
            <NuxtLink to="/souls" class="nav-item">Pets</NuxtLink>
          </div>
        </nav>
      </div>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isDropdownOpen: false,
      activeSubmenu: null,
      submenuTimer: null,
    };
  },
  methods: {
    openDropdown() {
      this.isDropdownOpen = true;
    },
    closeDropdown() {
      // Delay closing to allow for submenu navigation
      setTimeout(() => {
        this.isDropdownOpen = false;
        this.activeSubmenu = null;
      }, 100);
    },
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    openSubmenu(submenu) {
      if (this.submenuTimer) {
        clearTimeout(this.submenuTimer);
      }
      this.activeSubmenu = submenu;
    },
    closeSubmenu(submenu) {
      this.submenuTimer = setTimeout(() => {
        if (this.activeSubmenu === submenu) {
          this.activeSubmenu = null;
        }
      }, 200);
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
  z-index: 2; /* Để nội dung nằm trên overlay */
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  align-items: center;
  padding: 0 20px;
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

/* Submenu Styles */
.has-submenu {
  position: relative;
  cursor: pointer;
}

.submenu-label {
  display: block;
  padding: 8px;
  color: #3a3a3a;
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 13px;
}

.submenu-label:last-child {
  border-bottom: none;
}

.submenu-label:hover {
  color: #3a3a3a;
  padding-left: 10px;
}

/* Active Link Styles */
.nav-item.router-link-active,
.dropdown-item.router-link-active,
.submenu-item.router-link-active {
  color: #3a3a3a;
}
</style>
