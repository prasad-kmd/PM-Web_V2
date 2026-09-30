import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import type { BlockedWord } from "./types";

/**
 * Profanity filter, ported from PMEngineerLK-NextJS (`lib/validation/profanity.ts`).
 *
 * `obscenity` builds a single compiled matcher, so this module is created once
 * per server instance and reused for every request.
 */
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

/** Returns every blocked word in `text` with its position. */
export function findBlockedWords(text: string): BlockedWord[] {
  try {
    return matcher.getAllMatches(text).map((match) => ({
      word: text.substring(match.startIndex, match.endIndex),
      startIndex: match.startIndex,
      endIndex: match.endIndex,
    }));
  } catch (error) {
    console.error("[comments] profanity scan failed:", error);
    return [];
  }
}

/** Cheap boolean check. Fails open so a library error never blocks a reader. */
export function hasProfanity(text: string): boolean {
  try {
    return matcher.hasMatch(text);
  } catch (error) {
    console.error("[comments] profanity check failed:", error);
    return false;
  }
}
