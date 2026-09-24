"use client";

import { useCallback, useState } from "react";
import type { CategoryDTO, ListItem } from "@/lib/catalog";
import { BottomBar, QuickBar, SideRail, type Nav, type ViewName } from "@/components/chrome";
import Home from "@/components/screens/Home";
import CategoryScreen from "@/components/screens/CategoryScreen";
import MyList from "@/components/screens/MyList";
import PreviewScreen, { type GeneratedFile } from "@/components/screens/PreviewScreen";
import ReadyScreen from "@/components/screens/ReadyScreen";
import SavedScreen from "@/components/screens/SavedScreen";
import SettingsScreen from "@/components/screens/SettingsScreen";
import { StoreProvider, useStore } from "@/lib/store";

export default function App({
  initialCategories,
  initialItems,
  initialNotes,
  currentUserId,
  accountLabel,
}: {
  initialCategories: CategoryDTO[];
  initialItems: ListItem[];
  initialNotes: string;
  currentUserId: number;
  accountLabel: string;
}) {
  return (
    <StoreProvider
      initialCategories={initialCategories}
      initialItems={initialItems}
      initialNotes={initialNotes}
      currentUserId={currentUserId}
    >
      <Shell accountLabel={accountLabel} />
    </StoreProvider>
  );
}

function Shell({ accountLabel }: { accountLabel: string }) {
  const { selectedItems, newList, syncState, hydrated } = useStore();
  const [view, setView] = useState<ViewName>("home");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [generated, setGenerated] = useState<GeneratedFile | null>(null);

  const nav = useCallback<Nav>((next, id) => {
    if (typeof id === "number") setCategoryId(id);
    setView(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const count = selectedItems.length;

  let screen: React.ReactNode;
  switch (view) {
    case "category":
      screen = categoryId
        ? <CategoryScreen categoryId={categoryId} nav={nav} />
        : <Home nav={nav} loading={!hydrated} />;
      break;
    case "list":
      screen = <MyList nav={nav} />;
      break;
    case "preview":
      screen = <PreviewScreen nav={nav} onGenerated={(file) => { setGenerated(file); nav("ready"); }} />;
      break;
    case "ready":
      screen = generated
        ? <ReadyScreen nav={nav} file={generated} />
        : <PreviewScreen nav={nav} onGenerated={(file) => { setGenerated(file); nav("ready"); }} />;
      break;
    case "saved":
      screen = <SavedScreen nav={nav} />;
      break;
    case "settings":
      screen = <SettingsScreen accountLabel={accountLabel} />;
      break;
    default:
      screen = <Home nav={nav} loading={!hydrated} />;
  }

  const showQuickBar = count > 0 && (view === "home" || view === "category");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
      <SideRail
        view={view}
        nav={nav}
        count={count}
        syncState={syncState}
        onNewList={newList}
        accountLabel={accountLabel}
      />

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[880px] px-5 pt-6 sm:px-7 lg:px-12 lg:pt-10">
          <div key={view + (categoryId ?? "")} className="anim-rise">
            {screen}
          </div>
        </div>
      </main>

      {showQuickBar && <QuickBar count={count} onOpen={() => nav("list")} />}
      <BottomBar view={view} nav={nav} count={count} />
    </div>
  );
}
