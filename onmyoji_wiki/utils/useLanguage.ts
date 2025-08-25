import { ref } from "vue";

// global reactive state
export const isEnglish = ref<boolean>(true);

// toggle function
export const toggleLanguage = (): void => {
  isEnglish.value = !isEnglish.value;
};
