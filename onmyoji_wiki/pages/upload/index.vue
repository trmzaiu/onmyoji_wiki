<script setup>
import { useSupabase } from "@/utils/useSupabase.ts";
import { ref } from "vue";

const supabase = useSupabase();

// state cho Images
const filesImages = ref([]);
const previewsImages = ref([]);
const isDraggingImages = ref(false);

// state cho Icons
const filesIcons = ref([]);
const previewsIcons = ref([]);
const isDraggingIcons = ref(false);

// state cho Shards
const filesShards = ref([]);
const previewsShards = ref([]);
const isDraggingShards = ref(false);

// state cho Skills
const filesSkills = ref([]);
const previewsSkills = ref([]);
const isDraggingSkills = ref(false);

// state cho Skins
const filesSkins = ref([]);
const previewsSkins = ref([]);
const isDraggingSkins = ref(false);

// state cho SkinsInfo
const filesSkinsInfo = ref([]);
const previewsSkinsInfo = ref([]);
const isDraggingSkinsInfo = ref(false);

// state cho Bios
const filesBios = ref([]);
const previewsBios = ref([]);
const isDraggingBios = ref(false);

// state cho Audios
const filesAudios = ref([]);
const previewsAudios = ref([]);
const isDraggingAudios = ref(false);

// state cho Illustrations
const filesIllustrations = ref([]);
const previewsIllustrations = ref([]);
const isDraggingIllustrations = ref(false);

// ====== HANDLERS CHO IMAGES ======
const handleFileChangeImages = (e) => {
  const selectedFiles = Array.from(e.target.files);
  filesImages.value.push(...selectedFiles);
  previewsImages.value.push(...selectedFiles.map((f) => URL.createObjectURL(f)));
};

const handleDropImages = (e) => {
  e.preventDefault();
  isDraggingImages.value = false;
  if (e.dataTransfer?.files?.length) {
    const droppedFiles = Array.from(e.dataTransfer.files);
    filesImages.value.push(...droppedFiles);
    previewsImages.value.push(...droppedFiles.map((f) => URL.createObjectURL(f)));
  }
};

const handleDragOverImages = (e) => {
  e.preventDefault();
  isDraggingImages.value = true;
};
const handleDragLeaveImages = () => {
  isDraggingImages.value = false;
};
const removeImage = (index) => {
  filesImages.value.splice(index, 1);
  previewsImages.value.splice(index, 1);
};

// ====== HANDLERS CHO ICONS ======
const handleFileChangeIcons = (e) => {
  const selectedFiles = Array.from(e.target.files);
  filesIcons.value.push(...selectedFiles);
  previewsIcons.value.push(...selectedFiles.map((f) => URL.createObjectURL(f)));
};

const handleDropIcons = (e) => {
  e.preventDefault();
  isDraggingIcons.value = false;
  if (e.dataTransfer?.files?.length) {
    const droppedFiles = Array.from(e.dataTransfer.files);
    filesIcons.value.push(...droppedFiles);
    previewsIcons.value.push(...droppedFiles.map((f) => URL.createObjectURL(f)));
  }
};

const handleDragOverIcons = (e) => {
  e.preventDefault();
  isDraggingIcons.value = true;
};
const handleDragLeaveIcons = () => {
  isDraggingIcons.value = false;
};
const removeIcon = (index) => {
  filesIcons.value.splice(index, 1);
  previewsIcons.value.splice(index, 1);
};

// ====== HANDLERS CHO SHARDS ======
const handleFileChangeShards = (e) => {
  const selectedFiles = Array.from(e.target.files);
  filesShards.value.push(...selectedFiles);
  previewsShards.value.push(...selectedFiles.map((f) => URL.createObjectURL(f)));
};

const handleDropShards = (e) => {
  e.preventDefault();
  isDraggingShards.value = false;
  if (e.dataTransfer?.files?.length) {
    const droppedFiles = Array.from(e.dataTransfer.files);
    filesShards.value.push(...droppedFiles);
    previewsShards.value.push(...droppedFiles.map((f) => URL.createObjectURL(f)));
  }
};

