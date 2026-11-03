import type { Product, ProductPage, ProductSearch } from '../domain/Product';

const DIACRITICS_PATTERN = /[\u0300-\u036f]/g;
const WHITESPACE_PATTERN = /\s+/g;
const PAGE_SIZE = 12;

export const normalizeSearch = (value: string): string =>
  value
    .normalize('NFD')
    .replace(DIACRITICS_PATTERN, '')
    .toLowerCase()
    .trim()
    .replace(WHITESPACE_PATTERN, ' ');

const matchesSimilarWord = (term: string, word: string): boolean => {
  if (!/^[a-z]{4,}$/.test(term) || !/^[a-z]+$/.test(word)) return false;
  const maxEdits = term.length >= 5 ? 2 : 1;
  if (
    word.length >= term.length &&
    word.length - term.length <= 3 &&
    term.length / word.length >= 0.6
  ) {
    let matched = 0;
    for (const character of word) {
      if (character === term[matched]) matched += 1;
    }
    if (matched === term.length) return true;
  }
  if (Math.abs(term.length - word.length) > maxEdits) return false;
  let previous = Array.from({ length: word.length + 1 }, (_, index) => index);
  for (let row = 1; row <= term.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= word.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (term[row - 1] === word[column - 1] ? 0 : 1)
      );
    }
    previous = current;
  }
  return previous[word.length] <= maxEdits;
};

export const searchProducts = (
  products: readonly Product[],
  { query, category, categories }: ProductSearch
): readonly Product[] => {
  const terms = normalizeSearch(query).split(' ').filter(Boolean);

  const candidates = products.filter(
    (product) =>
      (!category || product.category === category) &&
      (!categories?.length || categories.includes(product.category))
  );
  const exactMatches = candidates.filter((product) => {
    const text = normalizeSearch(
      `${product.name} ${product.brand} ${product.category} ${product.presentation} ${product.sku}`
    );
    return terms.every((term) => text.includes(term));
  });
  if (exactMatches.length) return exactMatches;

  return candidates.filter((product) => {
    const searchableText = normalizeSearch(
      `${product.name} ${product.brand} ${product.category} ${product.presentation} ${product.sku}`
    );
    const words = searchableText.split(' ');
    return terms.every(
      (term) =>
        searchableText.includes(term) || words.some((word) => matchesSimilarWord(term, word))
    );
  });
};

export const paginateProducts = (
  products: readonly Product[],
  requestedPage: number
): ProductPage => {
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * PAGE_SIZE;

  return { items: products.slice(start, start + PAGE_SIZE), page, totalPages };
};
