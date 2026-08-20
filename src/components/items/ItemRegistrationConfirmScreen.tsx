"use client";

import {
  useCallback,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";
import { FilterMenu } from "@/components/common/filter/FilterMenu";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { backendApi } from "@/services/api";
import {
  attachUploadedItemImage,
  uploadItemImage,
} from "@/services/itemRegistrationWorkflow";
import { useItemRegistrationStore } from "@/store/useItemRegistrationStore";
import { useMenuDataStore } from "@/store/useMenuDataStore";
import type { ColorGroup, ItemCategory, MaterialGroup } from "@/types/api";

const categories: ReadonlyArray<{ value: ItemCategory; label: string }> = [
  { value: "BAG", label: "가방" },
  { value: "LEATHER_GOODS", label: "가죽 소품" },
  { value: "FASHION_ACCESSORY", label: "패션 액세서리" },
  { value: "CLOTHING", label: "의류" },
  { value: "SHOES", label: "신발" },
];

const colorPresentations: Record<string, { label: string; hex: string }> = {
  BLACK: { label: "블랙", hex: "#222226" },
  WHITE: { label: "화이트", hex: "#ece8df" },
  BEIGE: { label: "베이지", hex: "#c9b89f" },
  BROWN: { label: "브라운", hex: "#806a51" },
  BLUE: { label: "블루", hex: "#3f4b62" },
  RED: { label: "레드", hex: "#9a4e4e" },
  GRAY: { label: "그레이", hex: "#86868d" },
  ORANGE: { label: "오렌지", hex: "#c97d42" },
  YELLOW: { label: "옐로우", hex: "#d9b84f" },
  GREEN: { label: "그린", hex: "#58745d" },
  PURPLE: { label: "퍼플", hex: "#716080" },
  PINK: { label: "핑크", hex: "#c98691" },
  METALLIC: { label: "메탈릭", hex: "#a5a5a8" },
  MULTI: { label: "멀티", hex: "#aaa19a" },
  OTHER: { label: "미입력", hex: "#d7cec2" },
};

const colorOptions = Object.entries(colorPresentations).map(([value, item]) => ({
  value,
  label: item.label,
}));

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

const materialOptions = Object.entries(materialLabels).map(([value, label]) => ({
  value,
  label,
}));

const fieldClassName =
  "h-[56px] w-full rounded-[12px] border border-[#dbdee3] bg-white px-[17px] text-[13px] text-[#15151a] outline-none transition-colors placeholder:text-[#6e707a] focus:border-[#8b7355]";

function getCategoryLabel(category: ItemCategory) {
  return categories.find((option) => option.value === category)?.label ?? category;
}

function getColorPresentation(primaryColor: string) {
  return (
    colorPresentations[primaryColor] ?? {
      label: primaryColor,
      hex: "#d7cec2",
    }
  );
}

function toNumericRequestId(id: string | null) {
  if (!id) {
    return null;
  }

  const value = Number(id);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function ItemRegistrationConfirmScreen() {
  const router = useRouter();
  const submitLockRef = useRef(false);
  const draft = useItemRegistrationStore((state) => state.draft);
  const photoFile = useItemRegistrationStore((state) => state.photoFile);
  const photoPreviewUrl = useItemRegistrationStore(
    (state) => state.photoPreviewUrl,
  );
  const analysisStatus = useItemRegistrationStore(
    (state) => state.analysisStatus,
  );
  const analysisMessage = useItemRegistrationStore(
    (state) => state.analysisMessage,
  );
  const aiJobId = useItemRegistrationStore((state) => state.aiJobId);
  const analysisImage = useItemRegistrationStore(
    (state) => state.analysisImage,
  );
  const materialSource = useItemRegistrationStore(
    (state) => state.materialSource,
  );
  const updateDraft = useItemRegistrationStore((state) => state.updateDraft);
  const updateMaterial = useItemRegistrationStore((state) => state.updateMaterial);
  const clearPhoto = useItemRegistrationStore((state) => state.clearPhoto);
  const markItemCreated = useItemRegistrationStore(
    (state) => state.markItemCreated,
  );
  const markImageUploadPending = useItemRegistrationStore(
    (state) => state.markImageUploadPending,
  );
  const clearPendingImageUpload = useItemRegistrationStore(
    (state) => state.clearPendingImageUpload,
  );
  const resetDraft = useItemRegistrationStore((state) => state.resetDraft);
  const addCreatedItem = useMenuDataStore((state) => state.addCreatedItem);
  const updateItemImage = useMenuDataStore((state) => state.updateItemImage);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [openFilter, setOpenFilter] = useState<"color" | "material" | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<
    "IDLE" | "CREATING" | "UPLOADING"
  >("IDLE");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSubmitting = submissionStatus !== "IDLE";

  const closeDialog = useCallback(() => {
    if (!isSubmitting) {
      setIsDialogOpen(false);
    }
  }, [isSubmitting]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.name.trim() || !draft.category) {
      setSubmitError("제품명과 카테고리를 입력해 주세요.");
      return;
    }

    setSubmitError(null);
    setIsDialogOpen(true);
  };

  const moveToItems = (myItemId: string, imageUploadPending = false) => {
    resetDraft();
    const query = new URLSearchParams({ registered: myItemId });
    if (imageUploadPending) {
      query.set("imageUpload", "pending");
    }
    router.replace(`/items?${query.toString()}`);
  };

  const handleConfirmRegistration = async () => {
    if (submitLockRef.current) {
      return;
    }

    const normalizedName = draft.name.trim();
    if (!normalizedName || !draft.category) {
      setIsDialogOpen(false);
      setSubmitError("제품명과 카테고리를 입력해 주세요.");
      return;
    }

    submitLockRef.current = true;
    setSubmissionStatus("CREATING");
    setSubmitError(null);

    const primaryColor = draft.primaryColor || "OTHER";
    const material = draft.material || "UNKNOWN";
    const colorPresentation = getColorPresentation(primaryColor);

    try {
      const response = await backendApi.closet.createItem({
        productId: null,
        name: normalizedName,
        brandName: draft.brandName.trim() || null,
        category: draft.category,
        primaryColor,
        material,
        materialSource,
        purchaseDate: draft.purchaseDate || null,
        purchasePrice: draft.purchasePrice ? Number(draft.purchasePrice) : null,
        purchaseOrderNumber: null,
        purchasePlace: draft.purchasePlace.trim() || null,
        memo: draft.memo.trim() || null,
        aiJobId:
          analysisStatus === "SUCCEEDED" ? toNumericRequestId(aiJobId) : null,
        nextCareDate: null,
      });
      const myItemId = response.data.data.myItemId;

      markItemCreated(myItemId);
      addCreatedItem({
        id: myItemId,
        name: normalizedName,
        category: getCategoryLabel(draft.category),
        color: colorPresentation.label,
        colorHex: colorPresentation.hex,
        brandName: draft.brandName.trim() || null,
        material,
        purchaseDate: draft.purchaseDate || null,
        purchasePrice: draft.purchasePrice ? Number(draft.purchasePrice) : null,
        purchasePlace: draft.purchasePlace.trim() || null,
        memo: draft.memo.trim() || null,
      });

      if (!photoFile) {
        clearPendingImageUpload();
        moveToItems(myItemId);
        return;
      }

      setSubmissionStatus("UPLOADING");
      try {
        const uploadedImage = analysisImage
          ? await attachUploadedItemImage(analysisImage, myItemId)
          : await uploadItemImage(photoFile, myItemId);
        updateItemImage(myItemId, uploadedImage.url);
        clearPendingImageUpload();
        moveToItems(myItemId);
      } catch {
        markImageUploadPending(myItemId);
        moveToItems(myItemId, true);
      }
    } catch (error) {
      submitLockRef.current = false;
      setSubmissionStatus("IDLE");
      setIsDialogOpen(false);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "아이템을 등록하지 못했습니다. 다시 시도해 주세요.",
      );
    }
  };

  return (
    <MobileScreenLayout
      figmaNodeId="119:986"
      contentClassName="bg-white px-6 pt-6 pb-8 text-[#0e0e12]"
      bottomNavigation={<BottomNavigation activeItem="register" />}
    >
      <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <h1 className="text-[17px] leading-6 font-bold">제품 정보 확인</h1>
        </LuxuryReveal>

        <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
          <LuxuryReveal
            className={`relative mt-[68px] ${openFilter ? "z-[9999]" : "z-0"}`}
            delay={60}
          >
            <div className="space-y-3">
              <input aria-label="제품명" value={draft.name} maxLength={200} placeholder="제품명 · Aren Shopper" className={fieldClassName} onChange={(event) => updateDraft({ name: event.target.value })} />
              <input aria-label="브랜드" value={draft.brandName} maxLength={100} placeholder="브랜드 · MCM" className={fieldClassName} onChange={(event) => updateDraft({ brandName: event.target.value })} />
              <select aria-label="카테고리" value={draft.category} className={fieldClassName} onChange={(event) => updateDraft({ category: event.target.value as ItemCategory })}>
                <option value="">카테고리 · 선택</option>
                {categories.map((category) => <option key={category.value} value={category.value}>카테고리 · {category.label}</option>)}
              </select>
              <div className="relative">
                <input aria-label="구매일" type="date" max={new Date().toISOString().slice(0, 10)} value={draft.purchaseDate} className={`${fieldClassName} cursor-pointer ${draft.purchaseDate ? "" : "text-transparent"}`} onChange={(event) => updateDraft({ purchaseDate: event.target.value })} />
                {!draft.purchaseDate ? <span className="pointer-events-none absolute inset-y-0 left-[17px] flex items-center text-[13px] text-[#6e707a]">구매일 · 선택</span> : null}
              </div>
              <div className={`${fieldClassName} flex items-center`}>
                <button type="button" onClick={() => router.push("/items/new")} className="min-w-0 flex-1 text-left text-[#6e707a]">
                  {photoPreviewUrl ? "제품 이미지 변경" : "제품 이미지 추가"}
                </button>
                {photoPreviewUrl ? <button type="button" onClick={clearPhoto} className="ml-3 text-[11px] font-semibold text-[#9a554d]">삭제</button> : null}
              </div>
            </div>

            <div className="relative z-[100] mt-6 grid grid-cols-[160px_120px] gap-1.5">
              <FilterMenu label="대표 색상" buttonLabel={`대표 색상 · ${getColorPresentation(draft.primaryColor || "OTHER").label}`} value={draft.primaryColor || "OTHER"} options={colorOptions} open={openFilter === "color"} onToggle={() => setOpenFilter((current) => current === "color" ? null : "color")} onChange={(value) => { updateDraft({ primaryColor: value as ColorGroup }); setOpenFilter(null); }} />
              <FilterMenu label="소재" buttonLabel={`소재 · ${materialLabels[(draft.material || "UNKNOWN") as MaterialGroup]}`} value={draft.material || "UNKNOWN"} options={materialOptions} align="right" open={openFilter === "material"} onToggle={() => setOpenFilter((current) => current === "material" ? null : "material")} onChange={(value) => { updateMaterial(value as MaterialGroup); setOpenFilter(null); }} />
            </div>

            <div className="relative z-0 mt-2.5 grid grid-cols-2 gap-1.5">
              <label className="flex h-8 items-center rounded-full border border-[#ded9d1] bg-[#f4f1ec] px-3 text-[10px] text-[#4b4741] focus-within:border-[#8b7355]">
                <input inputMode="numeric" min={0} type="number" value={draft.purchasePrice} placeholder="구매가격" aria-label="구매가격" className="w-full bg-transparent text-center outline-none placeholder:text-[#4b4741]" onChange={(event) => updateDraft({ purchasePrice: event.target.value })} />
              </label>
              <label className="flex h-8 items-center rounded-full border border-[#ded9d1] bg-[#f4f1ec] px-3 text-[10px] text-[#4b4741] focus-within:border-[#8b7355]">
                <input maxLength={200} value={draft.purchasePlace} placeholder="구매처" aria-label="구매처" className="w-full bg-transparent text-center outline-none placeholder:text-[#4b4741]" onChange={(event) => updateDraft({ purchasePlace: event.target.value })} />
              </label>
            </div>

            {analysisMessage ? <p role="status" className={`mt-3 text-[10px] leading-4 ${analysisStatus === "SUCCEEDED" ? "text-[#6f573a]" : "text-[#914b4b]"}`}>{analysisMessage}</p> : null}
          </LuxuryReveal>

          {submitError ? (
            <p
              role="alert"
              className="mt-4 rounded-[14px] bg-[#f8eeee] px-4 py-3 text-[11px] text-[#9a4545]"
            >
              {submitError}
            </p>
          ) : null}

          <LuxuryReveal className="mt-auto pt-8" delay={170}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#0e0e12] text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
            >
              {submissionStatus === "CREATING"
                ? "제품 정보 저장 중..."
                : submissionStatus === "UPLOADING"
                  ? "사진 업로드 중..."
                  : "등록 완료"}
            </button>
          </LuxuryReveal>
        </form>
      </div>

      <ConfirmDialog
        open={isDialogOpen}
        title="등록하시겠습니까?"
        description="확인한 제품 정보를 내 아이템에 등록합니다."
        confirmLabel="등록하기"
        pendingLabel={
          submissionStatus === "UPLOADING" ? "사진 업로드 중..." : "등록 중..."
        }
        isPending={isSubmitting}
        onCancel={closeDialog}
        onConfirm={() => void handleConfirmRegistration()}
      />
    </MobileScreenLayout>
  );
}