const handleDragOverShards = (e) => {
  e.preventDefault();
  isDraggingShards.value = true;
};
const handleDragLeaveShards = () => {
  isDraggingShards.value = false;
};
const removeShard = (index) => {
  filesShards.value.splice(index, 1);
  previewsShards.value.splice(index, 1);
};

// ====== HANDLERS CHO SKILLS ======
const handleFileChangeSkills = (e) => {
  const selectedFiles = Array.from(e.target.files);
  filesSkills.value.push(...selectedFiles);
  previewsSkills.value.push(...selectedFiles.map((f) => URL.createObjectURL(f)));
};

const handleDropSkills = (e) => {
  e.preventDefault();
  isDraggingSkills.value = false;
  if (e.dataTransfer?.files?.length) {
    const droppedFiles = Array.from(e.dataTransfer.files);
    filesSkills.value.push(...droppedFiles);
    previewsSkills.value.push(...droppedFiles.map((f) => URL.createObjectURL(f)));
  }
};

const handleDragOverSkills = (e) => {
  e.preventDefault();
  isDraggingSkills.value = true;
};
const handleDragLeaveSkills = () => {
  isDraggingSkills.value = false;
};
const removeSkill = (index) => {
  filesSkills.value.splice(index, 1);
  previewsSkills.value.splice(index, 1);
};

// ====== HANDLERS CHO SKINS ======
const handleFileChangeSkins = (e) => {
  const selectedFiles = Array.from(e.target.files);
  filesSkins.value.push(...selectedFiles);
  previewsSkins.value.push(...selectedFiles.map((f) => URL.createObjectURL(f)));
};

const handleDropSkins = (e) => {
  e.preventDefault();
  isDraggingSkins.value = false;
  if (e.dataTransfer?.files?.length) {
    const droppedFiles = Array.from(e.dataTransfer.files);
    filesSkins.value.push(...droppedFiles);
    previewsSkins.value.push(...droppedFiles.map((f) => URL.createObjectURL(f)));
  }
};

const handleDragOverSkins = (e) => {
  e.preventDefault();
  isDraggingSkins.value = true;
};
const handleDragLeaveSkins = () => {
  isDraggingSkins.value = false;
};
const removeSkin = (index) => {
  filesSkins.value.splice(index, 1);
  previewsSkins.value.splice(index, 1);
};

// ====== HANDLERS CHO SKINSINFO ======
const handleFileChangeSkinsInfo = (e) => {
  const selectedFiles = Array.from(e.target.files);
  filesSkinsInfo.value.push(...selectedFiles);
  previewsSkinsInfo.value.push(...selectedFiles.map((f) => URL.createObjectURL(f)));
};

const handleDropSkinsInfo = (e) => {
  e.preventDefault();
  isDraggingSkinsInfo.value = false;
  if (e.dataTransfer?.files?.length) {
    const droppedFiles = Array.from(e.dataTransfer.files);
    filesSkinsInfo.value.push(...droppedFiles);
    previewsSkinsInfo.value.push(...droppedFiles.map((f) => URL.createObjectURL(f)));
  }
};

const handleDragOverSkinsInfo = (e) => {
  e.preventDefault();
  isDraggingSkinsInfo.value = true;
};
const handleDragLeaveSkinsInfo = () => {
  isDraggingSkinsInfo.value = false;
};
const removeSkinInfo = (index) => {
  filesSkinsInfo.value.splice(index, 1);
  previewsSkinsInfo.value.splice(index, 1);
};

// ====== HANDLERS CHO ILLUSTRATION ======
const handleFileChangeIllustrations = (e) => {
  const selectedFiles = Array.from(e.target.files);
  filesIllustrations.value.push(...selectedFiles);
  previewsIllustrations.value.push(...selectedFiles.map((f) => URL.createObjectURL(f)));
};

