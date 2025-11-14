export function createHighLightWord({
    effects,
    isEnglish,
    shikigami,
    shikigamiList,
    addIngForm
}) {
    return function highlightWord(text) {
        if (!text || !effects?.length) return text;

        let processedText = text;
        const effectById = new Map(effects.map((e) => [String(e.id), e]));
        const effectMap = new Map();
        const effectKeywordOverrides = new Map();

        // build effectMap
        effects.forEach((note) => {
            const addToMap = (n) => {
                const names = [];
                if (n.name?.en) names.push(n.name.en);
                if (n.name?.vn && n.name.vn !== n.name.en) names.push(n.name.vn);
                if (n.name?.cn && n.name.cn !== n.name.en && n.name.cn !== n.name.vn) {
                    names.push(n.name.cn);
                }
                names.forEach((name) => {
                    if (!effectMap.has(name.toLowerCase())) {
                        effectMap.set(name.toLowerCase(), n);
                    }
                });
            };

            addToMap(note);
            if (note.subs?.length) {
                note.subs.forEach((subId) => {
                    const sub = effectById.get(subId);
                    if (sub) addToMap(sub);
                });
            }
        });

        const colorMap = { red: "#a63f37", blue: "#4994d4", yellow: "#c07b2a" };

        processedText = processedText.replace(
            /<(b|a)>(\d+)<\/\1>(?:<n>(.*?)<\/n>)?/g,
            (match, tag, id, nValue) => {
                const note = effectById.get(id);
                if (!note) return match;

                let textVN = note.name?.vn;
                let textEN = note.name?.en;

                textVN = textVN.replace("{count}", nValue || "").trim();

                effectKeywordOverrides.set(id, isEnglish ? textEN : textVN);

                return `<${tag}>${id}</${tag}>`;
            }
        );

        processedText = processedText.replace(/<n>.*?<\/n>/g, "");

        const replaceWithTooltip = (match, content, type, hasIng = false) => {
            let note = null;

            if (/^\d+$/.test(content)) {
                note = effectById.get(content);
            } else {
                note = effectMap.get(content.toLowerCase());
            }

            if (!note) return match;

            let keywordForDisplay;
            let keywordForTooltip;

            if (type === "b") {
                const keywordOverride = effectKeywordOverrides.get(String(note.id));
                keywordForDisplay = keywordOverride
                    ? keywordOverride
                    : (isEnglish ? note.name?.en : note.name?.vn || note.name?.en);
                keywordForTooltip = isEnglish
                    ? note.name?.en
                    : note.name?.vn?.replace("{count}", "").trim() || note.name?.en;
            } else {
                keywordForDisplay = isEnglish
                    ? note.name?.en
                    : note.name?.vn?.replace("{count}", "").trim() || note.name?.en;
                keywordForTooltip = keywordForDisplay;
            }

            const noteDesc = isEnglish ? note.description?.en : note.description?.vn;
            const color = note.color ? colorMap[note.color] || "#a51919" : "#a51919";

            let keyword = keywordForDisplay;

            if (type === "f" || type === "l") {
                if (keyword.startsWith("HP ")) {
                    keyword = "HP " + keyword.slice(3).toLowerCase();
                } else if (keyword.toUpperCase() === "HP") {
                    keyword = "HP";
                } else {
                    keyword = keyword.toLowerCase();
                }
            }

            if (type === "g") {
                keyword = keyword.toLowerCase();
                keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            }

            if (hasIng) {
                keyword = addIngForm(keyword);
            }

            if (type === "b") {
                return `<span class="effect-tooltip"
                  data-name="${keywordForTooltip}"
                  data-name-cn="${note.name?.cn || ""}"
                  data-desc="${noteDesc ? noteDesc.replace(/"/g, "&quot;") : ""}"
                  data-img='${JSON.stringify(note.images || [])}'
                  data-color="${color}"
                  style="color:${color}">${keyword}</span>`;
            } else {
                return (type === "i" || type === "l")
                    ? `<span>${keyword}</span>`
                    : `<span class="effect-highlight" style="color:${color}">${keyword}</span>`;
            }
        };

        const replaceShikigami = (match, content) => {
            if (!shikigamiList?.length) return match;
            const shiki = shikigamiList.find((s) => String(s.id) === String(content));
            if (!shiki) return match;

            const keyword = isEnglish
                ? shiki.name?.en || ""
                : shiki.name?.vn || shiki.name?.en || "";

            return `<span>${keyword}</span>`;
        };

        const replaceSkill = (match, content, type) => {
            const index = parseInt(content, 10);
            if (isNaN(index) || !shikigami?.skills?.length) return match;
            const skill = shikigami.skills[index - 1];
            if (!skill) return match;

            const keyword = isEnglish
                ? skill.name?.en || ""
                : skill.name?.vn || skill.name?.en || "";

            if (type === "c") {
                return `<span class="skill-keyword text-[#c07b2a] font-bold cursor-pointer" data-keyword="${keyword}">${keyword}</span>`;
            } else if (type === "m") {
                return `<span class="skill-keyword text-[#c07b2a]">${keyword}</span>`;
            } else if (type === "o") {
                return `<span>${keyword}</span>`;
            }

            return match;
        };

        const replaceSkin = (match, content) => {
            const index = parseInt(content, 10);
            if (isNaN(index) || !shikigami?.skins?.length) return match;

            const skin = shikigami.rarity !== "SP"
                ? shikigami.skins[index + 1]
                : shikigami.skins[index];
            if (!skin) return match;

            let keyword = "";
            let extraClass = "";

            if (isEnglish) {
                if (skin.name?.en) keyword = skin.name.en;
                else if (skin.name?.cn) {
                    keyword = skin.name.cn;
                    extraClass = "lang-zh";
                }
            } else {
                keyword = skin.name?.vn || "";
                if (!keyword && skin.name?.cn) {
                    keyword = skin.name.cn;
                    extraClass = "lang-zh";
                }
            }

            return `<span class="${extraClass}">${keyword}</span>`;
        };

        const replaceSkillRef = (match, content, type) => {
            const [shikiIdStr, skillIndexStr] = content.split("-");
            const shikiId = parseInt(shikiIdStr, 10);
            const skillIndex = parseInt(skillIndexStr, 10);

            if (!shikigamiList?.length) return match;

            let shiki = shikigamiList.find((s) => String(s.id) === String(shikiId));

            if (!shiki || !shiki.skills?.length) return match;

            const skill = shiki.skills[skillIndex - 1];
            if (!skill) return match;

            const keyword = isEnglish
                ? skill.name?.en || ""
                : skill.name?.vn || skill.name?.en || "";

            if (type === "d") {
                return `<span class="skill-keyword text-[#c07b2a] font-bold cursor-pointer" data-keyword="${keyword}">${keyword}</span>`;
            } else if (type === "p") {
                return `<span class="skill-keyword text-[#c07b2a]">${keyword}</span>`;
            }

            return match;
        };

        // === special tags ===
        processedText = processedText
            .replace(
                /<e>(.*?)<\/e>/g,
                (_, keyword) =>
                    `<img src="/assets/effects/${keyword}.webp" alt="${keyword}" class="inline-block w-6 h-6 align-text-bottom rounded rounded-md" />`
            )
            .replace(/<k>(.*?)<\/k>/g, (m, content) => replaceShikigami(m, content));

        processedText = processedText.replace(
            /<(d|p)>(.*?)<\/\1>/g,
            (m, type, content) => replaceSkillRef(m, content, type)
        );

        processedText = processedText.replace(
            /<(c|m|o)>(.*?)<\/\1>/g,
            (m, type, content) => replaceSkill(m, content, type)
        );

        processedText = processedText.replace(
            /<q>(.*?)<\/q>/g,
            (m, content) => replaceSkin(m, content)
        );

        processedText = processedText.replace(
            /<(f|g|b|a|h|i|l)>(.*?)<\/\1>/g,
            (match, type, content, offset, fullString) => {
                const after = fullString.slice(offset + match.length);
                const hasIng = after.startsWith("ing");

                return replaceWithTooltip(match, content, type, hasIng);
            }
        );

        return processedText;
    };
}
