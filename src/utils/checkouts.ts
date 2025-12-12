// X01 Checkout Calculator
// Dynamically calculates checkout combinations for any score 2-170

interface Throw {
    prefix: string;  // 'S', 'D', 'T'
    value: number;   // 1-20 or 25
    points: number;  // Actual point value
}

// Build all possible throws
const THROWS: Throw[] = [];

// Singles, doubles, triples 1-20
for (let n = 1; n <= 20; n++) {
    THROWS.push({ prefix: 'S', value: n, points: n });
    THROWS.push({ prefix: 'D', value: n, points: n * 2 });
    THROWS.push({ prefix: 'T', value: n, points: n * 3 });
}

// Bulls
THROWS.push({ prefix: 'S', value: 25, points: 25 });  // Outer bull
THROWS.push({ prefix: 'D', value: 25, points: 50 });  // Inner bull (valid double finish)

// All valid finishing throws
const DOUBLE_FINISHES = THROWS.filter(t => t.prefix === 'D');
const ALL_FINISHES = THROWS;  // For single out, any dart can finish

// Format a throw for display
function formatThrow(t: Throw): string {
    if (t.prefix === 'D' && t.value === 25) return 'Bull';
    return `${t.prefix}${t.value}`;
}

// Calculate priority for sorting - Double Out
function throwPriorityDoubleOut(s: string): number {
    if (s === 'T20') return 0;
    if (s === 'T19') return 1;
    if (s === 'T18') return 2;
    if (s === 'T17') return 3;
    if (s.startsWith('S')) return 4;
    if (s === 'Bull') return 5;
    if (s.startsWith('D')) return 6;
    if (s.startsWith('T')) return 7;
    return 8;
}

// Calculate priority for sorting - Single Out (prefer singles for finishing)
function throwPrioritySingleOut(s: string): number {
    // Singles are easiest to hit
    if (s.startsWith('S')) return 0;
    if (s.startsWith('D')) return 1;
    if (s === 'T20') return 2;
    if (s === 'T19') return 3;
    if (s === 'T18') return 4;
    if (s === 'Bull') return 5;
    if (s.startsWith('T')) return 6;
    return 7;
}

/**
 * Generate all checkout combinations for a target score
 * @param target Score to checkout
 * @param doubleOut If true, must finish on a double
 */
function generateCheckouts(target: number, doubleOut: boolean = true): string[][] {
    if (target < 1 || target > 170) return [];

    // Double out can't checkout from 1
    if (doubleOut && target === 1) return [];

    const results: string[][] = [];
    const seen = new Set<string>();
    const finishThrows = doubleOut ? DOUBLE_FINISHES : ALL_FINISHES;
    const getPriority = doubleOut ? throwPriorityDoubleOut : throwPrioritySingleOut;

    // Helper to add unique result
    const addResult = (combo: string[]) => {
        const key = combo.join(',');
        if (!seen.has(key)) {
            seen.add(key);
            results.push(combo);
        }
    };

    // 1 dart finishes
    for (const fin of finishThrows) {
        if (fin.points === target) {
            addResult([formatThrow(fin)]);
        }
    }

    // 2 dart finishes
    for (const first of THROWS) {
        for (const fin of finishThrows) {
            if (first.points + fin.points === target) {
                addResult([formatThrow(first), formatThrow(fin)]);
            }
        }
    }

    // 3 dart finishes
    for (const first of THROWS) {
        for (const second of THROWS) {
            for (const fin of finishThrows) {
                if (first.points + second.points + fin.points === target) {
                    addResult([formatThrow(first), formatThrow(second), formatThrow(fin)]);
                }
            }
        }
    }

    // Sort: prefer shorter combos, then by priority of each throw in sequence
    results.sort((a, b) => {
        if (a.length !== b.length) return a.length - b.length;

        // Compare each throw's priority
        for (let i = 0; i < a.length; i++) {
            const pA = getPriority(a[i]);
            const pB = getPriority(b[i]);
            if (pA !== pB) return pA - pB;
        }
        return 0;
    });

    return results;
}

// Separate caches for double out and single out
const cacheDoubleOut = new Map<string, string[][]>();
const cacheSingleOut = new Map<string, string[][]>();

/**
 * Get checkout suggestions for a given score
 * @param score Current remaining score
 * @param dartsRemaining Number of darts left in the turn (1-3)
 * @param doubleOut If true, must finish on a double (default true)
 * @returns Array of checkout suggestions, or empty if no checkout possible
 */
export function getCheckoutSuggestions(score: number, dartsRemaining: number = 3, doubleOut: boolean = true): string[][] {
    if (score < 1 || score > 170 || dartsRemaining < 1) {
        return [];
    }

    // Double out can't checkout from 1
    if (doubleOut && score === 1) {
        return [];
    }

    const cache = doubleOut ? cacheDoubleOut : cacheSingleOut;
    const cacheKey = `${score}`;
    let all = cache.get(cacheKey);

    if (!all) {
        all = generateCheckouts(score, doubleOut);
        cache.set(cacheKey, all);
    }

    // Filter by darts remaining and return top 2
    return all.filter(combo => combo.length <= dartsRemaining).slice(0, 2);
}

/**
 * Check if a score is checkable with the given number of darts
 */
export function isCheckable(score: number, dartsRemaining: number = 3, doubleOut: boolean = true): boolean {
    return getCheckoutSuggestions(score, dartsRemaining, doubleOut).length > 0;
}

/**
 * Format checkout suggestion as a readable string
 */
export function formatCheckout(darts: string[]): string {
    return darts.join(' → ');
}
