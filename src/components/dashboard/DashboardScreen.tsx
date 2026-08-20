"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useHomeStore } from "@/store/useHomeStore";
import { useMenuDataStore } from "@/store/useMenuDataStore";
import { useProductRecommendationStore } from "@/store/useProductRecommendationStore";

type WeatherSummary = {
  locationLabel: string;
  temperature: number;
  condition: string;
};

const openMeteoWeatherCodeMap: Record<number, { label: string; icon: string }> =
  {
    0: { label: "맑음", icon: "☀" },
    1: { label: "대체로 맑음", icon: "🌤" },
    2: { label: "구름 조금", icon: "⛅" },
    3: { label: "흐림", icon: "☁" },
    45: { label: "안개", icon: "🌫" },
    48: { label: "서리 낀 안개", icon: "🌫" },
    51: { label: "이슬비", icon: "🌦" },
    53: { label: "이슬비", icon: "🌦" },
    55: { label: "강한 이슬비", icon: "🌧" },
    61: { label: "비", icon: "🌧" },
    63: { label: "비", icon: "🌧" },
    65: { label: "강한 비", icon: "🌧" },
    66: { label: "어는 비", icon: "🌧" },
    67: { label: "강한 어는 비", icon: "🌧" },
    71: { label: "눈", icon: "🌨" },
    73: { label: "눈", icon: "🌨" },
    75: { label: "강한 눈", icon: "🌨" },
    77: { label: "진눈깨비", icon: "🌨" },
    80: { label: "소나기", icon: "🌦" },
    81: { label: "소나기", icon: "🌦" },
    82: { label: "강한 소나기", icon: "🌧" },
    85: { label: "눈 소나기", icon: "🌨" },
    86: { label: "강한 눈 소나기", icon: "🌨" },
    95: { label: "뇌우", icon: "⛈" },
    96: { label: "뇌우", icon: "⛈" },
    99: { label: "강한 뇌우", icon: "⛈" },
  };

function getGeolocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "브라우저 설정에서 위치 권한을 허용해 주세요.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "현재 위치를 찾지 못했습니다.";
  }

  if (error.code === error.TIMEOUT) {
    return "위치 확인 시간이 초과되었습니다.";
  }

  return "위치 정보를 불러오지 못했습니다.";
}

function pickLocationLabel(parts: Array<string | undefined>, fallback: string) {
  const candidates = parts
    .flatMap((part) => (part ? part.split(/[\s·,/()-]+/) : []))
    .map((part) => part.trim())
    .filter(Boolean);

  const administrativeSuffixes = ["동", "읍", "면", "리", "구", "군", "시"];

  for (const suffix of administrativeSuffixes) {
    const matchedLocation = candidates.find((part) => part.endsWith(suffix));
    if (matchedLocation) {
      return matchedLocation;
    }
  }

  return candidates[0] ?? fallback;
}

function pickBestLocationLabel(
  address: Partial<{
    neighbourhood: string;
    suburb: string;
    quarter: string;
    city_district: string;
    borough: string;
    town: string;
    village: string;
    city: string;
    county: string;
    state: string;
  }>,
  fallback: string,
) {
  return pickLocationLabel(
    [
      address.neighbourhood,
      address.suburb,
      address.quarter,
      address.city_district,
      address.borough,
      address.town,
      address.village,
      address.city,
      address.county,
      address.state,
    ],
    fallback,
  );
}

