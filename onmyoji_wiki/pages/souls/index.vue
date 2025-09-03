<script setup>
import { useSupabase } from "@/utils/useSupabase.ts";
import { nextTick, onMounted, ref } from "vue";

const supabase = useSupabase();
const soulList = ref([]);
const isEnglish = ref(true);

async function fetchAllSouls() {
  const { data, error } = await supabase
    .from("Soul")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching soul:", error);
  } else {
    soulList.value = data;
    await nextTick();
  }
}

const description = {
  en:
    "Souls are the different equipment you can apply to your Shikigami to increase their stats and obtain unique effects. A player can keep 6000 unequipped souls.",
  vn:
    "Ngự Hồn là loại trang bị khác nhau mà bạn có thể gắn lên Thức Thần để tăng chỉ số và nhận các hiệu ứng đặc biệt. Mỗi người chơi có thể chứa tối đa 6000 linh hồn chưa trang bị.",
};

const sort = ref({ key: "id", asc: true });

const sortBy = (key) => {
  if (sort.value.key === key) {
    sort.value.asc = !sort.value.asc; // đảo chiều nếu click lại
  } else {
    sort.value.key = key;
    sort.value.asc = true; // mặc định tăng
  }
};

const sortedSouls = computed(() => {
  return [...soulList.value].sort((a, b) => {
    let aValue, bValue;

    if (sort.value.key === "name") {
      aValue = a.name.en.toLowerCase();
      bValue = b.name.en.toLowerCase();
    } else if (sort.value.key === "type") {
      aValue = a.type.toLowerCase();
      bValue = b.type.toLowerCase();
    } else {
      aValue = a[sort.value.key];
      bValue = b[sort.value.key];
    }

    if (aValue < bValue) return sort.value.asc ? -1 : 1;
    if (aValue > bValue) return sort.value.asc ? 1 : -1;
    return 0;
  });
});

onMounted(async () => {
  document.title = "Soul";
  await fetchAllSouls();
});
</script>

