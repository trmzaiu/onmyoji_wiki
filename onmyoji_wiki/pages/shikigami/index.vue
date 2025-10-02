<script setup>
import { useSupabase } from "@/utils/useSupabase.ts";
import { computed, onMounted, onUnmounted, ref } from "vue";

const supabase = useSupabase();

// ===== STATE =====
const shikigamiList = ref([]);
const isEnglish = ref(true);

const listRef = ref(null);

// ===== SORTING =====
const sort = ref({ key: "id", asc: true });
const rarityOrder = { SP: 5, SSR: 4, SR: 3, R: 2, N: 1 };

const sortedShikigami = computed(() => {
  return [...shikigamiList.value].sort((a, b) => {
    let aValue, bValue;

    switch (sort.value.key) {
      case "name":
        aValue = a.name?.jp?.[1]?.toLowerCase?.() || "";
        bValue = b.name?.jp?.[1]?.toLowerCase?.() || "";
        break;
      case "rarity":
        aValue = rarityOrder[a.rarity] || 0;
        bValue = rarityOrder[b.rarity] || 0;
        break;
      default:
        aValue = a[sort.value.key];
        bValue = b[sort.value.key];
    }

    if (aValue < bValue) return sort.value.asc ? -1 : 1;
    if (aValue > bValue) return sort.value.asc ? 1 : -1;
    return 0;
  });
});

function sortBy(key) {
  if (sort.value.key === key) {
    sort.value.asc = !sort.value.asc;
  } else {
    sort.value.key = key;
    sort.value.asc = true;
  }
}

// ===== FETCH DATA =====
async function fetchAllShikigami() {
  const { data, error } = await supabase
    .from("Shikigami")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching shikigami:", error);
  } else {
    shikigamiList.value = data;
  }
}

// ===== REALTIME =====
function setupRealtime() {
  const channel = supabase
    .channel("shikigami-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "Shikigami",
      },
      (payload) => {
        console.log("Realtime change:", payload);

        if (payload.eventType === "INSERT") {
          shikigamiList.value.push(payload.new);
        }

        if (payload.eventType === "UPDATE") {
          const index = shikigamiList.value.findIndex((s) => s.id === payload.new.id);
          if (index !== -1) {
            shikigamiList.value[index] = payload.new;
          }
        }

        if (payload.eventType === "DELETE") {
          shikigamiList.value = shikigamiList.value.filter(
            (s) => s.id !== payload.old.id
          );
        }
      }
    )
    .subscribe();

  onUnmounted(() => {
    supabase.removeChannel(channel);
  });
}

// ===== INFO TEXTS =====
const description = {
  en:
    "Shikigami are beings who have formed contracts with onmyouji to be summoned to their aid.",
  vn:
    "Thức Thần là những sinh linh đã ký kết khế ước với Âm Dương Sư để được triệu hồi hỗ trợ họ.",
};

const introduction = {
  en: `Shikigami are the beings summoned by the onmyouji to assist them. They form contracts which is recorded in a contract book. Shards of the contract book or a complete contract book (both the same rarity as the shikigami) for a shikigami may also be obtained to contract with the shikigami.

Once summoned, shikigami are found in the shikigami records.

In battle, shikigami are summoned through a medium like paper doll.`,
  vn: `Thức Thần là những sinh linh được Âm Dương Sư triệu hồi để hỗ trợ họ. Việc triệu hồi được thực hiện thông qua khế ước, được ghi lại trong Sách Khế Ước. Người chơi có thể thu thập mảnh khế ước hoặc Sách Khế Ước hoàn chỉnh (cùng độ hiếm với Thức Thần) để ký kết và triệu hồi Thức Thần đó.

Sau khi được triệu hồi, Thức Thần sẽ xuất hiện trong Hồ Sơ Thức Thần.

Trong trận chiến, Thức Thần được gọi ra thông qua trung giới như búp bê giấy.`,
};

const rarity = {
  en: `Shikigami have SP, SSR, SR, R, and N rarity. Rarity affects the number of shards needed to summon the shikigami and their rates in summoning.

N rarity technically has the distinctions of "materials" i.e. daruma, and "gekota."`,
  vn: `Thức Thần được chia thành các độ hiếm: SP, SSR, SR, R và N. Độ hiếm ảnh hưởng đến số mảnh cần để triệu hồi Thức Thần cũng như tỉ lệ xuất hiện khi triệu hồi.

Độ hiếm N thì được phân loại riêng thành: Nguyên liệu (ví dụ: Daruma), và Gekota.`,
};

// ===== LIFECYCLE =====
onMounted(async () => {
  document.title = "Shikigami";
  await fetchAllShikigami();
  setupRealtime();
});
</script>

