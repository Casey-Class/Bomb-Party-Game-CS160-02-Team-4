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
const dictionaryWords = Array.from(dictionary).filter((word) => /^[A-Z]+$/.test(word) && word.length >= 3);

export function isValidDictionaryWord(word: string) {
  return dictionary.has(word);
}

export function getDictionarySize() {
  return dictionary.size;
}

export function getRandomSyllable() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const word = dictionaryWords[Math.floor(Math.random() * dictionaryWords.length)];

    if (!word) {
      break;
    }

    const syllableLength = word.length <= 4 ? 2 : Math.random() < 0.5 ? 2 : 3;
    const maxStart = word.length - syllableLength;

    if (maxStart < 0) {
      continue;
    }

    const start = Math.floor(Math.random() * (maxStart + 1));
    const syllable = word.slice(start, start + syllableLength);

    if (/^[A-Z]+$/.test(syllable)) {
      return syllable;
    }
  }

  return "OGI";
}
