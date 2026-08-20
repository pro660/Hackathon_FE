export function PassportLoadingState() {
  return (
    <div className="mt-8 space-y-4" role="status" aria-label="제품 정보를 불러오는 중">
      <div className="h-[156px] animate-pulse rounded-[18px] bg-[#ece9e4]" />
      <div className="h-[74px] animate-pulse rounded-[15px] bg-[#f1f1f3]" />
      <div className="h-[74px] animate-pulse rounded-[15px] bg-[#f1f1f3]" />
    </div>
  );
}
