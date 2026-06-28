<script setup>
import { getUIText } from "~/utils/helper/helper";
import { getStatRank, getStatRankImage } from "~/utils/helper/statHelper";

const props = defineProps({
  routeName: String,
  entity: Object,
  language: Boolean,
  isShikigami: Boolean,
});

const hasLevel40 = computed(() => props.entity.id !== 402);

const text = (key) => getUIText(key, props.language);
</script>

<template>
  <div class="stats-wrapper">
    <table class="stats-table">
      <thead>
        <!-- HEADER -->
        <tr class="stats-header">
          <!-- 1 -->
          <th>&nbsp;</th>

          <!-- 2 -->
          <th></th>

          <!-- 3 + 4 -->
          <th colspan="2" v-if="isShikigami">
            <div class="stats-title">
              {{
                entity.rarity !== "SP" && entity.rarity !== "UR" && entity.rarity !== "N"
                  ? text("unevolved")
                  : ""
              }}
              <br />
              {{ text("level") }}1
            </div>
          </th>
          <th colspan="2" v-else>
            <div class="stats-title" :class="!isShikigami ? 'stats-title-left' : ''">
              <br />
              {{ text("level") }}60
            </div>
          </th>

          <!-- 5 + 6 -->
          <th colspan="2" v-if="hasLevel40 && isShikigami">
            <div class="stats-title">
              {{
                entity.rarity !== "SP" && entity.rarity !== "UR" && entity.rarity !== "N"
                  ? text("evolved")
                  : ""
              }}
              <br />
              {{ text("level") }}40
            </div>
          </th>
          <th colspan="2" v-if="!isShikigami">
            <div class="stats-title" :class="!isShikigami ? 'stats-title-left' : ''">
              {{ text("withlevel") }}
              <br />
              {{ text("totem") }}
            </div>
          </th>

          <!-- 7 + 8 -->
          <th colspan="2"></th>
        </tr>

        <!-- ICON -->
        <tr class="stats-header">
          <!-- 1 -->
          <th></th>

          <!-- 2 -->
          <th></th>

          <!-- 3 + 4 -->
          <th colspan="2" class="icon-cell">
            <figure class="stats-figure" :class="!isShikigami ? 'stats-figure-left' : ''">
              <img
                :src="`/assets/images/${
                  isShikigami ? 'shikigami' : 'onmyoji'
                }/icons/${routeName}_Icon.webp`"
                :alt="entity.name.jp[1]"
                class="stats-icon"
                @error="
                  (event) => (event.target.src = '/assets/images/Unknown_Icon.webp')
                "
              />
            </figure>
          </th>

          <!-- 5 + 6 -->
          <th colspan="2" v-if="hasLevel40" class="icon-cell">
            <figure class="stats-figure" :class="!isShikigami ? 'stats-figure-left' : ''">
              <img
                :src="`/assets/images/${
                  isShikigami ? 'shikigami' : 'onmyoji'
                }/icons/${routeName}_Icon${
                  !isShikigami
                    ? '2'
                    : entity.rarity !== 'SP' &&
                      entity.rarity !== 'UR' &&
                      entity.rarity !== 'N'
                    ? '_Evo'
                    : ''
                }.webp`"
                :alt="entity.name.jp[1]"
                class="stats-icon"
                @error="
                  (event) => (event.target.src = '/assets/images/Unknown_Icon.webp')
                "
              />
            </figure>
          </th>

          <!-- 7 + 8-->
          <th colspan="2"></th>
        </tr>

        <!-- SPACING -->
        <tr>
          <th colspan="8" class="spacing-row"></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th colspan="8" class="spacing-row"></th>
        </tr>
        <!-- === ATK === -->
        <tr class="stats-row">
          <!-- 1 -->
          <td></td>

          <!-- 2 -->
          <td class="label-cell">
            <img src="/assets/images/stats/ATK.webp" alt="ATK" />
            {{ language === "cn" ? "攻击" : "ATK" }}
          </td>

          <!-- 3 -->
          <td>
            <div class="rank-cell">
              <img
                :class="!isShikigami ? 'opacity-0' : ''"
                :src="getStatRankImage('ATK', entity.stats.ATK[0])"
                :alt="getStatRank('ATK', entity.stats.ATK[0])"
              />
            </div>
          </td>

          <!-- 4 -->
          <td>
            {{ entity.stats.ATK[0] }}
          </td>

          <!-- 5 -->
          <td v-if="hasLevel40">
            <div class="rank-cell">
              <img
                :class="!isShikigami ? 'opacity-0' : ''"
                :src="getStatRankImage('ATK_EVO', entity.stats.ATK[1])"
                :alt="getStatRank('ATK_EVO', entity.stats.ATK[1])"
              />
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 6 -->
          <td v-if="hasLevel40">
            <div class="flex">
              {{ entity.stats.ATK[1] }}
              <span
                v-if="entity.evolution && entity.evolution.no === 1"
                class="increase-cell"
              >
                +{{ Math.round((entity.stats.ATK[1] * entity.evolution.count) / 100) }}
              </span>
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 7 -->
          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                Math.round(
                  entity.stats.ATK[1] *
                    (1 +
                      (entity.evolution && entity.evolution.no === 1
                        ? entity.evolution.count / 100
                        : 0))
                ) - entity.stats.ATK[0]
              }}
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 8 -->
          <td class="right-border"></td>
        </tr>

        <!-- === HP === -->
        <tr class="stats-row">
          <!-- 1 -->
          <td></td>

          <!-- 2 -->
          <td class="label-cell">
            <img src="/assets/images/stats/HP.webp" alt="HP" />
            {{ language === "cn" ? "生命" : "HP" }}
          </td>

          <!-- 3 -->
          <td>
            <div class="rank-cell">
              <img
                :class="!isShikigami ? 'opacity-0' : ''"
                :src="getStatRankImage('HP', entity.stats.HP[0])"
                :alt="getStatRank('HP', entity.stats.HP[0])"
              />
            </div>
          </td>

          <!-- 4 -->
          <td>
            {{ entity.stats.HP[0] }}
          </td>

          <!-- 5 -->
          <td v-if="hasLevel40">
            <div class="rank-cell">
              <img
                :class="!isShikigami ? 'opacity-0' : ''"
                :src="getStatRankImage('HP_EVO', entity.stats.HP[1])"
                :alt="getStatRank('HP_EVO', entity.stats.HP[1])"
              />
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 6 -->
          <td v-if="hasLevel40">
            <div class="flex">
              {{ entity.stats.HP[1] }}

              <span
                v-if="entity.evolution && entity.evolution.no === 4"
                class="increase-cell"
              >
                +{{ Math.round((entity.stats.HP[1] * entity.evolution.count) / 100) }}
              </span>
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 7  -->
          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                Math.round(
                  entity.stats.HP[1] *
                    (1 +
                      (entity.evolution && entity.evolution.no === 4
                        ? entity.evolution.count / 100
                        : 0))
                ) - entity.stats.HP[0]
              }}
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 8 -->
          <td class="right-border"></td>
        </tr>

        <!-- === DEF === -->
        <tr class="stats-row">
          <!-- 1 -->
          <td></td>

          <!-- 2 -->
          <td class="label-cell">
            <img src="/assets/images/stats/DEF.webp" alt="DEF" />
            {{ language === "cn" ? "防御" : "DEF" }}
          </td>

          <!-- 3 -->
          <td>
            <div class="rank-cell">
              <img
                :class="!isShikigami ? 'opacity-0' : ''"
                :src="getStatRankImage('DEF', entity.stats.DEF[0])"
                :alt="getStatRank('DEF', entity.stats.DEF[0])"
              />
            </div>
          </td>

          <!-- 4 -->
          <td>
            {{ entity.stats.DEF[0] }}
          </td>

          <!-- 5 -->
          <td v-if="hasLevel40">
            <div class="rank-cell">
              <img
                :class="!isShikigami ? 'opacity-0' : ''"
                :src="getStatRankImage('DEF_EVO', entity.stats.DEF[1])"
                :alt="getStatRank('DEF_EVO', entity.stats.DEF[1])"
              />
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 6 -->
          <td v-if="hasLevel40">
            <div class="flex">
              {{ entity.stats.DEF[1] }}
              <span
                v-if="entity.evolution && entity.evolution.no === 12"
                class="increase-cell"
              >
                +{{ Math.round((entity.stats.DEF[1] * entity.evolution.count) / 100) }}
              </span>
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 7 -->
          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                Math.round(
                  entity.stats.DEF[1] *
                    (1 +
                      (entity.evolution && entity.evolution.no === 12
                        ? entity.evolution.count / 100
                        : 0))
                ) - entity.stats.DEF[0]
              }}
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 8 -->
          <td class="right-border"></td>
        </tr>

        <!-- === SPD === -->
        <tr class="stats-row">
          <!-- 1 -->
          <td></td>

          <!-- 2 -->
          <td class="label-cell">
            <img src="/assets/images/stats/SPD.webp" alt="SPD" />
            {{ language === "cn" ? "速度" : "SPD" }}
          </td>

          <!-- 3 -->
          <td>
            <div class="rank-cell">
              <img
                :class="!isShikigami ? 'opacity-0' : ''"
                :src="getStatRankImage('SPD', entity.stats.SPD[0])"
                :alt="getStatRank('SPD', entity.stats.SPD[0])"
              />
            </div>
          </td>

          <!-- 4 -->
          <td>
            {{ entity.stats.SPD[0] }}
          </td>

          <td v-if="hasLevel40">
            <div class="rank-cell">
              <img
                :class="!isShikigami ? 'opacity-0' : ''"
                :src="getStatRankImage('SPD', entity.stats.SPD[1])"
                :alt="getStatRank('SPD', entity.stats.SPD[1])"
              />
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 5 -->
          <td v-if="hasLevel40">
            <div class="flex">
              {{ entity.stats.SPD[1] }}

              <span
                v-if="entity.evolution && entity.evolution.no === 7"
                class="increase-cell"
              >
                +{{ entity.evolution.count }}
              </span>
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 6 -->
          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                (entity.evolution && entity.evolution.no === 7
                  ? entity.stats.SPD[1] + entity.evolution.count
                  : entity.stats.SPD[1]) - entity.stats.SPD[0]
              }}
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 7 -->
          <td class="right-border"></td>
        </tr>

        <!-- === CRIT === -->
        <tr class="stats-row">
          <!-- 1 -->
          <td></td>

          <!-- 2 -->
          <td class="label-cell">
            <img src="/assets/images/stats/CRIT.webp" alt="CRIT" />
            {{ language === "cn" ? "暴击" : "Crit" }}
          </td>

          <!-- 3 -->
          <td>
            <div class="rank-cell">
              <img
                :class="!isShikigami ? 'opacity-0' : ''"
                :src="getStatRankImage('CRIT', entity.stats.Crit[0])"
                :alt="getStatRank('CRIT', entity.stats.Crit[0])"
              />
            </div>
          </td>

          <!-- 4 -->
          <td>{{ entity.stats.Crit[0] }}%</td>

          <!-- 5 -->
          <td v-if="hasLevel40">
            <div class="rank-cell">
              <img
                :class="!isShikigami ? 'opacity-0' : ''"
                :src="getStatRankImage('CRIT', entity.stats.Crit[1])"
                :alt="getStatRank('CRIT', entity.stats.Crit[1])"
              />
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 6 -->
          <td v-if="hasLevel40">
            <div class="flex">
              {{ entity.stats.Crit[1] }}%

              <span
                v-if="entity.evolution && entity.evolution.no === 6"
                class="increase-cell"
              >
                +{{ entity.evolution.count }}%
              </span>
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 7 -->
          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                (entity.evolution && entity.evolution.no === 6
                  ? entity.stats.Crit[1] + entity.evolution.count
                  : entity.stats.Crit[1]) - entity.stats.Crit[0]
              }}%
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 8 -->
          <td class="right-border"></td>
        </tr>

        <!-- === CDMG === -->
        <tr class="stats-row">
          <!-- 1 -->
          <td></td>

          <!-- 2 -->
          <td class="label-cell">
            <img src="/assets/images/stats/CDMG.webp" alt="CDMG" />
            {{ language === "cn" ? "暴击伤害" : "Crit DMG" }}
          </td>

          <!-- 3 -->
          <td></td>

          <!-- 4 -->
          <td>{{ entity.stats.CritDMG ? entity.stats.CritDMG[0] : "150" }}%</td>

          <!-- 5 -->
          <td></td>

          <!-- 6 -->
          <td v-if="hasLevel40">
            {{ entity.stats.CritDMG ? entity.stats.CritDMG[1] : "150" }}%
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 7 -->
          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                entity.stats.CritDMG
                  ? entity.stats.CritDMG[1] - entity.stats.CritDMG[0]
                  : "0"
              }}%
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 8 -->
          <td class="right-border"></td>
        </tr>

        <!-- === HIT === -->
        <tr class="stats-row">
          <td></td>

          <td class="label-cell">
            <img src="/assets/images/stats/HIT.webp" alt="HIT" />
            {{ language === "cn" ? "效果命中" : "Effects HIT" }}
          </td>

          <td></td>

          <td>{{ entity.stats.EffectHIT ? entity.stats.EffectHIT[0] : "0" }}%</td>

          <td></td>

          <td v-if="hasLevel40">
            {{
              (entity.stats.EffectHIT ? entity.stats.EffectHIT[1] : 0) +
              (entity.evolution && entity.evolution.no === 9
                ? entity.evolution.count
                : 0)
            }}%
          </td>
          <td v-else class="empty-cell"></td>

          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                (entity.stats.EffectHIT
                  ? entity.stats.EffectHIT[1] - entity.stats.EffectHIT[0]
                  : 0) +
                (entity.evolution && entity.evolution.no === 9
                  ? entity.evolution.count
                  : 0)
              }}%
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <td class="right-border"></td>
        </tr>

        <!-- === RES === -->
        <tr class="stats-row">
          <td></td>

          <td class="label-cell">
            <img src="/assets/images/stats/RES.webp" alt="RES" />
            {{ language === "cn" ? "效果抵抗" : "Effects RES" }}
          </td>

          <td></td>

          <td>{{ entity.stats.EffectRES ? entity.stats.EffectRES[0] : "0" }}%</td>

          <td></td>

          <td v-if="hasLevel40">
            {{
              (entity.stats.EffectRES ? entity.stats.EffectRES[1] : 0) +
              (entity.evolution && entity.evolution.no === 10
                ? entity.evolution.count
                : 0)
            }}%
          </td>
          <td v-else class="empty-cell"></td>

          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                (entity.stats.EffectRES
                  ? entity.stats.EffectRES[1] - entity.stats.EffectRES[0]
                  : 0) +
                (entity.evolution && entity.evolution.no === 10
                  ? entity.evolution.count
                  : 0)
              }}%
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <td class="right-border"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
