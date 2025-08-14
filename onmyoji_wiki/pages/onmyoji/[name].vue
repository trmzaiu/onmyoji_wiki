<script setup>
import { useSupabase } from "@/utils/useSupabase.ts";
import { onMounted, ref, computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const supabase = useSupabase();

const onmyoji = ref(null);
const isEnglish = ref(true);
const tooltipData = ref(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const showTooltip = ref(false);

const formattedName = route.params.name.replace(/_/g, " ");

const processTextWithTooltips = (text) => {
  if (!text || !onmyoji.value?.skills) return text;

  let processedText = text;

  // Find all possible effect names from notes
  const effectNames = [];
  onmyoji.value.skills.forEach((skill) => {
    if (skill.note && skill.note.name) {
      // Lấy cả tên EN và VN để tăng khả năng match
      const nameEn = skill.note.name.en;
      const nameVn = skill.note.name.vn;
      
      if (nameEn) {
        effectNames.push({
          name: nameEn,
          note: skill.note,
        });
      }
      
      if (nameVn && nameVn !== nameEn) {
        effectNames.push({
          name: nameVn,
          note: skill.note,
        });
      }
    }
  });

  // Sort by length (longest first) to avoid partial matches
  effectNames.sort((a, b) => b.name.length - a.name.length);

  // Replace effect names with tooltip-enabled spans
  effectNames.forEach(({ name, note }) => {
    // Tạo regex linh hoạt hơn, không chỉ word boundary
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[\\s\\p{P}])(${escapedName})(?=[\\s\\p{P}]|$)`, "g");
    
    processedText = processedText.replace(regex, (match, before, matchedName) => {
      const noteDesc = isEnglish.value ? note.description.en : note.description.vn;
      return `${before}<span class="effect-tooltip" data-tooltip='${JSON.stringify({
        name: matchedName,
        description: noteDesc,
        image: note.image,
      })}'>${matchedName}</span>`;
    });
  });

  return processedText;
};

// Mouse event handlers for tooltip
const handleMouseEnter = (event) => {
  const tooltipDataAttr = event.target.getAttribute("data-tooltip");
  if (tooltipDataAttr) {
    try {
      tooltipData.value = JSON.parse(tooltipDataAttr);
      updateTooltipPosition(event);
      showTooltip.value = true;
    } catch (e) {
      console.error("Error parsing tooltip data:", e);
    }
  }
};

const handleMouseLeave = () => {
  showTooltip.value = false;
  tooltipData.value = null;
};

const handleMouseMove = (event) => {
  if (showTooltip.value) {
    updateTooltipPosition(event);
  }
};

const updateTooltipPosition = (event) => {
  tooltipPosition.value = {
    x: event.clientX + 10,
    y: event.clientY + 10,
  };
};

// Add event listeners to dynamically created tooltip spans
const addTooltipListeners = () => {
  const tooltipSpans = document.querySelectorAll(".effect-tooltip");
  tooltipSpans.forEach((span) => {
    span.addEventListener("mouseenter", handleMouseEnter);
    span.addEventListener("mouseleave", handleMouseLeave);
    span.addEventListener("mousemove", handleMouseMove);
  });
};

// Remove event listeners
const removeTooltipListeners = () => {
  const tooltipSpans = document.querySelectorAll(".effect-tooltip");
  tooltipSpans.forEach((span) => {
    span.removeEventListener("mouseenter", handleMouseEnter);
    span.removeEventListener("mouseleave", handleMouseLeave);
    span.removeEventListener("mousemove", handleMouseMove);
  });
};

async function fetchOnmyoji() {
  const { data, error } = await supabase
    .from("Onmyoji")
    .select("*")
    .eq("name_GL", formattedName)
    .single();

  if (error) {
    console.error("Error fetching onmyoji:", error);
  } else {
    onmyoji.value = data;
    // Add tooltip listeners after data is loaded and DOM is updated
    setTimeout(addTooltipListeners, 100);
  }
}

onMounted(async () => {
  document.title = `Onmyoji - ${formattedName}`;
  await fetchOnmyoji();
});

// Watch for language changes to update tooltips
const watchLanguageChange = computed(() => {
  if (isEnglish.value !== undefined) {
    setTimeout(() => {
      removeTooltipListeners();
      addTooltipListeners();
    }, 100);
  }
  return isEnglish.value;
});
</script>

