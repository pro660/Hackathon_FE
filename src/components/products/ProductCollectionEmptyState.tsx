import Link from "next/link";

type ProductCollectionEmptyStateProps = {
  title: string;
  description: string;
};

export function ProductCollectionEmptyState({
  title,
  description,
}: ProductCollectionEmptyStateProps) {
  return (
    <section className="flex min-h-[570px] flex-1 flex-col items-center pt-[150px] text-center">
      <h2 className="text-[24px] leading-[38px] font-semibold tracking-[-0.03em] text-[#14120f]">
        {title}
      </h2>
      <p className="mt-5 max-w-[294px] text-[14px] leading-7 text-[#75706b]">
        {description}
      </p>
      <Link
        href="/products"
        className="mt-8 flex h-[52px] w-[294px] items-center justify-center rounded-[16px] bg-[#14120f] text-[14px] font-semibold text-white transition-colors hover:bg-[#292622] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14120f]"
      >
        제품 둘러보기
      </Link>
    </section>
  );
}
