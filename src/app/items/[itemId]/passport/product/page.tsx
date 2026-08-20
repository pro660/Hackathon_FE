import { ProductInformationScreen } from "@/components/passport/ProductInformationScreen";

type PageProps = { params: Promise<{ itemId: string }> };

export default async function ProductInformationPage({ params }: PageProps) {
  const { itemId } = await params;
  return <ProductInformationScreen itemId={itemId} />;
}
