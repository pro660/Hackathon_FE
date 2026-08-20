"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { analyzeItemPhoto } from "@/services/itemRegistrationWorkflow";
import { useItemRegistrationStore } from "@/store/useItemRegistrationStore";

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("사진을 읽지 못했습니다."));
      }
    });
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

export function ItemRegisterScreen() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transitionLockRef = useRef(false);
  const photoFile = useItemRegistrationStore((state) => state.photoFile);
  const photoPreviewUrl = useItemRegistrationStore(
    (state) => state.photoPreviewUrl,
  );
  const setPhoto = useItemRegistrationStore((state) => state.setPhoto);
  const clearPhoto = useItemRegistrationStore((state) => state.clearPhoto);
  const startAnalysis = useItemRegistrationStore((state) => state.startAnalysis);
  const applyAnalysis = useItemRegistrationStore((state) => state.applyAnalysis);
  const failAnalysis = useItemRegistrationStore((state) => state.failAnalysis);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError("JPEG·PNG 형식의 10MB 이하 사진을 선택해 주세요.");
      event.target.value = "";
      return;
    }

    try {
      setPhoto(file, await readImage(file));
      setError(null);
    } catch {
      setError("사진을 읽지 못했습니다. 다른 사진을 선택해 주세요.");
    }
  };

  const moveToConfirmation = () => {
    router.push("/items/new/confirm");
  };

  const handlePrimaryAction = async () => {
    if (!photoFile) {
      moveToConfirmation();
      return;
    }

    if (transitionLockRef.current) {
      return;
    }

    transitionLockRef.current = true;
    setIsRecognizing(true);
    setError(null);
    startAnalysis();

    try {
      const outcome = await analyzeItemPhoto(photoFile);

      if (outcome.status === "SUCCEEDED") {
        applyAnalysis(outcome.values, outcome.jobId, outcome.image);
      } else {
        failAnalysis(outcome.message, outcome.image);
      }

      moveToConfirmation();
    } catch (recognitionError) {
      const message =
        recognitionError instanceof Error
          ? recognitionError.message
          : "제품 정보를 인식하지 못했어요. 직접 입력해 주세요.";
      failAnalysis(message);
      moveToConfirmation();
    }
  };

  return (
    <MobileScreenLayout
      figmaNodeId="119:1031"
      contentClassName="flex bg-white px-6 pt-6 pb-8 text-[#0e0e12]"
      bottomNavigation={<BottomNavigation activeItem="register" />}
    >
      <div className="flex min-h-full w-full flex-col">
        <LuxuryReveal>
          <h1 className="text-[17px] leading-6 font-bold">제품 사진 등록</h1>
          <p className="mt-5 text-[13px] leading-5 text-[#6e707a]">
            AI가 확인 가능한 정보를 제안해요
          </p>
        </LuxuryReveal>

        <LuxuryReveal className="mt-8" delay={60}>
          <label
            className="relative flex h-[430px] cursor-pointer items-center justify-center overflow-hidden rounded-[20px] border border-[#dbdee3] bg-[#f6f6f8] bg-cover bg-center"
            style={
              photoPreviewUrl
                ? { backgroundImage: `url("${photoPreviewUrl}")` }
                : undefined
            }
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              className="sr-only"
              onChange={(event) => void handleImageChange(event)}
            />
            {photoPreviewUrl ? (
              <>
                <span className="rounded-full bg-black/55 px-4 py-2 text-[11px] font-bold text-white backdrop-blur-sm">
                  다른 사진 선택
                </span>
                <button
                  type="button"
                  className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-2 text-[10px] font-bold text-[#55555d] shadow-sm"
                  onClick={(event) => {
                    event.preventDefault();
                    clearPhoto();
                  }}
                >
                  삭제
                </button>
              </>
            ) : (
              <span className="flex flex-col items-center text-center">
                <span className="text-[48px] leading-none font-light text-[#b89666]">
                  ＋
                </span>
                <span className="mt-5 text-[13px] text-[#6e707a]">
                  JPEG·PNG 최대 10MB
                </span>
              </span>
            )}
          </label>
        </LuxuryReveal>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-[14px] bg-[#f8eeee] px-4 py-3 text-[11px] text-[#9a4545]"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-auto pt-8">
          <button
            type="button"
            disabled={isRecognizing}
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#0e0e12] text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
            onClick={() => void handlePrimaryAction()}
          >
            {isRecognizing
              ? "제품 정보 인식 중..."
              : photoFile
                ? "제품 정보 확인"
                : "직접 입력하기"}
          </button>
        </div>
      </div>
    </MobileScreenLayout>
  );
}