<template>
  <div class="main-container" v-if="onmyoji">
    <div class="content-section flex flex-col gap-4">
      <!-- Hàng 1: Tiêu đề -->
      <div class="header-row">
        <div class="character-title">{{ onmyoji.name_GL }}</div>

        <label class="toggle-switch" title="Switch Language">
          <input type="checkbox" v-model="isEnglish" />
          <span class="slider"></span>
          <div class="toggle-labels">
            <span>EN</span>
            <span>VN</span>
          </div>
        </label>
      </div>

      <!-- Hàng 2: 2 cột -->
      <div class="flex gap-6">
        <!-- Cột trái: Hình -->
        <div class="flex justify-center w-1/2">
          <img
            :src="onmyoji.image_url"
            :alt="onmyoji.name_GL"
            class="max-h-[500px] object-contain"
          />
        </div>

        <!-- Cột phải: Table -->
        <div class="flex justify-end w-1/2">
          <table class="border border-gray-400 text-sm w-full max-w-[300px]">
            <thead>
              <tr>
                <th class="border border-red table-title p-2">
                  {{ onmyoji.name_GL }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-red text-black px-4">
                  <strong>CN</strong>
                  <div v-if="Array.isArray(onmyoji.name_CN)">
                    <div v-for="(name, idx) in onmyoji.name_CN" :key="idx">
                      {{ name }}
                    </div>
                  </div>
                  <div v-else>
                    {{ onmyoji.name_CN }}
                  </div>
                </td>
              </tr>
              <tr>
                <td class="border border-red text-black px-4">
                  <strong>JP</strong>
                  <div v-if="Array.isArray(onmyoji.name_JP)">
                    <div v-for="(name, idx) in onmyoji.name_JP" :key="idx">
                      {{ name }}
                    </div>
                  </div>
                  <div v-else>
                    {{ onmyoji.name_JP }}
                  </div>
                </td>
              </tr>
              <tr>
                <td class="border border-red text-black px-4">
                  <strong>GL</strong>
                  <div>{{ onmyoji.name_GL }}</div>
                </td>
              </tr>
              <tr>
                <td class="border border-red text-black text-vn px-4">
                  <strong>VN</strong>
                  <div>{{ onmyoji.name_VN }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <h2
        class="session-title mt-5"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? "Stats" : "Chỉ số" }}
      </h2>
      <div
        style="
          display: block;
          border: 1px solid #a51919;
          padding: 0 20px;
          margin-top: 80px;
        "
      >
        <table class="stats">
          <tbody>
            <tr class="image-icon" style="color: #a51919">
              <th></th>
              <th rowspan="9">&nbsp;</th>
              <th>
                <figure class="icon-img" style="position: relative">
                  <img
                    :src="onmyoji.icon_url"
                    :alt="onmyoji.name_GL"
                    style="object-fit: contain"
                    width="90"
                  />
                  <div
                    style="
                      color: #a51919;
                      font-weight: bold;
                      position: absolute;
                      top: -50px;
                      left: 50%;
                      transform: translateX(-50%);
                      width: 100%;
                    "
                  >
                    <br />
                    Level 60
                  </div>
                </figure>
              </th>
              <th rowspan="9">&nbsp;</th>
              <th style="padding: 0; margin: 0">
                <figure class="icon-img" style="position: relative">
                  <img
                    :src="onmyoji.icon2_url"
                    :alt="onmyoji.name_GL"
                    style="object-fit: contain"
                    width="90"
                  />
                  <div
                    style="
                      color: #a51919;
                      font-weight: bold;
                      position: absolute;
                      top: -50px;
                      left: 50%;
                      transform: translateX(-50%);
                      width: 100%;
                    "
                  >
                    With Level <br />
                    40 Totem
                  </div>
                </figure>
              </th>
              <th></th>
              <th rowspan="9">&nbsp;</th>
            </tr>
            <tr>
              <th class="label-cell">
                <img src="public\assets\ATK.webp" alt="ATK" />
                ATK
              </th>
              <td class="centered-number">{{ onmyoji.atk }}</td>
              <td class="centered-number">{{ onmyoji.atk2 }}</td>
              <td>+{{ onmyoji.atk2 - onmyoji.atk }}</td>
            </tr>
            <tr>
              <th class="label-cell">
                <img src="public\assets\HP.webp" alt="HP" />
                HP
              </th>
              <td class="centered-number">{{ onmyoji.hp }}</td>
              <td class="centered-number">{{ onmyoji.hp2 }}</td>
              <td>+{{ onmyoji.hp2 - onmyoji.hp }}</td>
            </tr>
            <tr>
              <th class="label-cell">
                <img src="public\assets\DEF.webp" alt="DEF" />
                DEF
              </th>
              <td class="centered-number">{{ onmyoji.def }}</td>
              <td class="centered-number">{{ onmyoji.def2 }}</td>
              <td>+{{ onmyoji.def2 - onmyoji.def }}</td>
            </tr>
            <tr>
              <th class="label-cell">
                <img src="public\assets\SPD.webp" alt="SPD" />
                SPD
              </th>
              <td class="centered-number">{{ onmyoji.spd }}</td>
              <td class="centered-number">{{ onmyoji.spd2 }}</td>
              <td>+{{ onmyoji.spd2 - onmyoji.spd }}</td>
            </tr>
            <tr>
              <th class="label-cell">
                <img src="public\assets\CRIT.webp" alt="CRIT" />
                Crit
              </th>
              <td class="centered-number">{{ onmyoji.crit }}%</td>
              <td class="centered-number">{{ onmyoji.crit2 }}%</td>
              <td>+{{ onmyoji.crit2 - onmyoji.crit }}%</td>
            </tr>
            <tr>
              <th class="label-cell">
                <img src="public\assets\CDMG.webp" alt="CDMG" />
                Crit DMG
              </th>
              <td class="centered-number">{{ onmyoji.cdmg }}%</td>
              <td class="centered-number">{{ onmyoji.cdmg }}%</td>
              <td>+{{ onmyoji.cdmg - onmyoji.cdmg }}%</td>
            </tr>
            <tr>
              <th class="label-cell">
                <img src="public\assets\HIT.webp" alt="HIT" />
                Effects HIT
              </th>
              <td class="centered-number">{{ onmyoji.hit }}%</td>
              <td class="centered-number">{{ onmyoji.hit }}%</td>
              <td>+{{ onmyoji.hit - onmyoji.hit }}%</td>
            </tr>
            <tr>
              <th class="label-cell">
                <img src="public\assets\RES.webp" alt="RES" />
                Effects RES
              </th>
              <td class="centered-number">{{ onmyoji.res }}%</td>
              <td class="centered-number">{{ onmyoji.res }}%</td>
              <td>+{{ onmyoji.res - onmyoji.res }}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2
        class="session-title mt-5"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? "Skills" : "Kĩ năng" }}
      </h2>
      <div
        v-for="(skill, index) in onmyoji.skills"
        :key="index"
        style="position: relative; padding-left: 40px; margin-bottom: 20px"
      >
        <div>
          <span
            style="
              background-color: #fff;
              overflow: hidden;
              border-radius: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              position: absolute;
              top: 0;
              left: 0;
              width: 95px;
              height: 95px;
              border: 1px solid #a51919;
              padding: 5px;
            "
            class="skill-icon"
          >
            <img :src="skill.image" :alt="skill.name.en" />
          </span>
          <span
            style="
              display: table-cell;
              vertical-align: bottom;
              font-weight: 900;
              font-size: 20px;
              color: #a51919;
              height: 65px;
              text-indent: 70px;
              padding-bottom: 5px;
            "
          >
            <div class="skill-title">
              <span class="name" :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }">
                {{ isEnglish ? skill.name.en : skill.name.vn }}
              </span>
              <span class="sub-name"> ({{ skill.name.cn }}/{{ skill.name.jp }}) </span>
            </div>
          </span>
        </div>
        <div style="padding: 10px 25px; border: 1px solid #a51919">
          <div class="text-black pb-5 skill-header">
            <div class="skill-info">
              <span style="margin-left: 45px; font-size: smaller">
                <b>{{ isEnglish ? "Type" : "Loại" }}:</b> {{ skill.type }}
              </span>
              <span style="margin-left: 45px; font-size: smaller">
                <b>{{ isEnglish ? "Cooldown" : "Hồi chiêu" }}:</b>
                {{ skill.cooldown }}
              </span>
            </div>
            <div class="skill-badges">
              <span
                v-for="tag in skill.tags"
                :key="tag.name"
                class="badge"
                :class="'badge-' + tag.color"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
          <hr style="border: none; border-top: 1px solid #a51919; margin: 8px 0" />
          <p
            style="
              margin: 0;
              font-size: 15px;
              line-height: 1.5;
              color: #444;
              padding: 10px 0;
            "
            v-html="
              processTextWithTooltips(
                isEnglish ? skill.description.en : skill.description.vn
              )
            "
          ></p>
          <hr style="border: none; border-top: 1px solid #a51919; margin: 8px 0" />
          <table
            style="width: 100%; border-collapse: collapse; font-size: 14px"
            v-if="Array.isArray(isEnglish ? skill.levels.en : skill.levels.vn)"
          >
            <tbody>
              <tr style="color: #a51919; font-weight: bold">
                <th style="padding: 6px; text-align: left; width: 70px">
                  {{ isEnglish ? "Level" : "Cấp" }}
                </th>
                <th style="padding: 6px 10px; text-align: left">
                  {{ isEnglish ? "Effect" : "Hiệu ứng" }}
                </th>
              </tr>
              <tr
                v-for="lvl in isEnglish ? skill.levels.en : skill.levels.vn"
                :key="lvl.level"
                style="color: #444"
              >
                <td style="padding: 6px 10px">{{ lvl.level }}</td>
                <td
                  style="padding: 6px 10px"
                  v-html="processTextWithTooltips(lvl.effect)"
                ></td>
              </tr>
            </tbody>
          </table>
          <div v-else>
            <p
              style="color: #a3a3a3"
              class="no-level"
              v-html="
                processTextWithTooltips(isEnglish ? skill.levels.en : skill.levels.vn)
              "
            ></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tooltip -->
    <div
      v-if="showTooltip && tooltipData"
      class="tooltip"
      :style="{
        left: tooltipPosition.x + 'px',
        top: tooltipPosition.y + 'px',
      }"
    >
      <div class="tooltip-title">{{ tooltipData.name }}</div>
      <img
        v-if="tooltipData.image"
        :src="'/assets/' + tooltipData.image"
        :alt="tooltipData.image"
        style="width: 32px; height: 32px; margin-bottom: 8px"
      />
      <div class="tooltip-description">{{ tooltipData.description }}</div>
    </div>
  </div>
