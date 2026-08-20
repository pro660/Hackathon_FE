import { StorageGuideScreen } from "@/components/care/StorageGuideScreen";

type PageProps = { searchParams: Promise<{ itemId?: string }> };

export default async function StorageGuidePage({ searchParams }: PageProps) {
  const { itemId } = await searchParams;
  return <StorageGuideScreen itemId={itemId} />;
}
