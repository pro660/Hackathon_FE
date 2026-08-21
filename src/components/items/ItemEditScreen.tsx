"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { FilterMenu } from "@/components/common/filter/FilterMenu";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/apiError";
import { backendApi } from "@/services/api";
import { uploadImageAsset } from "@/services/itemRegistrationWorkflow";
import { useMenuDataStore } from "@/store/useMenuDataStore";
import type {
  ColorGroup,
  ItemCategory,
  MaterialGroup,
} from "@/types/api";
import type { ClosetItem } from "@/types/menu";

type ItemEditScreenProps = { itemId: string };
type OpenFilter = "color" | "material" | null;

type EditDraft = {
  name: string;
  brandName: string;
  category: ItemCategory;
  primaryColor: ColorGroup;
  material: MaterialGroup;
  purchaseDate: string;
  purchasePrice: string;
  purchasePlace: string;
  memo: string;
};

const categoryOptions: Array<{ value: ItemCategory; label: string }> = [
  { value: "BAG", label: "가방" },
  { value: "LEATHER_GOODS", label: "가죽 소품" },
  { value: "FASHION_ACCESSORY", label: "패션 액세서리" },
  { value: "CLOTHING", label: "의류" },
  { value: "SHOES", label: "신발" },
];

const colorOptions: Array<{ value: ColorGroup; label: string }> = [
  { value: "BLACK", label: "블랙" },
  { value: "WHITE", label: "화이트" },
  { value: "GRAY", label: "그레이" },
  { value: "BROWN", label: "브라운" },
  { value: "BEIGE", label: "베이지" },
  { value: "RED", label: "레드" },
  { value: "ORANGE", label: "오렌지" },
  { value: "YELLOW", label: "옐로우" },
  { value: "GREEN", label: "그린" },
  { value: "BLUE", label: "블루" },
  { value: "PURPLE", label: "퍼플" },
  { value: "PINK", label: "핑크" },
  { value: "METALLIC", label: "메탈릭" },
  { value: "MULTI", label: "멀티" },
  { value: "OTHER", label: "기타" },
];

const materialOptions: Array<{ value: MaterialGroup; label: string }> = [
  { value: "LEATHER", label: "가죽" },
  { value: "SYNTHETIC_LEATHER", label: "인조 가죽" },
  { value: "CANVAS", label: "캔버스" },
  { value: "FABRIC", label: "패브릭" },
  { value: "NYLON", label: "나일론" },
  { value: "METAL", label: "메탈" },
  { value: "OTHER", label: "기타 소재" },
  { value: "UNKNOWN", label: "확인 불가" },
];

const emptyDraft: EditDraft = {
  name: "",
  brandName: "",
  category: "BAG",
  primaryColor: "OTHER",
  material: "UNKNOWN",
  purchaseDate: "",
  purchasePrice: "",
  purchasePlace: "",
  memo: "",
};

const fieldShellClassName =
  "flex h-14 items-center rounded-[12px] border border-[#dbdee3] bg-white px-[18px] text-[13px] leading-4 text-[#6e707a] transition-colors focus-within:border-[#8b7355]";
const fieldControlClassName =
  "min-w-0 flex-1 bg-transparent text-[13px] text-[#15151a] outline-none placeholder:text-[#aaaab1]";

function findCategory(item: ClosetItem): ItemCategory {
  return (
    categoryOptions.find(
      (option) => option.value === item.category || option.label === item.category,
    )?.value ?? "BAG"
  );
}

function toDraft(item: ClosetItem): EditDraft {
  return {
    name: item.name,
    brandName: item.brandName ?? "",
    category: findCategory(item),
    primaryColor: colorOptions.some((option) => option.value === item.color)
      ? (item.color as ColorGroup)
      : "OTHER",
    material: materialOptions.some((option) => option.value === item.material)
      ? (item.material as MaterialGroup)
      : "UNKNOWN",
    purchaseDate: item.purchaseDate ?? "",
    purchasePrice: item.purchasePrice?.toString() ?? "",
    purchasePlace: item.purchasePlace ?? "",
    memo: item.memo ?? "",
  };
}

function formatDate(value?: string | null) {
  return value ? value.slice(0, 10).replaceAll("-", ".") : "미입력";
}