const handleDropIllustrations = (e) => {
  e.preventDefault();
  isDraggingIllustrations.value = false;
  if (e.dataTransfer?.files?.length) {
    const droppedFiles = Array.from(e.dataTransfer.files);
    filesIllustrations.value.push(...droppedFiles);
    previewsIllustrations.value.push(...droppedFiles.map((f) => URL.createObjectURL(f)));
  }
};

const handleDragOverIllustrations = (e) => {
  e.preventDefault();
  isDraggingIllustrations.value = true;
};
const handleDragLeaveIllustrations = () => {
  isDraggingIllustrations.value = false;
};
const removeIllustration = (index) => {
  filesIllustrations.value.splice(index, 1);
  previewsIllustrations.value.splice(index, 1);
};

// ====== HANDLERS CHO BIOS ======
const handleFileChangeBios = (e) => {
  const selectedFiles = Array.from(e.target.files);
  filesBios.value.push(...selectedFiles);
  previewsBios.value.push(...selectedFiles.map((f) => URL.createObjectURL(f)));
};

const handleDropBios = (e) => {
  e.preventDefault();
  isDraggingBios.value = false;
  if (e.dataTransfer?.files?.length) {
    const droppedFiles = Array.from(e.dataTransfer.files);
    filesBios.value.push(...droppedFiles);
    previewsBios.value.push(...droppedFiles.map((f) => URL.createObjectURL(f)));
  }
};

const handleDragOverBios = (e) => {
  e.preventDefault();
  isDraggingBios.value = true;
};
const handleDragLeaveBios = () => {
  isDraggingBios.value = false;
};
const removeBio = (index) => {
  filesBios.value.splice(index, 1);
  previewsBios.value.splice(index, 1);
};

// ====== HANDLERS CHO AUDIOS ======
const handleFileChangeAudios = (e) => {
  const selectedFiles = Array.from(e.target.files);
  filesAudios.value.push(...selectedFiles);
  previewsAudios.value.push(...selectedFiles.map(f => URL.createObjectURL(f)));
};

const handleDropAudios = (e) => {
  e.preventDefault();
  isDraggingAudios.value = false;
  if (e.dataTransfer?.files?.length) {
    const droppedFiles = Array.from(e.dataTransfer.files);
    filesAudios.value.push(...droppedFiles);
    previewsAudios.value.push(...droppedFiles.map((f) => URL.createObjectURL(f)));
  }
};

const handleDragOverAudios = (e) => {
  e.preventDefault();
  isDraggingAudios.value = true;
};
const handleDragLeaveAudios = () => {
  isDraggingAudios.value = false;
};
const removeAudio = (index) => {
  filesAudios.value.splice(index, 1);
  previewsAudios.value.splice(index, 1);
};

