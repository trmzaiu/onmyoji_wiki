import { ROLE_MAP } from "~/constants/role";

export const parseStats = (indicate) => {
  if (!indicate) return [];

  return indicate.split("/").map((slot) =>
    slot
      .split(/or/i)
      .map((s) => s.replace(/[()]/g, "").trim())
      .filter(Boolean)
  );
};

export function findSoulById(souls, id) {
  return souls.find((s) => s.id === id);
}

export function findSoulByIdName(souls, id, language) {
  const soul = findSoulById(souls, id);

  if (!soul) return "";

  return language === 'cn' ? soul.name.cn[0] : soul.name.en;
}

export function findSoulByIdSlug(souls, id) {
  const soul = findSoulById(souls, id);

  return soul ? soul.name.en.replace(/\s+/g, "_") : "";
}

export function getStatClass(stat) {
  stat = stat.toLowerCase();

  if (stat.includes("atk")) return "stat-atk";
  if (stat.includes("spd")) return "stat-spd";
  if (stat.includes("crit")) return "stat-crit";
  if (stat.includes("cdmg")) return "stat-cdmg";
  if (stat.includes("hp")) return "stat-hp";
  if (stat.includes("hit")) return "stat-hit";
  if (stat.includes("res")) return "stat-res";
  if (stat.includes("def")) return "stat-def";

  return "stat-default";
}

export function parseSubstats(text) {
  return text
    .replace(/=/g, " = ")
    .replace(/>>/g, " >> ")
    .replace(/>/g, " > ")
    .replace(/\//g, " / ")
    .trim()
    .split(/\s+/)
    .map((token) => {
      if (token === ">" || token === ">>" || token === "/") {
        return {
          type: "arrow",
          value: token,
        };
      }

      return {
        type: "stat",
        value: token,
      };
    });
}

export function getRoleClass(role) {
  return ROLE_MAP[role] || "bg-gray-500 text-black border-gray-200";
}

export function parseRoles(roleStr) {
  if (!roleStr) return [];

  return roleStr.split(/[/|]/).map((r) => r.trim());
}