<template>
  <div class="main-container" v-if="soulList.length">
    <div class="content-section flex flex-col gap-4">
      <!-- Hàng 1: Tiêu đề -->
      <div class="header-row">
        <div class="character-title">Soul</div>

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
        class="px-3 text-medium text-black"
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
      <h3 class="px-3 session-subtitle">
        {{ isEnglish ? "Type" : "Phân loại" }}
      </h3>
      <p
        class="px-3 text-medium text-black whitespace-pre-line text-justify"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{
          isEnglish
            ? "Souls are often grouped into different categories based on the different effects bequeathed. A master list can be found"
            : "Ngự Hồn thường được chia thành nhiều nhóm dựa trên hiệu ứng mà chúng mang lại. Danh sách đầy đủ có thể tìm thấy"
        }}
        <span style="text-decoration: underline"
          ><a href="#soul-list">{{ isEnglish ? "here" : "ở đây" }}</a></span
        >.
      </p>
      <p
        class="px-3 text-medium text-black whitespace-pre-line text-justify"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{
          isEnglish
            ? "Officially, the Soul's attributes are considered "
            : "Theo phân loại chính thức, thuộc tính của Linh Hồn được chia thành"
        }}
        <strong>{{ isEnglish ? "attack-type" : "dạng công" }}</strong
        >, <strong>{{ isEnglish ? "defense-type" : "dạng thủ" }}</strong
        >, {{ isEnglish ? "and" : "và" }}
        <strong>{{ isEnglish ? "utility-type" : "dạng hỗ trợ" }}</strong
        >.
      </p>

      <table style="border: 1px solid #a51919; width: 80%; margin: 0 auto">
        <tbody>
          <tr style="background-color: #a51919; font-weight: bold">
            <td class="px-2 py-1 text-center" colspan="4">
              {{ isEnglish ? "Attack-type" : "Dạng công" }}
            </td>
          </tr>
          <tr class="text-black">
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              ATK<br />攻击 / 攻撃力
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              ATK Bonus / ATK%<br />攻击加成 / 追加攻撃力
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              Crit<br />暴击 / 会心率
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              Crit DMG<br />暴击伤害 / 会心DMG
            </td>
          </tr>
          <tr style="background-color: #a51919; font-weight: bold">
            <td class="px-2 py-1 text-center" colspan="4">
              {{ isEnglish ? "Defense-type" : "Dạng thủ" }}
            </td>
          </tr>
          <tr class="text-black">
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              HP<br />生命 / HP
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              HP Bonus / HP%<br />生命加成 / 追加HP
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              DEF<br />防御 / 防御力
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              DEF Bonus / DEF%<br />防御加成 / 追加防御力
            </td>
          </tr>
          <tr style="background-color: #a51919; font-weight: bold">
            <td class="px-2 py-1 text-center" colspan="4">
              {{ isEnglish ? "Utility-type" : "Dạng hỗ trợ" }}
            </td>
          </tr>
          <tr class="text-black">
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              Effect RES<br />效果抵抗 / 効果抵抗
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              Effect HIT<br />效果命中 / 効果命中
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              SPD<br />速度 / 素早さ
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919"></td>
          </tr>
        </tbody>
      </table>

      <p
        class="px-3 text-medium text-black whitespace-pre-line text-justify"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{
          isEnglish
            ? "Special attributes are considered to be: Speed, Effect Resist, Effect Hit, Crit, Crit Damage.\nOther attributes are: Attack, Health, Defense, Attack Bonus, Health Bonus, Defense Bonus."
            : "Thuộc tính đặc biệt bao gồm: Tốc Độ, Hiệu ứng Kháng, Hiệu ứng Chính Xác, Bạo Kích, Sát Thương Bạo Kích.\nCác thuộc tính khác bao gồm: Công, Máu, Thủ, %Công, %Máu, %Thủ."
        }}
      </p>

      <h3 class="px-3 session-subtitle mt-5">
        {{ isEnglish ? "Stars" : "Sao" }}
      </h3>

      <p
        class="px-3 text-medium text-black whitespace-pre-line text-justify"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{
          isEnglish
            ? "The higher the star rating of a Soul, the stronger it is compared to the same Soul of lesser star rating, as levelling a higher-star Soul causes a higher rate of attribute enhancement. Souls have one star at minimum and six stars at maximum.\nHowever, the attribute enhancement is not necessarily fixed as it seems that decimals are added at random, thus, only the max attributes are certain."
            : "Ngự Hồn có cấp sao càng cao thì sẽ càng mạnh hơn so với Ngự Hồn tương tự có cấp sao thấp hơn, và tăng cấp Ngự Hồn nhiều sao hơn sẽ có tỷ lệ tăng cấp thuộc tính cao hơn. Ngự Hồn có ít nhất 1 sao và cao nhất là 6 sao.\nTuy nhiên, tăng cấp thuộc tính không cố định vì số thập phân thường được thêm vào ngẫu nhiên, do đó, chỉ có những thuộc tính đạt tối đa là cố định."
        }}
      </p>

      <h3 class="px-3 session-subtitle mt-5">
        {{ isEnglish ? "Positions" : "Vị trí" }}
      </h3>

      <p
        class="px-3 text-medium text-black whitespace-pre-line text-justify"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{
          isEnglish
            ? "Like any other game with an equipment system, every shikigami in this game has six different slots to equip Souls. However, what makes Onmyoji's implementation slightly confusing is the fact that the Soul enhances a specific stat in a specific way depending on its position, and the main stat is unrelated to the effect of the Soul itself. Specifically, consult the following to see what stats are enhanced for each of the six positions:"
            : "Như những game khác với hệ thống trang bị, mọi Thức Thần trong game này có 6 ô khác nhau để trang bị Ngự Hồn. Tuy nhiên, thứ khiến các Âm Dương Sư phải mâu thuẫn là việc Ngự Hồn tăng cấp một thuộc tính đặc biệt theo một cách đặc biệt tùy thuộc vào vị trí của nó, và thuộc tính cơ bản không ảnh hưởng đến hiệu ứng riêng của Ngự Hồn. Cụ thể hơn, hãy xem bảng dưới để biết ô nào sẽ có chỉ số nào:"
        }}
      </p>

      <table style="border: 1px solid #a51919; width: 65%; margin: 0 auto">
        <thead>
          <tr style="background-color: #a51919; font-weight: bold">
            <th colspan="2" class="px-2 py-1 text-center">
              {{ isEnglish ? "Main stats for each slot" : "Thuộc tính cơ bản ở từng ô" }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th class="px-2 py-1 text-center" style="border: 1px solid #a51919; border-bottom: 1px solid #f5f5f5; background-color: #a51919;">
              {{ isEnglish ? "Slot 1" : "Ô 1" }}
            </th>
            <td class="px-2 py-1 text-start text-black" style="border: 1px solid #a51919">
              {{ isEnglish ? "ATK" : "Công" }}
            </td>
          </tr>
          <tr>
            <th class="px-2 py-1 text-center" style="border: 1px solid #a51919; border-bottom: 1px solid #f5f5f5; background-color: #a51919;">
              {{ isEnglish ? "Slot 2" : "Ô 2" }}
            </th>
            <td class="px-2 py-1 text-start text-black" style="border: 1px solid #a51919">
              {{
                isEnglish
                  ? "SPD, ATK Bonus, DEF Bonus, HP Bonus"
                  : "Tốc độ, Công(%), Thủ(%), Máu(%)"
              }}
            </td>
          </tr>
          <tr>
            <th class="px-2 py-1 text-center" style="border: 1px solid #a51919; border-bottom: 1px solid #f5f5f5; background-color: #a51919;">
              {{ isEnglish ? "Slot 3" : "Ô 3" }}
            </th>
            <td class="px-2 py-1 text-start text-black" style="border: 1px solid #a51919">
              {{ isEnglish ? "DEF" : "Thủ" }}
            </td>
          </tr>
          <tr>
            <th class="px-2 py-1 text-center" style="border: 1px solid #a51919; border-bottom: 1px solid #f5f5f5; background-color: #a51919;">
              {{ isEnglish ? "Slot 4" : "Ô 4" }}
            </th>
            <td class="px-2 py-1 text-start text-black" style="border: 1px solid #a51919">
              {{
                isEnglish
                  ? "Effect HIT, Effect RES, ATK Bonus, DEF Bonus, HP Bonus"
                  : "Chính xác, Kháng, Công(%), Thủ(%), Máu(%)"
              }}
            </td>
          </tr>
          <tr>
            <th class="px-2 py-1 text-center" style="border: 1px solid #a51919; border-bottom: 1px solid #f5f5f5; background-color: #a51919;">
              {{ isEnglish ? "Slot 5" : "Ô 5" }}
            </th>
            <td class="px-2 py-1 text-start text-black" style="border: 1px solid #a51919">
              {{ isEnglish ? "HP" : "Máu" }}
            </td>
          </tr>
          <tr>
            <th class="px-2 py-1 text-center" style="border: 1px solid #a51919; border-bottom: 1px solid #f5f5f5; background-color: #a51919;">
              {{ isEnglish ? "Slot 6" : "Ô 6" }}
            </th>
            <td class="px-2 py-1 text-start text-black" style="border: 1px solid #a51919">
              {{ isEnglish ? "Crit, Crit DMG, ATK Bonus, DEF Bonus, HP Bonus" : "Bạo kích, Sát thương Bạo kích, Công(%), Thủ(%), Máu(%)" }}
            </td>
          </tr>
        </tbody>
      </table>

      <h2
        class="session-title mt-5"
        id="soul-list"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? "Soul List" : "Danh sách Ngự Hồn" }}
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
              <th class="px-2 py-1 cursor-pointer" @click="sortBy('type')">
                {{ isEnglish ? "Type" : "Loại" }}
                <span v-if="sort.key === 'type'">{{ sort.asc ? "▲" : "▼" }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="soul in sortedSouls" :key="soul.id" class="soul-row">
              <td class="px-2 py-1 text-center text-black">{{ soul.id }}</td>

              <td class="px-2 py-1 text-center" style="border-left: 1px solid #e0e0e0">
                <a :href="`/souls/${soul.name.en.replace(/ /g, '_')}`"
                  ><img
                    :src="soul.images.image_icon"
                    :alt="soul.name.en"
                    class="w-16 h-16 object-contain mx-auto"
                /></a>
              </td>

              <td class="px-2 py-1 text-center" style="border-left: 1px solid #e0e0e0">
                <div class="text-red hover:text-red-500 font-semibold">
                  <a :href="`/souls/${soul.name.en.replace(/ /g, '_')}`">{{
                    soul.name.en
                  }}</a>
                </div>
                <div class="text-black text-sm">
                  {{
                    soul.name.cn[0] === soul.name.jp[0]
                      ? soul.name.cn[0]
                      : soul.name.cn[0] + " - " + soul.name.jp[0]
                  }}
                  - {{ soul.name.vn }}
                </div>
              </td>

              <td
                class="px-2 py-1 text-center text-black"
                style="border-left: 1px solid #e0e0e0"
              >
                {{ soul.type }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.session-subtitle {
  color: #000;
  font-size: 18px;
  font-weight: 500;
}

.lang-en .session-title,
.lang-en .session-subtitle {
  font-family: "Rubik", sans-serif;
}
.lang-vi .session-title,
.lang-vi .session-subtitle {
  font-family: "Nunito", sans-serif;
}

.soul-row {
  border-bottom: 1px solid #eee;
}

.soul-row:last-child {
  border-bottom: none;
}

.soul-row:hover {
  background-color: #f8f8f8;
}
</style>
