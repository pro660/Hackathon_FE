import type { ColorGroup, ItemCategory, MaterialGroup } from "@/types/api";

export const categoryLabels: Record<ItemCategory, string> = {
  BAG: "가방",
  LEATHER_GOODS: "가죽 소품",
  FASHION_ACCESSORY: "패션 액세서리",
  CLOTHING: "의류",
  SHOES: "신발",
};

export const colorLabels: Record<ColorGroup, string> = {
  BLACK: "블랙",
  WHITE: "화이트",
  GRAY: "그레이",
  BROWN: "브라운",
  BEIGE: "베이지",
  RED: "레드",
  ORANGE: "오렌지",
  YELLOW: "옐로우",
  GREEN: "그린",
  BLUE: "블루",
  PURPLE: "퍼플",
  PINK: "핑크",
  METALLIC: "메탈릭",
  MULTI: "멀티",
  OTHER: "기타",
};

export const materialLabels: Record<MaterialGroup, string> = {
  LEATHER: "가죽",
  SYNTHETIC_LEATHER: "인조 가죽",
  CANVAS: "캔버스",
  FABRIC: "패브릭",
  NYLON: "나일론",
  METAL: "메탈",
  OTHER: "기타 소재",
  UNKNOWN: "확인 불가",
};

export function valueOrEmpty(value: string | number | null) {
  return value === null || value === "" ? "정보 없음" : String(value);
}

export function formatDate(value: string | null) {
  return value ? value.slice(0, 10).replaceAll("-", ".") : "정보 없음";
}

export function formatPrice(value: number | null) {
  return value === null ? "정보 없음" : `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}
