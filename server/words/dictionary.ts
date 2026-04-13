import { readFileSync } from "node:fs";

const DICTIONARY_PATH = new URL("./dictionary.txt", import.meta.url);

function loadDictionary() {
  const rawDictionary = readFileSync(DICTIONARY_PATH, "utf8");
  const words = rawDictionary
    .split(/\r?\n/)
    .map((word) => word.trim())
    .filter(Boolean);

  return new Set(words);
}

const dictionary = loadDictionary();

export function isValidDictionaryWord(word: string) {
  return dictionary.has(word);
}

export function getDictionarySize() {
  return dictionary.size;
}
