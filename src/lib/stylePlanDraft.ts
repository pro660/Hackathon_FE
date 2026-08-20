import type {
  OccasionTag,
  StylePlanSliderContext,
  StylePlanWeatherCondition,
} from "@/types/api";

export const personalizeTagsStorageKey = "personalize:selected-tags";
export const stylePlanContextStorageKey = "personalize:style-plan-context";
export const stylePlanIdempotencyStorageKey = "personalize:style-plan-idempotency";

export const smartMoodOptions = [
  { value: "MINIMAL", label: "미니멀" },
  { value: "STREET", label: "스트릿" },
  { value: "CLASSIC", label: "클래식" },
  { value: "Y2K", label: "Y2K" },
  { value: "EXHIBITION", label: "전시" },
  { value: "CAFE", label: "카페" },
  { value: "TRAVEL", label: "여행" },
  { value: "DATE", label: "데이트" },
] as const;

export type SmartMood = (typeof smartMoodOptions)[number]["value"];

const smartMoodValues = new Set<string>(
  smartMoodOptions.map((option) => option.value),
);

const moodLevelPresets: Partial<
  Record<SmartMood, { casualFormalLevel: number; neatGlamorousLevel: number }>
> = {
  MINIMAL: { casualFormalLevel: 5, neatGlamorousLevel: 2 },
  STREET: { casualFormalLevel: 2, neatGlamorousLevel: 7 },
  CLASSIC: { casualFormalLevel: 8, neatGlamorousLevel: 3 },
  Y2K: { casualFormalLevel: 3, neatGlamorousLevel: 9 },
};

export function readSelectedSmartMoods(): SmartMood[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const serialized = window.localStorage.getItem(personalizeTagsStorageKey);
    const values = serialized ? (JSON.parse(serialized) as unknown) : [];

    return Array.isArray(values)
      ? values.filter(
          (value): value is SmartMood =>
            typeof value === "string" && smartMoodValues.has(value),
        )
      : [];
  } catch {
    return [];
  }
}

export function writeSelectedSmartMoods(values: SmartMood[]) {
  window.localStorage.setItem(
    personalizeTagsStorageKey,
    JSON.stringify(values),
  );
}

export function clearSelectedSmartMoods() {
  window.localStorage.removeItem(personalizeTagsStorageKey);
}

export function createMoodConditionDefaults(values: SmartMood[]) {
  const presets = values
    .map((value) => moodLevelPresets[value])
    .filter(
      (
        preset,
      ): preset is {
        casualFormalLevel: number;
        neatGlamorousLevel: number;
      } => Boolean(preset),
    );

  const average = (key: "casualFormalLevel" | "neatGlamorousLevel") =>
    presets.length > 0
      ? Math.round(
          presets.reduce((sum, preset) => sum + preset[key], 0) /
            presets.length,
        )
      : 5;

  return {
    casualFormalLevel: average("casualFormalLevel"),
    neatGlamorousLevel: average("neatGlamorousLevel"),
  };
}

function readOccasion(values: SmartMood[]): OccasionTag {
  if (values.includes("DATE")) {
    return "DATE";
  }

  if (values.includes("TRAVEL")) {
    return "TRAVEL";
  }

  if (values.includes("EXHIBITION")) {
    return "GATHERING";
  }

  return "DAILY";
}

export function createStylePlanSliderContext(
  selectedTags: SmartMood[],
  casualFormalLevel: number,
  neatGlamorousLevel: number,
  weatherCondition: StylePlanWeatherCondition,
  prioritizeOwnedItems: boolean,
): StylePlanSliderContext {
  return {
    occasion: readOccasion(selectedTags),
    casualFormalLevel,
    neatGlamorousLevel,
    weatherCondition,
    prioritizeOwnedItems,
    language: "ko",
  };
}

export function readStylePlanSliderContext(): StylePlanSliderContext | null {
  const serialized = window.localStorage.getItem(stylePlanContextStorageKey);
  if (!serialized) {
    return null;
  }

  try {
    const context = JSON.parse(serialized) as Partial<StylePlanSliderContext>;
    const validLevels = [
      context.casualFormalLevel,
      context.neatGlamorousLevel,
    ].every(
      (level) =>
        typeof level === "number" &&
        Number.isInteger(level) &&
        level >= 1 &&
        level <= 10,
    );

    if (
      !validLevels ||
      !context.occasion ||
      context.prioritizeOwnedItems === undefined ||
      context.language !== "ko"
    ) {
      return null;
    }

    return context as StylePlanSliderContext;
  } catch {
    return null;
  }
}
