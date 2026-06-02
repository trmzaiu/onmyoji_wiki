import { ref } from "vue";

import { getConditionsByIds } from "~/services/condition.service";
import { getEffectsByIds } from "~/services/effect.service";
import { getEvolution } from "~/services/evolution.service";
import { getIllustrations } from "~/services/illustration.service";
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

  async function loadShikigami(formattedName) {
    const data = await getShikigamiByName(formattedName);

    if (!data) return;

    shikigami.value = data;

    const effectIds = extractEntityIds({
      skills: shikigami.value.skills,
      tag: "e",
    });

    const effectData = await getEffectsByIds(effectIds);

    effects.value = effectData;

    const tagIds = [
      ...new Set(shikigami.value.skills.flatMap((skill) => skill.tags || [])),
    ];

    const shikigamiIds = extractEntityIds({
      skills: shikigami.value.skills,
      effects: effects.value,
      profile: shikigami.value.profile,
      tag: "s",
    });

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
      illustrationsData,
    ] = await Promise.all([
      data.rarity !== "SP" ? getEvolution(data.evolution.no) : Promise.resolve(null),

      getShikigamiByIds(shikigamiIds),

      getOnmyojiByIds(onmyojiIds),

      getTagsByIds(tagIds),

      getConditionsByIds(conditionIds),

      getSoulsByIds(soulIds),

      getIllustrations(data.id),
    ]);

    listShikigami.value = listShikigamiData;

    listOnmyoji.value = listOnmyojiData;

    tags.value = tagsData;

    tagMap.value = Object.fromEntries(tagsData.map((tag) => [tag.id, tag]));

    effects.value = effectData;

    evolution.value = evolutionData;

    conditions.value = conditionsData;

    souls.value = soulsData;

    illustrations.value = illustrationsData;
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
    evolution,
    loadShikigami,
  };
}
