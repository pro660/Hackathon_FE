import { OfficialProductDetailScreen } from "@/components/products/OfficialProductDetailScreen";

type OfficialProductDetailPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function OfficialProductDetailPage({
  params,
}: OfficialProductDetailPageProps) {
  const { productId } = await params;
  return <OfficialProductDetailScreen productId={productId} />;
}
