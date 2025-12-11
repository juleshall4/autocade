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

// All valid finishing throws (doubles only)
const FINISHING_THROWS = THROWS.filter(t => t.prefix === 'D');

// Format a throw for display
function formatThrow(t: Throw): string {
    if (t.prefix === 'D' && t.value === 25) return 'Bull';
    return `${t.prefix}${t.value}`;
}

// Calculate priority for sorting (prefer T20 > T19 > ...)
function throwPriority(s: string): number {
    // 1. High Triples (Standard Scoring)
    if (s === 'T20') return 0;
    if (s === 'T19') return 1;
    if (s === 'T18') return 2;
    if (s === 'T17') return 3;

    // 2. Singles (Preferred for setup if high triples aren't needed)
    if (s.startsWith('S')) return 4;

    // 3. Bull
    if (s === 'Bull') return 5;

    // 4. Doubles (Sometimes used for setup e.g. D20 D20)
    if (s.startsWith('D')) return 6;

    // 5. Other Triples (Weird ones like T4 - avoid unless necessary)
    if (s.startsWith('T')) return 7;

    return 8;
}

/**
 * Generate all checkout combinations for a target score
 */
function generateCheckouts(target: number): string[][] {
    if (target < 2 || target > 170) return [];

    const results: string[][] = [];
    const seen = new Set<string>();

    // Helper to add unique result
    const addResult = (combo: string[]) => {
        const key = combo.join(',');
        if (!seen.has(key)) {
            seen.add(key);
            results.push(combo);
        }
    };

    // 1 dart finishes
    for (const fin of FINISHING_THROWS) {
        if (fin.points === target) {
            addResult([formatThrow(fin)]);
        }
    }

    // 2 dart finishes
    for (const first of THROWS) {
        for (const fin of FINISHING_THROWS) {
            if (first.points + fin.points === target) {
                addResult([formatThrow(first), formatThrow(fin)]);
            }
        }
    }

    // 3 dart finishes
    for (const first of THROWS) {
        for (const second of THROWS) {
            for (const fin of FINISHING_THROWS) {
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
            const pA = throwPriority(a[i]);
            const pB = throwPriority(b[i]);
            if (pA !== pB) return pA - pB;
        }
        return 0;
    });

    return results;
}

// Simple cache for performance (scores 2-170)
const cache = new Map<string, string[][]>();

/**
 * Get checkout suggestions for a given score
 * @param score Current remaining score
 * @param dartsRemaining Number of darts left in the turn (1-3)
 * @returns Array of checkout suggestions, or empty if no checkout possible
 */
export function getCheckoutSuggestions(score: number, dartsRemaining: number = 3): string[][] {
    if (score < 2 || score > 170 || dartsRemaining < 1) {
        return [];
    }

    const cacheKey = `${score}`;
    let all = cache.get(cacheKey);

    if (!all) {
        all = generateCheckouts(score);
        cache.set(cacheKey, all);
    }

    // Filter by darts remaining and return top 2
    return all.filter(combo => combo.length <= dartsRemaining).slice(0, 2);
}

/**
 * Check if a score is checkable with the given number of darts
 */
export function isCheckable(score: number, dartsRemaining: number = 3): boolean {
    return getCheckoutSuggestions(score, dartsRemaining).length > 0;
}

/**
 * Format checkout suggestion as a readable string
 */
export function formatCheckout(darts: string[]): string {
    return darts.join(' → ');
}
