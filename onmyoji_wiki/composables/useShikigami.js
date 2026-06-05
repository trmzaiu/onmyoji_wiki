import { ref } from "vue";

import { getConditionsByIds } from "~/services/condition.service";
import { getEffectsByIds } from "~/services/effect.service";
import { getEvolution } from "~/services/evolution.service";
import { getOnmyojiByIds } from "~/services/onmyoji.service";
import { getShikigamiByIds, getShikigamiByName } from "~/services/shikigami.service";
import { getSoulsByIds } from "~/services/soul.service";
import { getTagsByIds } from "~/services/tag.service";
import { extractEntityIds } from "~/utils/parser/extractEntityIds";

export function useShikigami() {
  const shikigami = ref(null);
  const listShikigami = ref([]);
  const listOnmyoji = ref([]);
  const tags = ref([]);
  const tagMap = ref({});
  const effects = ref([]);
  const evolution = ref(null);
  const conditions = ref([]);
  const souls = ref([]);
  const illustrations = ref([]);

  const illustrationPage = ref(0);
  const illustrationLimit = 10;

  const illustrationLoading = ref(false);
  const illustrationHasMore = ref(true);

  async function loadShikigami(name) {
    const data = await getShikigamiByName(name);

    if (!data) return;

    shikigami.value = data;

    let effectIds = extractEntityIds({
      skills: shikigami.value.skills,
      tag: "e",
    });

    const loadedIds = new Set();
    const allEffects = [];

    while (effectIds.length) {
      const idsToFetch = effectIds.filter(
        (id) => !loadedIds.has(id)
      );

      if (!idsToFetch.length) {
        break;
      }

      const effects = await getEffectsByIds(idsToFetch);

      effects.forEach((effect) => {
        loadedIds.add(effect.id);
        allEffects.push(effect);
      });

      effectIds = extractEntityIds({
        effects,
        tag: "e",
      });
    }

    effects.value = allEffects;

    const tagIds = [
      ...new Set(shikigami.value.skills.flatMap((skill) => skill.tags || [])),
    ];

    const shikigamiIds = [
      ...new Set([
        ...extractEntityIds({
          skills: shikigami.value.skills,
          effects: effects.value,
          profile: shikigami.value.profile,
          tag: "s",
        }),

        ...extractEntityIds({
          effects: effects.value,
          tag: "k",
        }),
      ]),
    ];

    const onmyojiIds = extractEntityIds({
      skills: shikigami.value.skills,
      effects: effects.value,
      profile: shikigami.value.profile,
      tag: "o",
    });

    const conditionIds = shikigami.value.biography.map((b) => b.no) || [];

    const soulIds = data.build?.length
      ? [...new Set(data.build.flatMap((build) => build.souls || []))]
      : [];

    const [
      evolutionData,
      listShikigamiData,
      listOnmyojiData,
      tagsData,
      conditionsData,
      soulsData,
    ] = await Promise.all([
      data.evolution
        ? getEvolution(data.evolution.no)
        : Promise.resolve(null),

      getShikigamiByIds(shikigamiIds),

      getOnmyojiByIds(onmyojiIds),

      getTagsByIds(tagIds),

      getConditionsByIds(conditionIds),

      getSoulsByIds(soulIds),

    ]);

    listShikigami.value = listShikigamiData;

    listOnmyoji.value = listOnmyojiData;

    tags.value = tagsData;

    tagMap.value = Object.fromEntries(tagsData.map((tag) => [tag.id, tag]));

    evolution.value = evolutionData;

    conditions.value = conditionsData;

    souls.value = soulsData;

  }

  async function fetchIllustrations(id) {
    if (
      illustrationLoading.value ||
      !illustrationHasMore.value
    ) {
      return;
    }

    illustrationLoading.value = true;

    const from = illustrationPage.value * illustrationLimit;
    const to = from + illustrationLimit - 1;


    const supabase = useSupabase();

    const { data, error } = await supabase
      .from("Illustration")
      .select("*")
      .contains("shiki", [id])
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

    illustrationLoading.value = false;
  }

  return {
    shikigami,
    listShikigami,
    listOnmyoji,
    tags,
    tagMap,
    effects,
    conditions,
    souls,
    illustrations,
    fetchIllustrations,
    illustrationLoading,
    illustrationHasMore,
    evolution,
    loadShikigami,
  };
}
