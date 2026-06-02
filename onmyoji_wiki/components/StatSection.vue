<script setup>
import { getStatRank, getStatRankImage } from "~/utils/helper/statHelper";

const props = defineProps({
	routeName: String,
  shikigami: Object,
  isEnglish: Boolean,
});


const hasLevel40 = computed(() => props.shikigami.value?.id !== 193);

</script>

<template>
  <div class="stats-wrapper">
    <table class="stats-table">
      <tbody>
        <!-- HEADER -->
        <tr class="stats-header">
          <!-- 1 -->
          <th>&nbsp;</th>

          <!-- 2 -->
          <th></th>

          <!-- 3 + 4 -->
          <th colspan="2">
            <div class="stats-title">
              {{
                shikigami.rarity !== "SP" &&
                shikigami.rarity !== "UR" &&
                shikigami.rarity !== "N"
                  ? isEnglish
                    ? "Unevolved"
                    : "Cơ bản"
                  : ""
              }}
              <br />
              {{ isEnglish ? "Level 1" : "Cấp 1" }}
            </div>
          </th>

          <!-- 5 + 6 -->
          <th colspan="2" v-if="hasLevel40">
            <div class="stats-title">
              {{
                shikigami.rarity !== "SP" &&
                shikigami.rarity !== "UR" &&
                shikigami.rarity !== "N"
                  ? isEnglish
                    ? "Evolved"
                    : "Thức tỉnh"
                  : ""
              }}
              <br />
              {{ isEnglish ? "Level 40" : "Cấp 40" }}
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
            <figure class="stats-figure">
              <img
                :src="`/assets/images/shikigami/icons/${routeName}_Icon.webp`"
                :alt="shikigami.name.jp[1]"
                class="stats-icon"
                @error="
                  (event) => (event.target.src = '/assets/images/Unknown_Icon.webp')
                "
              />
            </figure>
          </th>

          <!-- 5 + 6 -->
          <th colspan="2" v-if="hasLevel40" class="icon-cell">
            <figure class="stats-figure">
              <img
                :src="`/assets/images/shikigami/icons/${routeName}_Icon${
                  shikigami.rarity !== 'SP' &&
                  shikigami.rarity !== 'UR' &&
                  shikigami.rarity !== 'N'
                    ? '_Evo'
                    : ''
                }.webp`"
                :alt="shikigami.name.jp[1]"
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

        <!-- BORDER -->
        <tr class="top-border-row spacing-row">
          <th colspan="8"></th>
        </tr>

        <!-- === ATK === -->
        <tr class="stats-row">
          <!-- 1 -->
          <td></td>

          <!-- 2 -->
          <td class="label-cell">
            <img src="/assets/images/stats/ATK.webp" alt="ATK" />
            ATK
          </td>

          <!-- 3 -->
          <td>
            <div class="rank-cell">
              <img
                :src="getStatRankImage('ATK', shikigami.stats.ATK[0])"
                :alt="getStatRank('ATK', shikigami.stats.ATK[0])"
              />
            </div>
          </td>

          <!-- 4 -->
          <td>
            {{ shikigami.stats.ATK[0] }}
          </td>

          <!-- 5 -->
          <td v-if="hasLevel40">
            <div class="rank-cell">
              <img
                :src="getStatRankImage('ATK_EVO', shikigami.stats.ATK[1])"
                :alt="getStatRank('ATK_EVO', shikigami.stats.ATK[1])"
              />
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 6 -->
          <td v-if="hasLevel40">
            <div class="flex">
              {{ shikigami.stats.ATK[1] }}
              <span
                v-if="shikigami.evolution && shikigami.evolution.no === 1"
                class="increase-cell"
              >
                +{{
                  Math.round((shikigami.stats.ATK[1] * shikigami.evolution.count) / 100)
                }}
              </span>
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 7 -->
          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                Math.round(
                  shikigami.stats.ATK[1] *
                    (1 +
                      (shikigami.evolution && shikigami.evolution.no === 1
                        ? shikigami.evolution.count / 100
                        : 0))
                ) - shikigami.stats.ATK[0]
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
            HP
          </td>

          <!-- 3 -->
          <td>
            <div class="rank-cell">
              <img
                :src="getStatRankImage('HP', shikigami.stats.HP[0])"
                :alt="getStatRank('HP', shikigami.stats.HP[0])"
              />
            </div>
          </td>

          <!-- 4 -->
          <td>
            {{ shikigami.stats.HP[0] }}
          </td>

          <!-- 5 -->
          <td v-if="hasLevel40">
            <div class="rank-cell">
              <img
                :src="getStatRankImage('HP_EVO', shikigami.stats.HP[1])"
                :alt="getStatRank('HP_EVO', shikigami.stats.HP[1])"
              />
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 6 -->
          <td v-if="hasLevel40">
            <div class="flex">
              {{ shikigami.stats.HP[1] }}

              <span
                v-if="shikigami.evolution && shikigami.evolution.no === 4"
                class="increase-cell"
              >
                +{{
                  Math.round((shikigami.stats.HP[1] * shikigami.evolution.count) / 100)
                }}
              </span>
            </div>
          </td>
          <td v-else></td>

          <!-- 7  -->
          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                Math.round(
                  shikigami.stats.HP[1] *
                    (1 +
                      (shikigami.evolution && shikigami.evolution.no === 4
                        ? shikigami.evolution.count / 100
                        : 0))
                ) - shikigami.stats.HP[0]
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
            DEF
          </td>

          <!-- 3 -->
          <td>
            <div class="rank-cell">
              <img
                :src="getStatRankImage('DEF', shikigami.stats.DEF[0])"
                :alt="getStatRank('DEF', shikigami.stats.DEF[0])"
              />
            </div>
          </td>

          <!-- 4 -->
          <td>
            {{ shikigami.stats.DEF[0] }}
          </td>

          <!-- 5 -->
          <td v-if="hasLevel40">
            <div class="rank-cell">
              <img
                :src="getStatRankImage('DEF_EVO', shikigami.stats.DEF[1])"
                :alt="getStatRank('DEF_EVO', shikigami.stats.DEF[1])"
              />
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 6 -->
          <td v-if="hasLevel40">
            {{ shikigami.stats.DEF[1] }}
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 7 -->
          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                Math.round(
                  shikigami.stats.DEF[1] *
                    (1 +
                      (shikigami.evolution && shikigami.evolution.no === 12
                        ? shikigami.evolution.count / 100
                        : 0))
                ) - shikigami.stats.DEF[0]
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
            SPD
          </td>

          <!-- 3 -->
          <td>
            <div class="rank-cell">
              <img
                :src="getStatRankImage('SPD', shikigami.stats.SPD[0])"
                :alt="getStatRank('SPD', shikigami.stats.SPD[0])"
              />
            </div>
          </td>

          <!-- 4 -->
          <td>
            {{ shikigami.stats.SPD[0] }}
          </td>

          <td v-if="hasLevel40">
            <div class="rank-cell">
              <img
                :src="getStatRankImage('SPD_EVO', shikigami.stats.SPD[1])"
                :alt="getStatRank('SPD_EVO', shikigami.stats.SPD[1])"
              />
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 5 -->
          <td v-if="hasLevel40">
            <div class="flex">
              {{ shikigami.stats.SPD[1] }}

              <span
                v-if="shikigami.evolution && shikigami.evolution.no === 7"
                class="increase-cell"
              >
                +{{ shikigami.evolution.count }}
              </span>
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 6 -->
          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                (shikigami.evolution && shikigami.evolution.no === 7
                  ? shikigami.stats.SPD[1] + shikigami.evolution.count
                  : shikigami.stats.SPD[1]) - shikigami.stats.SPD[0]
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
            Crit
          </td>

          <!-- 3 -->
          <td>
            <div class="rank-cell">
              <img
                :src="getStatRankImage('CRIT', shikigami.stats.Crit[0])"
                :alt="getStatRank('CRIT', shikigami.stats.Crit[0])"
              />
            </div>
          </td>

          <!-- 4 -->
          <td>{{ shikigami.stats.Crit[0] }}%</td>

          <!-- 5 -->
          <td v-if="hasLevel40">
            <div class="rank-cell">
              <img
                :src="getStatRankImage('CRIT', shikigami.stats.Crit[1])"
                :alt="getStatRank('CRIT', shikigami.stats.Crit[1])"
              />
            </div>
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 6 -->
          <td v-if="hasLevel40">{{ shikigami.stats.Crit[1] }}%</td>
          <td v-else class="empty-cell"></td>

          <!-- 7 -->
          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                (shikigami.evolution && shikigami.evolution.no === 6
                  ? shikigami.stats.Crit[1] + shikigami.evolution.count
                  : shikigami.stats.Crit[1]) - shikigami.stats.Crit[0]
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
            Crit DMG
          </td>

          <!-- 3 -->
          <td></td>

          <!-- 4 -->
          <td>{{ shikigami.stats.CritDMG ? shikigami.stats.CritDMG[0] : "150" }}%</td>

          <!-- 5 -->
          <td></td>

          <!-- 6 -->
          <td v-if="hasLevel40">
            {{ shikigami.stats.CritDMG ? shikigami.stats.CritDMG[1] : "150" }}%
          </td>
          <td v-else class="empty-cell"></td>

          <!-- 7 -->
          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                shikigami.stats.CritDMG
                  ? shikigami.stats.CritDMG[1] - shikigami.stats.CritDMG[0]
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
            Effects HIT
          </td>

          <td></td>

          <td>{{ shikigami.stats.EffectHIT ? shikigami.stats.EffectHIT[0] : "0" }}%</td>

          <td></td>

          <td v-if="hasLevel40">
            {{
              (shikigami.stats.EffectHIT ? shikigami.stats.EffectHIT[1] : 0) +
              (shikigami.evolution && shikigami.evolution.no === 9
                ? shikigami.evolution.count
                : 0)
            }}%
          </td>
          <td v-else class="empty-cell"></td>

          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                (shikigami.stats.EffectHIT
                  ? shikigami.stats.EffectHIT[1] - shikigami.stats.EffectHIT[0]
                  : 0) +
                (shikigami.evolution && shikigami.evolution.no === 9
                  ? shikigami.evolution.count
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
            Effects RES
          </td>

          <td></td>

          <td>{{ shikigami.stats.EffectRES ? shikigami.stats.EffectRES[0] : "0" }}%</td>

          <td></td>

          <td v-if="hasLevel40">
            {{
              (shikigami.stats.EffectRES ? shikigami.stats.EffectRES[1] : 0) +
              (shikigami.evolution && shikigami.evolution.no === 10
                ? shikigami.evolution.count
                : 0)
            }}%
          </td>
          <td v-else class="empty-cell"></td>

          <td v-if="hasLevel40">
            <div class="bonus-stat">
              +{{
                (shikigami.stats.EffectRES
                  ? shikigami.stats.EffectRES[1] - shikigami.stats.EffectRES[0]
                  : 0) +
                (shikigami.evolution && shikigami.evolution.no === 10
                  ? shikigami.evolution.count
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
