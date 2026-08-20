import {
  productTagLabels,
  type ColorGroup,
  type ItemCategory,
  type MaterialGroup,
  type ProductDetail,
} from "@/types/api";

const categoryLabels: Record<ItemCategory, string> = {
  BAG: "가방",
  LEATHER_GOODS: "가죽 소품",
  FASHION_ACCESSORY: "패션 액세서리",
  CLOTHING: "의류",
  SHOES: "신발",
};

const colorLabels: Record<ColorGroup, string> = {
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
  MULTI: "멀티 컬러",
  OTHER: "기타",
};

const materialLabels: Record<MaterialGroup, string> = {
  LEATHER: "가죽",
  SYNTHETIC_LEATHER: "인조 가죽",
  CANVAS: "캔버스",
  FABRIC: "패브릭",
  NYLON: "나일론",
  METAL: "메탈",
  OTHER: "기타 소재",
  UNKNOWN: "확인 불가",
};

function TagList({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="text-[12px] text-[#92929a]">정보 없음</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className="rounded-full bg-[#f1eee9] px-2.5 py-1 text-[11px] font-semibold text-[#57514a]"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

export function ProductAttributes({ product }: { product: ProductDetail }) {
  const rows = [
    ["카테고리", [categoryLabels[product.category]]],
    ["대표 색상", [colorLabels[product.primaryColor]]],
    ["소재", [materialLabels[product.material]]],
    ["스타일", product.tags.styles.map((tag) => productTagLabels.style[tag])],
    ["계절", product.tags.seasons.map((tag) => productTagLabels.season[tag])],
    ["추천 상황", product.tags.occasions.map((tag) => productTagLabels.occasion[tag])],
    ["특징", product.tags.features.map((tag) => productTagLabels.feature[tag])],
  ] as const;

  return (
    <section className="mt-6 rounded-[18px] border border-[#e3e1de] bg-[#faf9f7] px-4 py-1">
      <h2 className="border-b border-[#e6e3df] py-4 text-[14px] font-bold">
        제품 정보
      </h2>
      <dl>
        {rows.map(([label, values]) => (
          <div
            key={label}
            className="grid grid-cols-[76px_1fr] gap-3 border-b border-[#ebe8e4] py-3.5 last:border-b-0"
          >
            <dt className="text-[12px] font-semibold text-[#77736d]">{label}</dt>
            <dd><TagList values={[...values]} /></dd>
          </div>
        ))}
      </dl>
      <div className="grid grid-cols-[76px_1fr] gap-3 border-t border-[#e6e3df] py-3.5">
        <span className="text-[12px] font-semibold text-[#77736d]">상품 코드</span>
        <span className="break-all text-[12px] font-semibold text-[#252529]">{product.sku}</span>
      </div>
    </section>
  );
}
