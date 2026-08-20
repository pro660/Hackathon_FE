import { PlaceDetailScreen } from "@/components/place/PlaceDetailScreen";

type PlaceDetailPageProps = {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<{
    stylePlanId?: string;
    latitude?: string;
    longitude?: string;
  }>;
};

export default async function PlaceDetailPage({
  params,
  searchParams,
}: PlaceDetailPageProps) {
  const [{ placeId }, query] = await Promise.all([params, searchParams]);

  return (
    <PlaceDetailScreen
      placeId={placeId}
      stylePlanId={query.stylePlanId}
      latitude={query.latitude}
      longitude={query.longitude}
    />
  );
}
