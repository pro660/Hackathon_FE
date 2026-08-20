import { PurchaseUtilityReportScreen } from "@/components/products/PurchaseUtilityReportScreen";

type PurchaseUtilityReportPageProps = {
  searchParams: Promise<{ analysisId?: string }>;
};

export default async function PurchaseUtilityReportPage({
  searchParams,
}: PurchaseUtilityReportPageProps) {
  const { analysisId } = await searchParams;
  return <PurchaseUtilityReportScreen analysisId={analysisId} />;
}
