import { getEffectsByIds } from "~/services/effect.service";
import { getOnmyojiByIds, getOnmyojiByName } from "~/services/onmyoji.service";
import { getShikigamiByIds } from "~/services/shikigami.service";
import { getTagsByIds } from "~/services/tag.service";
import { extractEntityIds } from "~/utils/parser/extractEntityIds";
import { useSupabase } from "~/composables/useSupabase";

export function useOnmyoji() {
  const onmyoji = ref(null);
  const listShikigami = ref([]);
  const listOnmyoji = ref([]);
  const tags = ref([]);
  const tagMap = ref({});
  const effects = ref([]);

  const illustrations = ref([]);

  const illustrationPage = ref(0);
  const illustrationLimit = 10;

  const illustrationLoading = ref(false);
  const illustrationHasMore = ref(true);

  async function loadOnmyoji(name) {
    const data = await getOnmyojiByName(name);

    if (!data) return;

    onmyoji.value = data;

    const effectIds = extractEntityIds({
      skills: onmyoji.value.skills,
      tag: "e",
    });

    const effectData = await getEffectsByIds(effectIds);

    effects.value = effectData;

    const tagIds = [
      ...new Set(onmyoji.value.skills.flatMap((skill) => skill.tags || [])),
    ];

    const shikigamiIds = extractEntityIds({
      skills: onmyoji.value.skills,
      effects: effects.value,
      tag: "s",
    });

    const onmyojiIds = extractEntityIds({
      skills: onmyoji.value.skills,
      effects: effects.value,
      tag: "o",
    });

    const [
      listShikigamiData,
      listOnmyojiData,
      tagsData,
    ] = await Promise.all([

      getShikigamiByIds(shikigamiIds),

      getOnmyojiByIds(onmyojiIds),

      getTagsByIds(tagIds),

    ]);

    listShikigami.value = listShikigamiData;

    listOnmyoji.value = listOnmyojiData;

    tags.value = tagsData;

    tagMap.value = Object.fromEntries(tagsData.map((tag) => [tag.id, tag]));

    effects.value = effectData;

  }

  async function fetchIllustrations(id) {
    if (
      !illustrationHasMore.value
    ) {
      return;
    }

    const from = illustrationPage.value * illustrationLimit;
    const to = from + illustrationLimit - 1;

    
    const supabase = useSupabase();

    const { data, error } = await supabase
      .from("Illustration")
      .select("*")
      .contains("onmyoji", [id])
      .order("id")
      .range(from, to);

    if (error) {
      console.error(error);
    } else {
      illustrations.value.push(...data);

      if (data.length < illustrationLimit) {
        illustrationHasMore.value = false;
      }

      illustrationPage.value++;
    }
  }

  return {
    onmyoji,
    listShikigami,
    listOnmyoji,
    tags,
    tagMap,
    effects,
    illustrations,
    fetchIllustrations,
    illustrationHasMore,
    loadOnmyoji,
  };
}
