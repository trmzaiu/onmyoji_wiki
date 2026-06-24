import { ref, watch } from "vue";

const language = ref("en");

const languages = [
  { code: "en", label: "English" },
  { code: "vn", label: "Tiếng Việt" },
  { code: "cn", label: "简体中文" },
];

let initialized = false;

export const useLanguage = () => {
  if (typeof window !== "undefined" && !initialized) {
    const savedLanguage = window.localStorage.getItem("lang");

    if (languages.some((item) => item.code === savedLanguage)) {
      language.value = savedLanguage;
    }

    watch(language, (value) => {
      window.localStorage.setItem("lang", value);
    });

    initialized = true;
  }

  const getLocaleText = (data, fallback = "") => {
    if (data == null) return fallback;

    if (typeof data !== "object") return data;

    return (
      data[language.value] ??
      data.en ??
      data.vn ??
      data.cn ??
      fallback
    );
  };

  return {
    language,
    languages,
    getLocaleText,
  };
};