async function fetchWeatherSummary(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<WeatherSummary> {
  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`,
    { signal },
  );

  if (!weatherResponse.ok) {
    throw new Error("날씨 정보를 불러오지 못했습니다.");
  }

  const weatherData: {
    current?: { temperature_2m?: number; weather_code?: number };
  } = await weatherResponse.json();

  const weatherCode = weatherData.current?.weather_code ?? -1;
  const weatherInfo =
    openMeteoWeatherCodeMap[weatherCode] ?? openMeteoWeatherCodeMap[0];

  return {
    temperature: Math.round(weatherData.current?.temperature_2m ?? 0),
    condition: weatherInfo.label,
    locationLabel: "현재 위치",
  };
}

async function fetchLocationLabel(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
) {
  const geocodeResponse = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=ko`,
    { signal },
  );

  if (!geocodeResponse.ok) {
    throw new Error("위치 정보를 불러오지 못했습니다.");
  }

  const geocodeData: {
    address?: Partial<{
      neighbourhood: string;
      suburb: string;
      quarter: string;
      city_district: string;
      borough: string;
      town: string;
      village: string;
      city: string;
      county: string;
      state: string;
    }>;
  } = await geocodeResponse.json();

  return pickBestLocationLabel(geocodeData.address ?? {}, "현재 위치");
}