// Upload tất cả file
const uploadFiles = async () => {
  // Upload images
  for (const f of filesImages.value) {
    const path = `Images/${f.name}`;
    const { data, error } = await supabase.storage.from("Shikigami").upload(path, f, {
      cacheControl: "31536000",
      upsert: true,
      contentType: f.type,
    });

    if (error) console.error("Upload Images error:", error.message);
    else {
        console.log("Uploaded Image:", data);
        filesImages.value = [];
        previewsImages.value = [];
    }
  }

  // Upload icons
  for (const f of filesIcons.value) {
    const path = `Icons/${f.name}`;
    const { data, error } = await supabase.storage.from("Shikigami").upload(path, f, {
      cacheControl: "31536000",
      upsert: true,
      contentType: f.type,
    });

    if (error) console.error("Upload Icons error:", error.message);
    else {
        console.log("Uploaded Icon:", data);
        filesIcons.value = [];
        previewsIcons.value = [];
    }
  }

  // Upload shards
  for (const f of filesShards.value) {
    const path = `Shards/${f.name}`;
    const { data, error } = await supabase.storage.from("Shikigami").upload(path, f, {
      cacheControl: "31536000",
      upsert: true,
      contentType: f.type,
    });

    if (error) console.error("Upload Shards error:", error.message);
    else {
        console.log("Uploaded Shard:", data);
        filesShards.value = [];
        previewsShards.value = [];
    }
  }

  // Upload skills
  for (const f of filesSkills.value) {
    const path = `Skills/${f.name}`;
    const { data, error } = await supabase.storage.from("Shikigami").upload(path, f, {
      cacheControl: "31536000",
      upsert: true,
      contentType: f.type,
    });

    if (error) console.error("Upload Skills error:", error.message);
    else {
        console.log("Uploaded Skill:", data);
        filesSkills.value = [];
        previewsSkills.value = [];
    }
  }

  // Upload skins
  for (const f of filesSkins.value) {
    const path = `Skins/${f.name}`;
    const { data, error } = await supabase.storage.from("Shikigami").upload(path, f, {
      cacheControl: "31536000",
      upsert: true,
      contentType: f.type,
    });

    if (error) console.error("Upload Skins error:", error.message);
    else {
        console.log("Uploaded Skin:", data);
        filesSkins.value = [];
        previewsSkins.value = [];
    }
  }

  // Upload skinsInfo
  for (const f of filesSkinsInfo.value) {
    const path = `SkinsInfo/${f.name}`;
    const { data, error } = await supabase.storage.from("Shikigami").upload(path, f, {
      cacheControl: "31536000",
      upsert: true,
      contentType: f.type,
    });

    if (error) console.error("Upload SkinsInfo error:", error.message);
    else {
        console.log("Uploaded SkinInfo:", data);
        filesSkinsInfo.value = [];
        previewsSkinsInfo.value = [];
    }
  }

  // Upload bios
  for (const f of filesBios.value) {
    const path = `Bios/${f.name}`;
    const { data, error } = await supabase.storage.from("Shikigami").upload(path, f, {
      cacheControl: "31536000",
      upsert: true,
      contentType: f.type,
    });

    if (error) console.error("Upload Bios error:", error.message);
    else {
        console.log("Uploaded Bio:", data);
        filesBios.value = [];
        previewsBios.value = [];
    }
  }

	for (const f of filesAudios.value) {
    const path = `${f.name}`;
    const { data, error } = await supabase.storage
        .from("Audio")
        .upload(path, f, {
        cacheControl: "31536000",
        upsert: true,
        contentType: f.type,
        });

    if (error) console.error("Upload Audios error:", error.message);
    else {
        console.log("Uploaded Audio:", data);
        filesAudios.value = [];
        previewsAudios.value = [];
    }
	}

  // Upload illustrations
  for (const f of filesIllustrations.value) {
    const path = `${f.name}`;
    const { data, error } = await supabase.storage.from("Illustration").upload(path, f, {
      cacheControl: "31536000",
      upsert: true,
      contentType: f.type,
    });

    if (error) console.error("Upload Illustrations error:", error.message);
    else {
        console.log("Uploaded Illustration:", data);
        filesIllustrations.value = [];
        previewsIllustrations.value = [];
    }
  }
};
</script>

