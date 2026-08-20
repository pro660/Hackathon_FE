const hiddenKeys = new Set([
  "myItemId",
  "available",
  "material",
  "materialSource",
  "month",
  "source",
  "generationType",
  "policyVersion",
  "version",
  "createdAt",
  "updatedAt",
]);

const labelMap: Record<string, string> = {
  nextRecommendedCare: "다음 권장 관리",
  nextCareDate: "다음 권장일",
  careGuide: "관리 방법",
  instructions: "관리 방법",
  guide: "관리 안내",
  summary: "핵심 안내",
  storageGuide: "보관 안내",
  storageMethod: "보관 방법",
  avoidEnvironment: "피해야 할 환경",
  environmentsToAvoid: "피해야 할 환경",
  humidityGuide: "습기 관리",
  humidityManagement: "습기 관리",
  warning: "주의사항",
  warnings: "주의사항",
  events: "관리 일정",
  schedules: "관리 일정",
};

export type GuideEntry = {
  key: string;
  label: string;
  value: string;
};

function humanizeKey(key: string) {
  return labelMap[key] ?? key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function stringifyValue(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const values = value
      .map((entry) => stringifyValue(entry))
      .filter((entry): entry is string => Boolean(entry));
    return values.length ? values.join("\n") : null;
  }
  if (value && typeof value === "object") {
    const values = Object.values(value)
      .map((entry) => stringifyValue(entry))
      .filter((entry): entry is string => Boolean(entry));
    return values.length ? values.join("\n") : null;
  }
  return null;
}

export function getGuideEntries(data: Record<string, unknown>) {
  return Object.entries(data).flatMap(([key, value]) => {
    if (hiddenKeys.has(key) || value === null || value === undefined) return [];
    const rendered = stringifyValue(value);
    return rendered ? [{ key, label: humanizeKey(key), value: rendered }] : [];
  });
}

export function findDateText(entries: GuideEntry[]) {
  return entries.map((entry) => entry.value).find((value) => /\d{4}[-.]\d{2}[-.]\d{2}/.test(value));
}
