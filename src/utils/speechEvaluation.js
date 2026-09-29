const NUMBER_WORDS_MAP = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
  '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen', '14': 'fourteen',
  '15': 'fifteen', '16': 'sixteen', '17': 'seventeen', '18': 'eighteen', '19': 'nineteen',
  '20': 'twenty', '30': 'thirty', '40': 'forty', '50': 'fifty',
  '60': 'sixty', '70': 'seventy', '80': 'eighty', '90': 'ninety',
  '100': 'one hundred'
};

export function numberToWords(numStr) {
  const n = parseInt(numStr, 10);
  if (isNaN(n)) return numStr;
  if (n < 0 || n > 100) return numStr;
  if (NUMBER_WORDS_MAP[String(n)]) return NUMBER_WORDS_MAP[String(n)];
  if (n > 20 && n < 100) {
    const tens = Math.floor(n / 10) * 10;
    const units = n % 10;
    return `${NUMBER_WORDS_MAP[String(tens)]} ${NUMBER_WORDS_MAP[String(units)]}`;
  }
  return String(numStr);
}

const CONTRACTIONS_MAP = {
  "i'm": "i am", "im": "i am",
  "you're": "you are", "youre": "you are",
  "he's": "he is", "hes": "he is",
  "she's": "she is", "shes": "she is",
  "it's": "it is", "its": "it is",
  "they're": "they are", "theyre": "they are",
  "we're": "we are",
  "i've": "i have", "ive": "i have",
  "you've": "you have", "youve": "you have",
  "we've": "we have", "weve": "we have",
  "they've": "they have", "theyve": "they have",
  "i'd": "i would", "id": "i would",
  "you'd": "you would", "youd": "you would",
  "he'd": "he would", "hed": "he would",
  "she'd": "she would", "shed": "she would",
  "we'd": "we would", "wed": "we would",
  "they'd": "they would", "theyd": "they would",
  "i'll": "i will", "ill": "i will",
  "you'll": "you will", "youll": "you will",
  "he'll": "he will", "hell": "he will",
  "she'll": "she will",
  "we'll": "we will",
  "they'll": "they will", "theyll": "they will",
  "don't": "do not", "dont": "do not",
  "doesn't": "does not", "doesnt": "does not",
  "didn't": "did not", "didnt": "did not",
  "can't": "cannot", "cant": "cannot",
  "won't": "will not", "wont": "will not",
  "isn't": "is not", "isnt": "is not",
  "aren't": "are not", "arent": "are not",
  "wasn't": "was not", "wasnt": "was not",
  "weren't": "were not", "werent": "were not",
  "haven't": "have not", "havent": "have not",
  "hasn't": "has not", "hasnt": "has not",
  "hadn't": "had not", "hadnt": "had not",
  "wouldn't": "would not", "wouldnt": "would not",
  "shouldn't": "should not", "shouldnt": "should not",
  "couldn't": "could not", "couldnt": "could not",
  "let's": "let us", "lets": "let us",
  "that's": "that is", "thats": "that is",
  "what's": "what is", "whats": "what is",
  "who's": "who is", "whos": "who is",
  "where's": "where is", "wheres": "where is",
  "there's": "there is", "theres": "there is"
};

export function normalizeEnglishSentence(text = '') {
  if (!text) return '';
  
  let str = String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Convert digits 0-100 to English words
  str = str.replace(/\b\d+\b/g, (match) => numberToWords(match));

  // Replace punctuation (except apostrophe) with spaces
  str = str.replace(/[^a-z0-9'\s]/g, ' ');

  // Tokenize and expand contractions
  const rawTokens = str.split(/\s+/).filter(Boolean);
  const expandedTokens = rawTokens.map((token) => {
    const cleanToken = token.trim();
    if (CONTRACTIONS_MAP[cleanToken]) {
      return CONTRACTIONS_MAP[cleanToken];
    }
    // Try without apostrophe if present
    const noApostrophe = cleanToken.replace(/'/g, '');
    if (CONTRACTIONS_MAP[noApostrophe]) {
      return CONTRACTIONS_MAP[noApostrophe];
    }
    return cleanToken.replace(/'/g, '');
  });

  return expandedTokens
    .join(' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export const SIMILARITY_THRESHOLD = 80;

export function levenshteinDistance(s1 = '', s2 = '') {
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const d = [];
  for (let i = 0; i <= s1.length; i++) d[i] = [i];
  for (let j = 0; j <= s2.length; j++) d[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }
  return d[s1.length][s2.length];
}

export function evaluateSpeechAccuracy(targetText = '', spokenText = '') {
  const normTarget = normalizeEnglishSentence(targetText);
  const normSpoken = normalizeEnglishSentence(spokenText);

  if (!normTarget || !normSpoken) {
    return {
      score: 0,
      passed: false,
      normTarget,
      normSpoken
    };
  }

  if (normTarget === normSpoken) {
    return {
      score: 100,
      passed: true,
      normTarget,
      normSpoken
    };
  }

  const targetWords = normTarget.split(' ').filter(Boolean);
  const spokenWords = normSpoken.split(' ').filter(Boolean);

  if (targetWords.length === 0 || spokenWords.length === 0) {
    return {
      score: 0,
      passed: false,
      normTarget,
      normSpoken
    };
  }

  let totalMatchWeight = 0;
  const spokenPool = [...spokenWords];

  for (const tWord of targetWords) {
    let bestMatchIdx = -1;
    let bestMatchScore = 0;

    for (let i = 0; i < spokenPool.length; i++) {
      const sWord = spokenPool[i];
      if (sWord === tWord) {
        bestMatchIdx = i;
        bestMatchScore = 1.0;
        break;
      }
      // Levenshtein word similarity
      const maxLen = Math.max(tWord.length, sWord.length);
      const dist = levenshteinDistance(tWord, sWord);
      const wordSim = (maxLen - dist) / maxLen;
      // Allow minor phonetic or inflection differences (e.g. year vs years -> dist 1, maxLen 5 => 0.8)
      if (wordSim >= 0.75 && wordSim > bestMatchScore) {
        bestMatchScore = wordSim;
        bestMatchIdx = i;
      }
    }

    if (bestMatchIdx !== -1) {
      totalMatchWeight += bestMatchScore;
      spokenPool.splice(bestMatchIdx, 1);
    }
  }

  const baseRatio = totalMatchWeight / targetWords.length;
  // Small penalty for excessive extra words
  const extraWords = Math.max(0, spokenWords.length - targetWords.length);
  const penalty = extraWords * 0.05;
  const finalRatio = Math.max(0, baseRatio - penalty);
  const calculatedScore = Math.min(100, Math.max(0, Math.round(finalRatio * 100)));

  return {
    score: calculatedScore,
    passed: calculatedScore >= SIMILARITY_THRESHOLD,
    normTarget,
    normSpoken
  };
}
