"use client";

import { create } from "zustand";

import { backendApi } from "@/services/api";
import { useAuthStore, type UserInfo } from "@/store/useAuthStore";
import type {
  ClosetItem,
  ItemUpdateInput,
} from "@/types/menu";
import type {
  ItemCategory,
  MyItemDetail,
  MyItemSummary,
} from "@/types/api";

const itemCategoryLabels: Record<ItemCategory, string> = {
  BAG: "가방",
  LEATHER_GOODS: "가죽 소품",
  FASHION_ACCESSORY: "패션 액세서리",
  CLOTHING: "의류",
  SHOES: "신발",
};

function mapApiItemToClosetItem(item: MyItemSummary): ClosetItem {
  return {
    id: item.myItemId,
    name: item.name,
    category: itemCategoryLabels[item.category],
    color: item.primaryColor ?? "미입력",
    colorHex: "#d7cec2",
    imageUrl: item.primaryImageUrl ?? undefined,
    imageId: undefined,
    brandName: item.brandName,
    material: item.material ?? "미입력",
    purchaseDate: null,
    purchasePrice: null,
    purchasePlace: null,
    memo: null,
    createdAt: item.createdAt,
  };
}

function mapApiItemDetailToClosetItem(item: MyItemDetail): ClosetItem {
  return {
    ...mapApiItemToClosetItem({
      myItemId: item.myItemId,
      name: item.name,
      brandName: item.brandName,
      category: item.category,
      primaryColor: item.primaryColor,
      material: item.material,
      primaryImageUrl: item.images[0]?.url ?? null,
      createdAt: item.createdAt,
    }),
    purchaseDate: item.purchaseDate,
    purchasePrice: item.purchasePrice,
    purchasePlace: item.purchasePlace,
    imageId: item.images[0]?.imageId,
    memo: item.memo,
    version: item.version,
  };
}

function replaceItem(items: ClosetItem[], nextItem: ClosetItem) {
  const hasItem = items.some((item) => item.id === nextItem.id);

  if (!hasItem) {
    return [nextItem, ...items];
  }

  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

type MenuDataState = {
  items: ClosetItem[];
  profile: UserInfo | null;
  isLoading: boolean;
  error: string | null;
  loadItems: () => Promise<void>;
  loadItem: (itemId: string) => Promise<ClosetItem | null>;
  loadProfile: () => Promise<void>;
  updateItem: (
    itemId: string,
    input: ItemUpdateInput,
  ) => Promise<ClosetItem>;
  addCreatedItem: (item: ClosetItem) => void;
  updateItemImage: (itemId: string, imageUrl: string) => void;
};

export const useMenuDataStore = create<MenuDataState>((set, get) => ({
  items: [],
  profile: null,
  isLoading: false,
  error: null,

  loadItems: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await backendApi.closet.getItems();
      set({ items: response.data.data.items.map(mapApiItemToClosetItem) });
    } catch {
      set({ error: "아이템을 불러오지 못했습니다." });
    } finally {
      set({ isLoading: false });
    }
  },

  loadItem: async (itemId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await backendApi.closet.getItem(itemId);
      const item = mapApiItemDetailToClosetItem(response.data.data);
      set((state) => ({ items: replaceItem(state.items, item) }));
      return item;
    } catch {
      set({ error: "아이템 정보를 불러오지 못했습니다." });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  loadProfile: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await backendApi.profile.getMe();
      const user = response.data.data;
      useAuthStore.getState().setUser(user);
      set({ profile: user });
    } catch {
      set({ error: "사용자 정보를 불러오지 못했습니다." });
    } finally {
      set({ isLoading: false });
    }
  },

  updateItem: async (itemId, input) => {
    set({ isLoading: true, error: null });

    try {
      const currentItem = get().items.find((item) => item.id === itemId);

      let version = currentItem?.version;

      if (version === undefined) {
        const detailResponse = await backendApi.closet.getItem(itemId);
        version = detailResponse.data.data.version;
      }

      const response = await backendApi.closet.updateItem(itemId, {
        ...input,
        version,
      });
      const updatedItem = mapApiItemDetailToClosetItem(response.data.data);
      set((state) => ({ items: replaceItem(state.items, updatedItem) }));
      return updatedItem;
    } catch (error) {
      set({ error: "아이템 정보를 수정하지 못했습니다." });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addCreatedItem: (item) =>
    set((state) => ({
      items: [item, ...state.items.filter((existing) => existing.id !== item.id)],
    })),

  updateItemImage: (itemId, imageUrl) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, imageUrl } : item,
      ),
    })),
}));