export function ItemEditScreen({ itemId }: ItemEditScreenProps) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const loadItem = useMenuDataStore((state) => state.loadItem);
  const updateItem = useMenuDataStore((state) => state.updateItem);
  const [item, setItem] = useState<ClosetItem | null>(null);
  const [draft, setDraft] = useState<EditDraft>(emptyDraft);
  const [nextImage, setNextImage] = useState<File | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [openFilter, setOpenFilter] = useState<OpenFilter>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadItem(itemId).then((loadedItem) => {
      if (!active) return;
      if (loadedItem) {
        setItem(loadedItem);
        setDraft(toDraft(loadedItem));
      } else {
        setErrorMessage("수정할 아이템을 찾을 수 없습니다.");
      }
      setHasLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [itemId, loadItem]);

  const updateDraft = (patch: Partial<EditDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setNextImage(file);
    setRemoveCurrentImage(false);
    setErrorMessage(null);
    event.target.value = "";
  };

  const saveImageChange = async () => {
    if (nextImage) {
      const uploaded = await uploadImageAsset(nextImage);
      try {
        await backendApi.closet.attachImage(itemId, uploaded.imageAssetId);
      } catch (error) {
        await backendApi.closet.deleteImageAsset(uploaded.imageAssetId).catch(() => undefined);
        throw error;
      }
      return;
    }

    if (removeCurrentImage && item?.imageId) {
      await backendApi.closet.removeImage(itemId, item.imageId);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || !draft.name.trim()) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateItem(itemId, {
        name: draft.name.trim(),
        brandName: draft.brandName.trim() || null,
        category: draft.category,
        primaryColor: draft.primaryColor,
        material: draft.material,
        materialSource: "USER_CONFIRMED",
        purchaseDate: draft.purchaseDate || null,
        purchasePrice: draft.purchasePrice ? Number(draft.purchasePrice) : null,
        purchasePlace: draft.purchasePlace.trim() || null,
        memo: draft.memo.trim() || null,
      });
      await saveImageChange();
      router.replace(`/items/${encodeURIComponent(itemId)}?updated=1`);
      router.refresh();
    } catch (error) {
      const errorCode = getApiErrorCode(error);
      const isVersionConflict =
        errorCode?.includes("VERSION") || errorCode?.includes("CONFLICT");
      setErrorMessage(
        isVersionConflict
          ? "다른 곳에서 제품 정보가 먼저 수정됐어요. 최신 정보를 다시 불러와 주세요."
          : getApiErrorMessage(error, "변경사항을 저장하지 못했습니다."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await backendApi.closet.deleteItem(itemId);
      router.replace("/items");
      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "아이템을 삭제하지 못했습니다."));
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <MobileScreenLayout
      figmaNodeId="119:986"
      contentClassName="bg-white px-6 pt-4 pb-8 text-[#0e0e12]"
      bottomNavigation={<BottomNavigation activeItem="items" />}
    >
      <form className="flex min-h-full flex-col" onSubmit={handleSubmit}>
        <LuxuryReveal>
          <BackButton />
          <h1 className="mt-1 text-[17px] leading-6 font-bold">제품 정보 수정</h1>
        </LuxuryReveal>

        {!hasLoaded ? (
          <div className="mt-[68px] space-y-3" aria-label="제품 정보 불러오는 중">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-[12px] bg-[#efede9]" />
            ))}
          </div>
        ) : (
          <LuxuryReveal
            className={`relative mt-[68px] ${openFilter ? "z-[9999]" : "z-0"}`}
            delay={60}
          >
            <div className="space-y-3">
              <label className={fieldShellClassName}>
                <span className="mr-1 shrink-0">제품명 ·</span>
                <input required maxLength={200} value={draft.name} className={fieldControlClassName} onChange={(event) => updateDraft({ name: event.target.value })} />
              </label>
              <label className={fieldShellClassName}>
                <span className="mr-1 shrink-0">브랜드 ·</span>
                <input maxLength={100} value={draft.brandName} className={fieldControlClassName} onChange={(event) => updateDraft({ brandName: event.target.value })} />
              </label>
              <label className={fieldShellClassName}>
                <span className="mr-1 shrink-0">카테고리 ·</span>
                <select value={draft.category} className={fieldControlClassName} onChange={(event) => updateDraft({ category: event.target.value as ItemCategory })}>
                  {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className={`${fieldShellClassName} flex-col items-stretch justify-center gap-0.5`}>
                <span className="flex min-w-0 items-center">
                  <span className="mr-1 shrink-0">구매일 ·</span>
                  <input type="date" max={new Date().toISOString().slice(0, 10)} value={draft.purchaseDate} className={fieldControlClassName} onChange={(event) => updateDraft({ purchaseDate: event.target.value })} />
                </span>
                <span className="text-[10px] text-[#96929c]">등록일 · {formatDate(item?.createdAt)}</span>
              </label>
              <div className={fieldShellClassName}>
                <button type="button" onClick={() => imageInputRef.current?.click()} className="min-w-0 flex-1 text-left">
                  {nextImage ? nextImage.name : removeCurrentImage ? "제품 이미지 삭제 예정" : "제품 이미지 변경"}
                </button>
                {item?.imageId || nextImage ? (
                  <button type="button" onClick={() => { setNextImage(null); setRemoveCurrentImage(Boolean(item?.imageId)); }} className="ml-3 text-[11px] font-semibold text-[#9a554d]">삭제</button>
                ) : null}
                <input ref={imageInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={selectImage} />
              </div>
            </div>

            <div className="relative z-[100] mt-6 grid grid-cols-[160px_120px] gap-1.5">
              <FilterMenu label="대표 색상" buttonLabel={`대표 색상 · ${colorOptions.find((option) => option.value === draft.primaryColor)?.label ?? "기타"}`} value={draft.primaryColor} options={colorOptions} open={openFilter === "color"} onToggle={() => setOpenFilter((current) => current === "color" ? null : "color")} onChange={(value) => { updateDraft({ primaryColor: value as ColorGroup }); setOpenFilter(null); }} />
              <FilterMenu label="소재" buttonLabel={`소재 · ${materialOptions.find((option) => option.value === draft.material)?.label ?? "확인 불가"}`} value={draft.material} options={materialOptions} align="right" open={openFilter === "material"} onToggle={() => setOpenFilter((current) => current === "material" ? null : "material")} onChange={(value) => { updateDraft({ material: value as MaterialGroup }); setOpenFilter(null); }} />
            </div>

            <div className="relative z-0 mt-2.5 grid grid-cols-[100px_100px_1fr] gap-1.5">
              <label className="flex h-8 items-center rounded-full border border-[#ded9d1] bg-[#f4f1ec] px-3 text-[10px] text-[#4b4741] focus-within:border-[#8b7355]">
                <input inputMode="numeric" min={0} type="number" value={draft.purchasePrice} placeholder="구매가격" aria-label="구매가격" className="w-full bg-transparent text-center outline-none placeholder:text-[#4b4741]" onChange={(event) => updateDraft({ purchasePrice: event.target.value })} />
              </label>
              <label className="flex h-8 items-center rounded-full border border-[#ded9d1] bg-[#f4f1ec] px-3 text-[10px] text-[#4b4741] focus-within:border-[#8b7355]">
                <input maxLength={200} value={draft.purchasePlace} placeholder="구매처" aria-label="구매처" className="w-full bg-transparent text-center outline-none placeholder:text-[#4b4741]" onChange={(event) => updateDraft({ purchasePlace: event.target.value })} />
              </label>
              <button type="button" disabled={isDeleting} onClick={() => setIsDeleteDialogOpen(true)} className="h-8 rounded-full border border-[#e6c7c0] bg-[#fff5f3] text-[10px] text-[#4b4741] disabled:opacity-45">{isDeleting ? "삭제 중" : "아이템 삭제"}</button>
            </div>
          </LuxuryReveal>
        )}

        {errorMessage ? (
          <p role="alert" className="mt-5 rounded-[14px] bg-[#f8eeee] px-4 py-3 text-[11px] leading-[17px] text-[#9a4545]">{errorMessage}</p>
        ) : null}

        <LuxuryReveal className="mt-auto pt-8" delay={140}>
          <button type="submit" disabled={!hasLoaded || isSaving || !draft.name.trim()} className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#0e0e12] text-[14px] font-bold text-white transition-colors hover:bg-[#28282d] disabled:cursor-not-allowed disabled:opacity-45">
            {isSaving ? "변경사항 저장 중" : "변경사항 저장"}
          </button>
        </LuxuryReveal>
      </form>
      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="아이템을 삭제하시겠습니까?"
        description="삭제한 아이템은 복구할 수 없습니다."
        confirmLabel="삭제하기"
        isPending={isDeleting}
        pendingLabel="삭제 중..."
        onConfirm={() => void deleteItem()}
        onCancel={() => {
          if (!isDeleting) setIsDeleteDialogOpen(false);
        }}
      />
    </MobileScreenLayout>
  );
}