<template>
  <div class="main-container" v-if="shikigamiList.length" ref="listRef">
    <div class="content-section flex flex-col gap-4">
      <!-- Hàng 1: Tiêu đề -->
      <div class="header-row">
        <div class="character-title">Shikigami</div>

        <label class="toggle-switch" title="Switch Language">
          <input type="checkbox" v-model="isEnglish" />
          <span class="slider"></span>
          <div class="toggle-labels">
            <span>EN</span>
            <span>VN</span>
          </div>
        </label>
      </div>

      <p
        class="text-medium text-black"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? description.en : description.vn }}
      </p>

      <h2
        class="session-title mt-5"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? "Introduction" : "Giới thiệu" }}
      </h2>
      <p
        class="text-medium text-black whitespace-pre-line text-justify"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? introduction.en : introduction.vn }}
      </p>

      <h2
        class="session-title mt-5"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? "Rarity" : "Độ hiếm" }}
      </h2>
      <p
        class="text-medium text-black whitespace-pre-line text-justify"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? rarity.en : rarity.vn }}
      </p>

      <h2
        class="session-title mt-5"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? "Shikigami List" : "Danh sách Thức Thần" }}
      </h2>
      <div class="p-4">
        <table class="w-full" style="border: 1px solid #a51919">
          <thead>
            <tr style="background-color: #a51919; font-weight: bold">
              <th class="px-2 py-1 cursor-pointer" @click="sortBy('id')">
                ID
                <span v-if="sort.key === 'id'">{{ sort.asc ? "▲" : "▼" }}</span>
              </th>
              <th class="px-2 py-1">{{ isEnglish ? "Image" : "Ảnh" }}</th>
              <th class="px-2 py-1 cursor-pointer" @click="sortBy('name')">
                {{ isEnglish ? "Name" : "Tên" }}
                <span v-if="sort.key === 'name'">{{ sort.asc ? "▲" : "▼" }}</span>
              </th>
              <th class="px-2 py-1 cursor-pointer" @click="sortBy('rarity')">
                {{ isEnglish ? "Rarity" : "Độ hiếm" }}
                <span v-if="sort.key === 'rarity'">{{ sort.asc ? "▲" : "▼" }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="shiki in sortedShikigami" :key="shiki.id" class="shikigami-row">
              <td class="px-2 py-1 text-center text-black w-[75px]">{{ shiki.id }}</td>
              <td class="px-2 py-1 text-center w-[160px]" style="border-left: 1px solid #e0e0e0">
                <a :href="`/shikigami/${shiki.name.jp[1].replace(/ /g, '_')}`"
                  ><img
                    :src="`/assets/shikigami/shards/${shiki.name.jp[1].replace(/ /g, '_')}_Shard.webp` || `/assets/Unknown_Shard.webp`"
                    :alt="shiki.name.jp[1] || 'Unknown'"
                    class="w-16 h-16 object-contain mx-auto"
                /></a>
              </td>

              <td
                class="px-2 py-1 text-center"
                style="border-left: 1px solid #e0e0e0"
              >
                <div class="text-red hover:text-red-500 font-semibold">
                  <a :href="`/shikigami/${shiki.name.jp[1].replace(/ /g, '_')}`">{{
                    shiki.name.jp[1]
                  }}</a>
                </div>
                <div class="text-black text-sm">
                  <span class="stkaiti">{{
                    shiki.name.cn[0] === shiki.name.jp[0]
                      ? shiki.name.cn[0]
                      : shiki.name.cn[0] + " — " + shiki.name.jp[0]
                  }}</span>
                  {{ shiki.name.en === shiki.name.jp[1] ? "" : "— " + shiki.name.en }} —
                  <span class="lang-vi">{{ shiki.name.vn }}</span>
                </div>
              </td>

              <td class="px-2 py-1 text-center w-[150px]" style="border-left: 1px solid #e0e0e0">
                <img
                  :src="`/assets/rarity/${shiki.rarity}.webp`"
                  :alt="shiki.rarity"
                  class="w-16 h-16 object-contain mx-auto"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>

.stkaiti {
  font-family: "stkaiti", serif;
  font-size: 16px;
}

.lang-vi {
  font-family: "Nunito", serif;
  font-weight: 600;
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

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.character-title {
  font-family: "Rubik", sans-serif;
  font-size: 42px;
  font-weight: medium;
  color: #3a3a3a;
  margin-bottom: 10px;
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

.border-red {
  border: 1px solid #a51919;
}

.text-red {
  color: #a51919;
}

.session-title {
  color: #3a3a3a;
  font-size: 24px;
  font-weight: 500;
  overflow: auto;
  padding: 6px 0;
  border-bottom: 0.5px solid #9c9c9c;
}

.lang-en .session-title {
  font-family: "Rubik", sans-serif;
}
.lang-vi .session-title {
  font-family: "Nunito", sans-serif;
}

.shikigami-row {
  border-bottom: 1px solid #eee;
}

.shikigami-row:last-child {
  border-bottom: none;
}

.shikigami-row:hover {
  background-color: #f8f8f8;
}
</style>
