import Link from "next/link";

type ItemListCardProps = {
  href: string;
  imageAlt: string;
  imageUrl?: string;
  fallbackColor?: string;
  title: string;
  subtitle: string;
};

export function ItemListCard({
  href,
  imageAlt,
  imageUrl,
  fallbackColor = "#e8e3db",
  title,
  subtitle,
}: ItemListCardProps) {
  const imageStyle = imageUrl
    ? { backgroundImage: `url("${imageUrl}")` }
    : {
        backgroundColor: fallbackColor,
        backgroundImage:
          "linear-gradient(145deg, rgba(255,255,255,0.48), transparent 55%, rgba(21,21,26,0.08))",
      };

  return (
    <Link
      href={href}
      className="flex h-[74px] items-center rounded-[15px] border border-[#dbdee3] bg-[#f6f6f8] px-3 transition-colors hover:bg-[#f1f1f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15151a]"
    >
      <span
        role="img"
        aria-label={imageAlt}
        className="size-[46px] shrink-0 rounded-[11px] bg-cover bg-center shadow-[inset_0_0_0_1px_rgba(21,21,26,0.04)]"
        style={imageStyle}
      />
      <span className="ml-4 min-w-0 flex-1">
        <span className="block truncate text-[14px] leading-[17px] font-bold text-[#0e0e12]">
          {title}
        </span>
        <span className="mt-1 block truncate text-[11px] leading-[14px] text-[#6e707a]">
          {subtitle}
        </span>
      </span>
      <span aria-hidden="true" className="ml-3 text-[21px] text-[#8d8d96]">
        ›
      </span>
    </Link>
  );
}
