import { PurchaseInformationScreen } from "@/components/passport/PurchaseInformationScreen";

type PageProps = { params: Promise<{ itemId: string }> };

export default async function PurchaseInformationPage({ params }: PageProps) {
  const { itemId } = await params;
  return <PurchaseInformationScreen itemId={itemId} />;
}
