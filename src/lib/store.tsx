"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CategoryDTO, ListItem, ProductDTO } from "@/lib/catalog";
import { UNIT_STEP } from "@/lib/catalog-data";

export type SelectionMap = Record<number, { quantity: number; unit: string }>;

export type SelectedItem = {
  productId: number;
  categoryId: number;
  name: string;
  quantity: number;
  unit: string;
  category: CategoryDTO;
};

export type SelectedGroup = {
  category: CategoryDTO;
  items: SelectedItem[];
};

type StoreValue = {
  currentUserId: number;
  categories: CategoryDTO[];
  selection: SelectionMap;
  notes: string;
  syncState: "idle" | "saving" | "saved" | "error";
  hydrated: boolean;
  selectedItems: SelectedItem[];
  selectedGroups: SelectedGroup[];
  countFor: (categoryId: number) => number;
  toggle: (product: ProductDTO) => void;
  setQuantity: (productId: number, quantity: number, unit?: string) => void;
  removeItem: (productId: number) => void;
  setNotes: (notes: string) => void;
  newList: () => void;
  loadItems: (items: ListItem[], notes?: string) => void;
  addCategory: (name: string, icon: string, tint: string) => Promise<void>;
  updateCategory: (id: number, patch: Partial<CategoryDTO>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  addProduct: (categoryId: number, name: string, quantity: number, unit: string) => Promise<void>;
  updateProduct: (id: number, patch: Partial<ProductDTO>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({
  initialCategories,
  initialItems = [],
  initialNotes = "",
  currentUserId,
  children,
}: {
  initialCategories: CategoryDTO[];
  initialItems?: ListItem[];
  initialNotes?: string;
  currentUserId: number;
  children: React.ReactNode;
}) {
  const [categories, setCategories] = useState<CategoryDTO[]>(initialCategories);

  // v2 intentionally ignores old cached shared-catalogue IDs. The migrated
  // server list is the source of truth; old device caches cannot be remapped.
  const storageKey = `homelist.current.${currentUserId}.v2`;

  // Start with the items persisted on the server for this user
  const [selection, setSelection] = useState<SelectionMap>(() => {
    const map: SelectionMap = {};
    for (const item of initialItems) {
      map[item.productId] = { quantity: item.quantity, unit: item.unit };
    }
    return map;
  });
  const [notes, setNotes] = useState(initialNotes);
  const [syncState, setSyncState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hydrated, setHydrated] = useState(false);
  const skipNextSync = useRef(true);

  // Restore the user's current list from user-scoped local storage if present
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { selection?: SelectionMap; notes?: string };
        if (parsed.selection) setSelection(parsed.selection);
        if (typeof parsed.notes === "string") setNotes(parsed.notes);
      }
    } catch {
      /* ignore corrupted storage */
    }
    setHydrated(true);
  }, [storageKey]);

  // Mirror the selection to the server for this user, debounced
  useEffect(() => {
    if (!hydrated) return;
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    setSyncState("saving");
    const timer = window.setTimeout(async () => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ selection, notes }));
      } catch {
        /* storage full */
      }
      const items: ListItem[] = [];
      for (const category of categories) {
        for (const product of category.products) {
          const sel = selection[product.id];
          if (!sel) continue;
          items.push({
            productId: product.id,
            categoryId: category.id,
            name: product.name,
            quantity: sel.quantity,
            unit: sel.unit,
          });
        }
      }
      try {
        const response = await fetch("/api/list", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, notes }),
        });
        if (!response.ok) throw new Error(`List save failed (${response.status})`);
        setSyncState("saved");
      } catch (error) {
        console.error(error);
        setSyncState("error");
      }
    }, 500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, notes, hydrated, storageKey, currentUserId]);

  const setQuantity = useCallback(
    (productId: number, quantity: number, unit?: string) => {
      setSelection((prev) => {
        const current = prev[productId] ?? { quantity: 1, unit: "pc" };
        const nextUnit = unit ?? current.unit;
        const step = UNIT_STEP[nextUnit] ?? 1;
        const safe = Number.isFinite(quantity) ? Math.max(step, Math.round(quantity)) : step;
        return { ...prev, [productId]: { quantity: safe, unit: nextUnit } };
      });
    },
    [],
  );

  const toggle = useCallback((product: ProductDTO) => {
    setSelection((prev) => {
      const next = { ...prev };
      if (next[product.id]) {
        delete next[product.id];
      } else {
        next[product.id] = {
          quantity: product.quantity > 0 ? product.quantity : 1,
          unit: product.unit || "pc",
        };
      }
      return next;
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setSelection((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }, []);

  const newList = useCallback(() => {
    setSelection({});
    setNotes("");
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    void fetch("/api/list", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [], notes: "" }),
    });
  }, [storageKey]);

  const loadItems = useCallback((items: ListItem[], nextNotes = "") => {
    const map: SelectionMap = {};
    for (const item of items) {
      map[item.productId] = { quantity: item.quantity, unit: item.unit };
    }
    setSelection(map);
    setNotes(nextNotes);
  }, []);

  const selectedItems = useMemo<SelectedItem[]>(() => {
    const out: SelectedItem[] = [];
    for (const category of categories) {
      for (const product of category.products) {
        const sel = selection[product.id];
        if (!sel) continue;
        out.push({
          productId: product.id,
          categoryId: category.id,
          name: product.name,
          quantity: sel.quantity,
          unit: sel.unit,
          category,
        });
      }
    }
    return out;
  }, [categories, selection]);

  const selectedGroups = useMemo<SelectedGroup[]>(() => {
    const groups: SelectedGroup[] = [];
    for (const item of selectedItems) {
      let group = groups.find((g) => g.category.id === item.categoryId);
      if (!group) {
        group = { category: item.category, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    }
    return groups;
  }, [selectedItems]);

  const countFor = useCallback(
    (categoryId: number) =>
      categories
        .find((c) => c.id === categoryId)
        ?.products.filter((p) => selection[p.id]).length ?? 0,
    [categories, selection],
  );

  // ---- catalogue CRUD (optimistic, rolled back on failure) -----------------
  const addCategory = useCallback(
    async (name: string, icon: string, tint: string) => {
      const optimistic: CategoryDTO = {
        id: -Math.floor(Math.random() * 100000),
        name,
        icon,
        tint,
        sortOrder: categories.length,
        products: [],
      };
      const prev = categories;
      setCategories([...categories, optimistic]);
      try {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, icon, tint }),
        });
        if (!res.ok) throw new Error(`Adding category failed (${res.status})`);
        const data = await res.json();
        setCategories((cur) =>
          cur.map((c) => (c.id === optimistic.id ? (data.category as CategoryDTO) : c)),
        );
      } catch (error) {
        console.error(error);
        setCategories(prev);
      }
    },
    [categories],
  );

  const updateCategory = useCallback(
    async (id: number, patch: Partial<CategoryDTO>) => {
      const prev = categories;
      setCategories((cur) => cur.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      try {
        const response = await fetch(`/api/categories/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!response.ok) throw new Error(`Updating category failed (${response.status})`);
      } catch (error) {
        console.error(error);
        setCategories(prev);
      }
    },
    [categories],
  );

  const deleteCategory = useCallback(
    async (id: number) => {
      const prev = categories;
      const removedIds = new Set(categories.find((c) => c.id === id)?.products.map((p) => p.id) ?? []);
      setCategories((cur) => cur.filter((c) => c.id !== id));
      try {
        const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`Deleting category failed (${response.status})`);
        setSelection((cur) => {
          const next = { ...cur };
          for (const productId of removedIds) delete next[productId];
          return next;
        });
      } catch (error) {
        console.error(error);
        setCategories(prev);
      }
    },
    [categories],
  );

  const addProduct = useCallback(
    async (categoryId: number, name: string, quantity: number, unit: string) => {
      const optimistic: ProductDTO = {
        id: -Math.floor(Math.random() * 100000),
        categoryId,
        name,
        selected: false,
        quantity,
        unit,
        sortOrder: 999,
      };
      const prev = categories;
      setCategories((cur) =>
        cur.map((c) =>
          c.id === categoryId ? { ...c, products: [...c.products, optimistic] } : c,
        ),
      );
      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId, name, quantity, unit }),
        });
        if (!res.ok) throw new Error(`Adding product failed (${res.status})`);
        const data = await res.json();
        setCategories((cur) =>
          cur.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  products: c.products.map((p) =>
                    p.id === optimistic.id ? (data.product as ProductDTO) : p,
                  ),
                }
              : c,
          ),
        );
      } catch (error) {
        console.error(error);
        setCategories(prev);
      }
    },
    [categories],
  );

  const updateProduct = useCallback(
    async (id: number, patch: Partial<ProductDTO>) => {
      const prev = categories;
      setCategories((cur) =>
        cur.map((c) => ({
          ...c,
          products: c.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      );
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!response.ok) throw new Error(`Updating product failed (${response.status})`);
      } catch (error) {
        console.error(error);
        setCategories(prev);
      }
    },
    [categories],
  );

  const deleteProduct = useCallback(
    async (id: number) => {
      const prev = categories;
      setCategories((cur) =>
        cur.map((c) => ({ ...c, products: c.products.filter((p) => p.id !== id) })),
      );
      try {
        const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`Deleting product failed (${response.status})`);
        setSelection((cur) => {
          const next = { ...cur };
          delete next[id];
          return next;
        });
      } catch (error) {
        console.error(error);
        setCategories(prev);
      }
    },
    [categories],
  );

  const value: StoreValue = {
    currentUserId,
    categories,
    selection,
    notes,
    syncState,
    hydrated,
    selectedItems,
    selectedGroups,
    countFor,
    toggle,
    setQuantity,
    removeItem,
    setNotes,
    newList,
    loadItems,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

/** Human readable quantity, e.g. "2 kg". */
export function qtyLabel(quantity: number, unit: string) {
  return `${quantity} ${unit}`;
}