</template>

<style>
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
  border-color: #a51919;
}

.table-title {
  font-size: 24px;
  font-weight: bold;
  color: #f4f1e8;
  text-align: center;
  padding: 8px;
  background-color: #a51919;
}

.text-vn {
  font-family: "Nunito", sans-serif;
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

.image-icon {
  position: relative;
  top: -40px;
}

.icon-img {
  z-index: 10;
  border: 1px solid #a51919;
  padding: 5px;
  background: #fff;
}

.stats {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  overflow: visible;
}

.stats tbody th.label-cell {
  font-weight: bold;
  text-align: left;
  border-bottom: 1px solid #ddd;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #333;
}

.stats tbody td.centered-number {
  text-align: center;
  color: #444;
}

.stats th,
.stats td {
  padding: 6px 10px;
}

.stats th {
  font-weight: normal;
}

.stats .image-icon {
  text-align: center;
  vertical-align: middle;
}

.stats .image-icon figure {
  display: inline-block;
  margin: 5px 0 0;
}

.stats tr:nth-child(1) th {
  font-size: 16px;
}

.stats tr:nth-child(n + 2) td:nth-last-child(1) {
  color: #a51919;
}

.stats img {
  vertical-align: middle;
}

.stats th[colspan="2"] {
  border: none;
}

.stats td {
  border: none;
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 25px;
}

.skill-info span {
  margin-left: 45px;
  font-size: smaller;
}

.skill-badges {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: smaller;
  font-weight: bold;
  color: white;
}

.badge-red {
  background-color: #a63f37;
}

.badge-blue {
  background-color: #4994d4;
}

.badge-grey {
  background-color: #959494;
}

.badge-yellow {
  background-color: #c07b2a;
}

/* Tooltip Styles */
.effect-tooltip {
  font-weight: bold;
  color: #a51919;
  cursor: help;
  text-decoration: underline;
  text-decoration-style: dotted;
}

.effect-tooltip:hover {
  color: #7c1515;
}

.tooltip {
  position: fixed;
  z-index: 9999;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 2px solid #a51919;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 8px 25px rgba(165, 25, 25, 0.3);
  max-width: 300px;
  pointer-events: none;
  animation: tooltipFadeIn 0.2s ease-out;
}

.tooltip-title {
  font-weight: bold;
  font-size: 14px;
  color: #a51919;
  margin-bottom: 6px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 4px;
}

.tooltip-description {
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Ensure tooltip appears above other elements */
.tooltip::before {
  content: "";
  position: absolute;
  top: -6px;
  left: 20px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #a51919;
}

.tooltip::after {
  content: "";
  position: absolute;
  top: -4px;
  left: 21px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 5px solid #ffffff;
}
</style>
