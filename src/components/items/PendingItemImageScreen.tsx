"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { ScreenHeader } from "@/components/common/section/ScreenHeader";
import { uploadItemImage } from "@/services/itemRegistrationWorkflow";
import { useItemRegistrationStore } from "@/store/useItemRegistrationStore";
import { useMenuDataStore } from "@/store/useMenuDataStore";

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("사진을 읽지 못했습니다.")),
    );
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

export function PendingItemImageScreen() {
  const router = useRouter();
  const pendingImageUpload = useItemRegistrationStore(
    (state) => state.pendingImageUpload,
  );
  const loadPendingImageUpload = useItemRegistrationStore(
    (state) => state.loadPendingImageUpload,
  );
  const setPendingImageFile = useItemRegistrationStore(
    (state) => state.setPendingImageFile,
  );
  const clearPendingImageUpload = useItemRegistrationStore(
    (state) => state.clearPendingImageUpload,
  );
  const updateItemImage = useMenuDataStore((state) => state.updateItemImage);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPendingImageUpload();
  }, [loadPendingImageUpload]);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setPendingImageFile(file, await readImage(file));
      setError(null);
    } catch {
      setError("사진을 읽지 못했습니다. 다른 사진을 선택해 주세요.");
    }
  };

  const handleUpload = async () => {
    if (!pendingImageUpload?.file) {
      setError("업로드할 사진을 선택해 주세요.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const uploadedImage = await uploadItemImage(
        pendingImageUpload.file,
        pendingImageUpload.myItemId,
      );
      updateItemImage(pendingImageUpload.myItemId, uploadedImage.url);
      clearPendingImageUpload();
      router.push("/items?imageUploaded=true");
    } catch {
      setError("사진 업로드에 실패했어요. 제품 정보는 그대로 저장되어 있습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!pendingImageUpload) {
    return (
      <MobileScreenLayout contentClassName="bg-white px-6 pt-4 pb-8">
        <BackButton />
        <div className="mt-1">
          <ScreenHeader
            eyebrow="IMAGE RETRY"
            title="보류된 사진이 없어요"
            description="아이템 정보는 정상적으로 유지되고 있어요"
          />
        </div>
        <Link
          href="/items"
          className="mt-10 flex h-[52px] w-full items-center justify-center rounded-[16px] bg-[#15151a] text-[15px] font-bold text-white"
        >
          아이템 목록으로
        </Link>
      </MobileScreenLayout>
    );
  }

  return (
    <MobileScreenLayout contentClassName="bg-white px-6 pt-4 pb-8">
      <LuxuryReveal>
        <BackButton />
      </LuxuryReveal>
      <LuxuryReveal className="mt-1" delay={40}>
        <ScreenHeader
          eyebrow="IMAGE RETRY"
          title="사진만 다시 업로드"
          description={`${pendingImageUpload.itemName}의 입력 정보는 이미 저장되어 있어요`}
        />
      </LuxuryReveal>

      <LuxuryReveal className="mt-9" delay={90}>
        <label
          className="flex h-[300px] cursor-pointer items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-[#cfcac4] bg-[#f5f2ed] bg-cover bg-center"
          style={
            pendingImageUpload.previewUrl
              ? { backgroundImage: `url("${pendingImageUpload.previewUrl}")` }
              : undefined
          }
        >
          <input
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            onChange={(event) => void handleImageChange(event)}
          />
          <span className="rounded-full bg-black/55 px-4 py-2 text-[11px] font-bold text-white backdrop-blur-sm">
            {pendingImageUpload.file ? "다른 사진 선택" : "사진 선택"}
          </span>
        </label>
        {pendingImageUpload.fileName ? (
          <p className="mt-3 truncate text-[10px] text-[#929299]">
            선택한 파일 · {pendingImageUpload.fileName}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-4 rounded-[14px] bg-[#f8eeee] px-4 py-3 text-[11px] text-[#9a4545]">
            {error}
          </p>
        ) : null}
      </LuxuryReveal>

      <LuxuryReveal className="mt-8" delay={150}>
        <button
          type="button"
          disabled={isUploading || !pendingImageUpload.file}
          className="flex h-[52px] w-full items-center justify-center rounded-[16px] bg-[#15151a] text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
          onClick={() => void handleUpload()}
        >
          {isUploading ? "사진 업로드 중..." : "이 사진 업로드하기"}
        </button>
        <p className="mt-3 text-center text-[10px] text-[#9999a1]">
          UserItem을 다시 만들지 않고 기존 아이템에 사진만 추가해요
        </p>
      </LuxuryReveal>
    </MobileScreenLayout>
  );
}