<template>
  <div class="content-section flex flex-col gap-8 text-black">
    <!-- Upload Images -->
    <div>
      <h2 class="font-bold text-lg mb-2">Images</h2>
      <div
        class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
        :class="{ 'border-blue-500 bg-blue-50': isDraggingImages }"
        @drop="handleDropImages"
        @dragover="handleDragOverImages"
        @dragleave="handleDragLeaveImages"
      >
        <input type="file" accept="image/*" multiple @change="handleFileChangeImages" />
      </div>

      <!-- Preview Images -->
      <div v-if="previewsImages.length" class="mt-4 grid grid-cols-3 gap-4">
        <div v-for="(url, i) in previewsImages" :key="i">
          <div class="relative">
            <img :src="url" alt="Preview" class="rounded shadow" />
            <button
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 cursor-pointer"
              @click="removeImage(i)"
            >
              ✕
            </button>
          </div>
          <p class="text-sm mt-1 truncate">{{ filesImages[i].name }}</p>
        </div>
      </div>
    </div>

    <!-- Upload Icons -->
    <div>
      <h2 class="font-bold text-lg mb-2">Icons</h2>
      <div
        class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
        :class="{ 'border-green-500 bg-green-50': isDraggingIcons }"
        @drop="handleDropIcons"
        @dragover="handleDragOverIcons"
        @dragleave="handleDragLeaveIcons"
      >
        <input type="file" accept="image/*" multiple @change="handleFileChangeIcons" />
      </div>

      <!-- Preview Icons -->
      <div v-if="previewsIcons.length" class="mt-4 grid grid-cols-8 gap-4">
        <div v-for="(url, i) in previewsIcons" :key="i">
          <div class="relative max-w-xs">
            <img :src="url" alt="Preview" class="max-w-xs rounded shadow" />
            <button
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 cursor-pointer"
              @click="removeIcon(i)"
            >
              ✕
            </button>
          </div>
          <p class="text-sm mt-1 truncate">{{ filesIcons[i].name }}</p>
        </div>
      </div>
    </div>

    <!-- Upload Shards -->
    <div>
      <h2 class="font-bold text-lg mb-2">Shards</h2>
      <div
        class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
        :class="{ 'border-green-500 bg-green-50': isDraggingShards }"
        @drop="handleDropShards"
        @dragover="handleDragOverShards"
        @dragleave="handleDragLeaveShards"
      >
        <input type="file" accept="image/*" multiple @change="handleFileChangeShards" />
      </div>

      <!-- Preview Shards -->
      <div v-if="previewsShards.length" class="mt-4 grid grid-cols-6 gap-4">
        <div v-for="(url, i) in previewsShards" :key="i">
          <div class="relative">
            <img :src="url" alt="Preview" class="rounded shadow" />
            <button
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 cursor-pointer"
              @click="removeShard(i)"
            >
              ✕
            </button>
          </div>
          <p class="text-sm mt-1 truncate">{{ filesShards[i].name }}</p>
        </div>
      </div>
    </div>

    <!-- Upload Skills -->
    <div>
      <h2 class="font-bold text-lg mb-2">Skills</h2>
      <div
        class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
        :class="{ 'border-green-500 bg-green-50': isDraggingSkills }"
        @drop="handleDropSkills"
        @dragover="handleDragOverSkills"
        @dragleave="handleDragLeaveSkills"
      >
        <input type="file" accept="image/*" multiple @change="handleFileChangeSkills" />
      </div>

      <!-- Preview Skills -->
      <div v-if="previewsSkills.length" class="mt-4 grid grid-cols-8 gap-4">
        <div v-for="(url, i) in previewsSkills" :key="i">
          <div class="relative">
            <img :src="url" alt="Preview" class="rounded shadow" />
            <button
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 cursor-pointer"
              @click="removeSkill(i)"
            >
              ✕
            </button>
          </div>
          <p class="text-sm mt-1 truncate">{{ filesSkills[i].name }}</p>
        </div>
      </div>
    </div>

    <!-- Upload Skins -->
    <div>
      <h2 class="font-bold text-lg mb-2">Skins</h2>
      <div
        class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
        :class="{ 'border-green-500 bg-green-50': isDraggingSkins }"
        @drop="handleDropSkins"
        @dragover="handleDragOverSkins"
        @dragleave="handleDragLeaveSkins"
      >
        <input type="file" accept="image/*" multiple @change="handleFileChangeSkins" />
      </div>

      <!-- Preview Skins -->
      <div v-if="previewsSkins.length" class="mt-4 grid grid-cols-8 gap-4">
        <div v-for="(url, i) in previewsSkins" :key="i">
          <div class="relative">
            <img :src="url" alt="Preview" class="rounded shadow" />
            <button
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 cursor-pointer"
              @click="removeSkin(i)"
            >
              ✕
            </button>
          </div>
          <p class="text-sm mt-1 truncate">{{ filesSkins[i].name }}</p>
        </div>
      </div>
    </div>

    <!-- Upload SkinsInfo -->
    <div>
      <h2 class="font-bold text-lg mb-2">SkinsInfo</h2>
      <div
        class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
        :class="{ 'border-green-500 bg-green-50': isDraggingSkinsInfo }"
        @drop="handleDropSkinsInfo"
        @dragover="handleDragOverSkinsInfo"
        @dragleave="handleDragLeaveSkinsInfo"
      >
        <input type="file" accept="image/*" multiple @change="handleFileChangeSkinsInfo" />
      </div>

      <!-- Preview SkinsInfo -->
      <div v-if="previewsSkinsInfo.length" class="mt-4 grid grid-cols-8 gap-4">
        <div v-for="(url, i) in previewsSkinsInfo" :key="i">
          <div class="relative">
            <img :src="url" alt="Preview" class="rounded shadow" />
            <button
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 cursor-pointer"
              @click="removeSkinInfo(i)"
            >
              ✕
            </button>
          </div>
          <p class="text-sm mt-1 truncate">{{ filesSkinsInfo[i].name }}</p>
        </div>
      </div>
    </div>

    <!-- Upload Bios -->
    <div>
      <h2 class="font-bold text-lg mb-2">Bios</h2>
      <div
        class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
        :class="{ 'border-green-500 bg-green-50': isDraggingBios }"
        @drop="handleDropBios"
        @dragover="handleDragOverBios"
        @dragleave="handleDragLeaveBios"
      >
        <input type="file" accept="image/*" multiple @change="handleFileChangeBios" />
      </div>

      <!-- Preview Bios -->
      <div v-if="previewsBios.length" class="mt-4 grid grid-cols-8 gap-4">
        <div v-for="(url, i) in previewsBios" :key="i">
          <div class="relative">
            <img :src="url" alt="Preview" class="rounded shadow" />
            <button
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 cursor-pointer"
              @click="removeBio(i)"
            >
              ✕
            </button>
          </div>
          <p class="text-sm mt-1 truncate">{{ filesBios[i].name }}</p>
        </div>
      </div>
    </div>

		<!-- Upload Audios -->
    <div>
      <h2 class="font-bold text-lg mb-2">Audios</h2>
      <div
        class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
        :class="{ 'border-green-500 bg-green-50': isDraggingAudios }"
        @drop="handleDropAudios"
        @dragover="handleDragOverAudios"
        @dragleave="handleDragLeaveAudios"
      >
        <input type="file" accept="image/*" multiple @change="handleFileChangeAudios" />
      </div>

      <!-- Preview Audios -->
      <div v-if="previewsAudios.length" class="mt-4 grid grid-cols-8 gap-4">
        <div v-for="(url, i) in previewsAudios" :key="i">
          <div class="relative">
            <audio :src="url" controls class="w-full"></audio>
            <button
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 cursor-pointer"
              @click="removeAudio(i)"
            >
              ✕
            </button>
          </div>
          <p class="text-sm mt-1 truncate">{{ filesAudios[i].name }}</p>
        </div>
      </div>
    </div>

     <!-- Upload Illustrations -->
    <div>
      <h2 class="font-bold text-lg mb-2">Illustrations</h2>
      <div
        class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
        :class="{ 'border-green-500 bg-green-50': isDraggingIllustrations }"
        @drop="handleDropIllustrations"
        @dragover="handleDragOverIllustrations"
        @dragleave="handleDragLeaveIllustrations"
      >
        <input type="file" accept="image/*" multiple @change="handleFileChangeIllustrations" />
      </div>

      <!-- Preview Illustrations -->
      <div v-if="previewsIllustrations.length" class="mt-4 grid grid-cols-8 gap-4">
        <div v-for="(url, i) in previewsIllustrations" :key="i">
          <div class="relative">
            <img :src="url" alt="Preview" class="rounded shadow" />
            <button
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 cursor-pointer"
              @click="removeIllustration(i)"
            >
              ✕
            </button>
          </div>
          <p class="text-sm mt-1 truncate">{{ filesIllustrations[i].name }}</p>
        </div>
      </div>
    </div>

    <!-- Nút upload -->
    <button class="mt-4 bg-blue-600 text-white px-4 py-2 rounded" @click="uploadFiles">
      Upload
    </button>
  </div>
</template>
