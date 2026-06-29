import { ref } from "vue";

import { getEffectsByIds } from "~/services/effect.service";
import { getSoulByName } from "~/services/soul.service";
import { extractEntityIds } from "~/utils/parser/extractEntityIds";

export function useSoul() {
    const soul = ref(null);
    const effects = ref([]);

    async function loadSoul(name) {
        const data = await getSoulByName(name);

        if (!data) return;

        soul.value = data;

        let effectIds = extractEntityIds({
            soulEffect: soul.value.effect,
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
    }

    return {
        soul,
        effects,
        loadSoul,
    };
}