function ProductRowCard({
  title,
  href,
  imageUrl,
}: {
  title: string;
  href: string;
  imageUrl?: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-[62px] items-center rounded-[15px] border border-[#dbdee3] bg-[#f6f6f8] px-3 transition-transform active:scale-[0.99]"
    >
      <div
        className="size-[46px] shrink-0 rounded-[11px] bg-[#e8e3d9] bg-cover bg-center"
        style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
      />
      <div className="ml-4 min-w-0 flex-1">
        <p className="truncate text-[14px] leading-[18px] font-bold text-[#0e0e12]">
          {title}
        </p>
      </div>
      <span
        aria-hidden="true"
        className="ml-3 text-[18px] leading-none text-[#6e707a]"
      >
        ›
      </span>
    </Link>
  );
}

export function DashboardScreen() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const profile = useMenuDataStore((state) => state.profile);
  const loadProfile = useMenuDataStore((state) => state.loadProfile);
  const homeData = useHomeStore((state) => state.data);
  const loadHome = useHomeStore((state) => state.loadHome);
  const products = useProductRecommendationStore((state) => state.products);
  const productStatus = useProductRecommendationStore((state) => state.status);
  const loadProducts = useProductRecommendationStore(
    (state) => state.loadProducts,
  );
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const purchaseUtilityHref = products[0]
    ? `/recommendations/${products[0].id}/value-check`
    : "/recommendations/value-check";

  useEffect(() => {
    if (hasHydrated && !profile) {
      void loadProfile();
    }
    if (hasHydrated && !homeData) {
      void loadHome();
    }
  }, [hasHydrated, homeData, loadHome, loadProfile, profile]);

  useEffect(() => {
    if (!hasHydrated) return;
    return loadProducts("ALL");
  }, [hasHydrated, loadProducts]);

  useEffect(() => {
    const controller = new AbortController();

    const loadWeather = async () => {
      try {
        if (!navigator.geolocation) {
          throw new Error("현재 위치를 사용할 수 없습니다.");
        }

        const coordinates = await new Promise<{
          latitude: number;
          longitude: number;
        }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) =>
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          (error) => {
            reject(new Error(getGeolocationErrorMessage(error)));
          },
          {
            enableHighAccuracy: false,
            timeout: 10_000,
            maximumAge: 30 * 60 * 1_000,
          },
        );
        });

        const summary = await fetchWeatherSummary(
          coordinates.latitude,
          coordinates.longitude,
          controller.signal,
        );
        let locationLabel = "현재 위치";

        try {
          locationLabel = await fetchLocationLabel(
            coordinates.latitude,
            coordinates.longitude,
            controller.signal,
          );
        } catch {
          locationLabel = "현재 위치";
        }

        if (!controller.signal.aborted) {
          setWeather({ ...summary, locationLabel });
          setWeatherError(null);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setWeather(null);
          setWeatherError(
            error instanceof Error
              ? error.message
              : "날씨 정보를 불러오지 못했습니다.",
          );
        }
      }
    };

    void loadWeather();

    return () => controller.abort();
  }, []);

  const nickname = profile?.nickname?.trim() || "사용자";
  const nicknameWithHonorific = nickname.endsWith("님")
    ? nickname
    : `${nickname}님`;

  return (
    <MobileScreenLayout
      figmaNodeId="147:240"
      contentClassName="bg-white px-6 pt-[50px] pb-20"
      bottomNavigation={<BottomNavigation activeItem="home" />}
    >
      <section className="text-[#15151a]">
        <LuxuryReveal>
          <div>
            <p className="text-[12px] leading-[17px] font-bold text-[#b89666]">
              좋은 아침이에요, {nicknameWithHonorific}
            </p>
            <h1 className="mt-[11px] text-[27px] leading-8 font-bold tracking-[-0.04em] text-[#0e0e12]">
              오늘 뭐 입을래?
            </h1>
            <p className="mt-3 text-[13px] leading-4 text-[#6e707a]">
              {weather ? (
                <span className="whitespace-nowrap">
                  {weather.temperature}° · {weather.condition} ·{" "}
                  {weather.locationLabel}
                </span>
              ) : (
                (weatherError ?? "위치 허용 시 현재 날씨를 보여드려요.")
              )}
            </p>
          </div>
        </LuxuryReveal>

        <LuxuryReveal className="mt-5" delay={80}>
          <article className="h-[165px] overflow-hidden rounded-[18px] bg-[#0e0e12] px-5 pt-5">
            <p className="text-[12px] leading-[17px] font-bold text-[#b89666]">
              오늘의 스타일 플랜
            </p>
            <h2 className="mt-4 line-clamp-2 h-12 max-w-[280px] text-[20px] leading-6 font-bold tracking-[-0.03em] text-white">
              {homeData?.latestStylePlan?.title ??
                "아직 저장한 스타일 플랜이 없어요"}
            </h2>
            <Link
              href="/personalize"
              className="mt-[14px] flex h-[30px] w-[168px] items-center justify-center rounded-[15px] bg-[#b99666] text-[11px] font-bold text-[#0e0e12] transition-colors hover:bg-[#c5a778]"
            >
              스마트 착용 추천&nbsp; ›
            </Link>
          </article>
        </LuxuryReveal>

        <LuxuryReveal className="mt-4 grid grid-cols-2 gap-4" delay={160}>
          <Link
            href="/care/calendar"
            className="flex h-[54px] items-center justify-center rounded-[14px] border border-[#dbdee3] bg-[#f7f7f8] px-3 text-center text-[11px] font-bold text-[#0e0e12] transition-colors hover:bg-[#f1f1f3]"
          >
            내 제품 관리 알림
          </Link>
          <Link
            href={purchaseUtilityHref}
            className="flex h-[54px] items-center justify-center rounded-[14px] border border-[#dbdee3] bg-[#f7f7f8] px-3 text-center text-[11px] font-bold text-[#0e0e12] transition-colors hover:bg-[#f1f1f3]"
          >
            구매 전 활용 체크
          </Link>
        </LuxuryReveal>

        <LuxuryReveal className="mt-5" delay={300}>
          <div className="mb-4">
            <h2 className="text-[16px] leading-5 font-bold text-[#0e0e12]">
              MCM 제품
            </h2>
            <p className="mt-1.5 text-[12px] leading-4 text-[#6e707a]">
              취향과 잘 맞는 제품을 더 둘러보세요
            </p>
          </div>
          <ul className="space-y-2">
            {products.slice(0, 3).map((product) => (
              <li key={product.id}>
                <ProductRowCard
                  href={`/recommendations/${product.id}`}
                  title={product.displayName}
                  imageUrl={product.imageUrl}
                />
              </li>
            ))}
          </ul>
          {productStatus === "loading" && products.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-[#777780]">
              제품을 불러오는 중입니다.
            </p>
          ) : null}
          {productStatus === "error" ? (
            <p className="py-6 text-center text-[12px] text-[#9a4545]">
              제품 목록을 불러오지 못했습니다.
            </p>
          ) : null}
        </LuxuryReveal>
      </section>
    </MobileScreenLayout>
  );
}
