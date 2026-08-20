import type {
  ColorGroup,
  ItemCategory,
  MaterialGroup,
  MaterialSource,
} from "@/types/api";

export type ClosetItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  colorHex: string;
  imageUrl?: string;
  imageId?: string;
  brandName: string | null;
  material: string;
  purchaseDate: string | null;
  purchasePrice: number | null;
  purchasePlace?: string | null;
  memo: string | null;
  createdAt?: string;
  version?: number;
};

export type ItemCreateInput = Pick<
  ClosetItem,
  "name" | "category" | "color"
> & {
  colorHex?: string;
  imageUrl?: string;
  brandName?: string | null;
  material?: string;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  memo?: string | null;
};

export type ItemUpdateInput = {
  name: string;
  brandName: string | null;
  category: ItemCategory;
  primaryColor: ColorGroup | null;
  material: MaterialGroup | null;
  materialSource: MaterialSource | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  purchasePlace: string | null;
  memo: string | null;
};
