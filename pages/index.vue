<script setup></script>

<template>
  <div class="container">
    <div class="content-section flex flex-col gap-4">
      <div class="header-row">
        <div class="title">Home</div>
      </div>

      <div>
        <b>Onmyoji </b>is a 3D RPG developed by NetEase Games. Follow the legendary
        onmyoji <b><a href="/onmyoji/Seimei" class="text-[#a51919]">Seimei</a></b> in his
        in his journey to recover his lost memories while encountering demons of all
        shapes and forms. Unravel the supernatural tales of the
        <b><a href="/Shikigami" class="text-[#a51919]">shikigami</a></b
        >, spirits, and demons, and listen to their inner voices. The game can be played
        on PC, Android and iOS.
      </div>

      <h2 class="session-title">Game Features</h2>

      <table>
        <tbody>
          <tr>
            <th>
              <div class="grid grid-cols-3 gap-4 p-3">
                <div class="cell">
                  <img src="/assets/images/stats/Events.webp" alt="Event" class="h-28" />
                  <span>Events</span>
                </div>
                <div class="cell">
                  <img
                    src="/assets/images/stats/Bounty.webp"
                    alt="Wanted Quest"
                    class="h-28"
                  />
                  <span>Wanted Quests</span>
                </div>
                <div class="cell">
                  <img
                    src="/assets/images/stats/Boss.webp"
                    alt="Demon Encounter"
                    class="h-28"
                  />
                  <span>Demon Encounter</span>
                </div>
              </div>
            </th>
          </tr>

          <tr class="border-2 border-[#a51919] bg-[#a51919]">
            <th class="text-white py-1">Mechanics</th>
          </tr>

          <tr class="border-2 border-[#a51919]">
            <td>
              <div class="grid grid-cols-4 gap-4 p-3 items-end">
                <div class="cell">
                  <img src="/assets/images/stats/Move_Bar.webp" alt="Move Bar" />
                  <span>Move Bar</span>
                </div>
                <div class="cell">
                  <img src="/assets/images/stats/Formulas.webp" alt="Formulas" />
                  <span>Formulas</span>
                </div>
                <div class="cell">
                  <img src="/assets/images/stats/Skills.webp" alt="Skills" />
                  <span>Skills</span>
                </div>
                <div class="cell">
                  <img src="/assets/images/stats/Damage.webp" alt="Damage" />
                  <span>Damage</span>
                </div>
              </div>
            </td>
          </tr>

          <tr class="border-2 border-[#a51919] bg-[#a51919]">
            <th class="text-white py-1">Courtyart</th>
          </tr>

          <tr class="border-2 border-[#a51919]">
            <td>
              <div class="grid grid-cols-6 gap-4 p-3 items-end">
                <div class="cell">
                  <img src="/assets/images/stats/Collection.webp" alt="Collection" />
                  <span>Collection</span>
                </div>
                <div class="cell">
                  <img src="/assets/images/stats/Guild.webp" alt="Guild" />
                  <span>Guild</span>
                </div>
                <div class="cell">
                  <img src="/assets/images/stats/Mall.webp" alt="Mall" />
                  <span>Mall</span>
                </div>
                <div class="cell">
                  <img src="/assets/images/stats/Missions.webp" alt="Missions" />
                  <span>Missions</span>
                </div>
                <div class="cell">
                  <a class="cursor-pointer" href="/onmyoji">
                    <img src="/assets/images/stats/Onmyoji.webp" alt="Onmyoji" />
                  </a>
                  <span><a href="/onmyoji">Onmyoji</a></span>
                </div>
                <div class="cell">
                  <a class="cursor-pointer" href="/shikigami">
                    <img src="/assets/images/stats/Shikigami.webp" alt="Shikigami" />
                  </a>
                  <span><a href="/shikigami">Shikigami</a></span>
                </div>
              </div>
            </td>
          </tr>

          <tr class="border-2 border-[#a51919] bg-[#a51919]">
            <th class="text-white py-1">Misc.</th>
          </tr>

          <tr class="border-2 border-[#a51919]">
            <td>
              <div class="grid grid-cols-6 gap-4 p-3 items-end">
                <div class="cell">
                  <img src="/assets/images/stats/Illust.webp" alt="Illustrations" />
                  <span>Illustrations</span>
                </div>
                <div class="cell">
                  <img src="/assets/images/stats/Frames.webp" alt="Frames" />
                  <span>Frames</span>
                </div>
                <div class="cell">
                  <img src="/assets/images/stats/Items.webp" alt="Items" />
                  <span>Items</span>
                </div>
                <div class="cell">
                  <a class="cursor-pointer" href="/pets">
                    <img src="/assets/images/stats/Pets.webp" alt="Pets" />
                  </a>
                  <span><a href="/pets">Pets</a></span>
                </div>
                <div class="cell">
                  <img src="/assets/images/stats/Duel.webp" alt="Duel" />
                  <span>Duel</span>
                </div>
                <div class="cell">
                  <a class="cursor-pointer" href="/souls">
                    <img src="/assets/images/stats/Souls.webp" alt="Souls" />
                  </a>
                  <span><a href="/souls">Souls</a></span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/styles.css"></style>
