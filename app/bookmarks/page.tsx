import type { Metadata } from "next";
import { SavedItemsPage } from "@/components/notion/SavedItemsPage";

export const metadata: Metadata = {
  title: "Saved items",
  description: "Your private, locally saved engineering articles and projects.",
  robots: { index: false, follow: false },
};

export default function BookmarksPage() {
  return <SavedItemsPage />;
}
