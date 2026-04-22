/**
 * SkeletonCard — Animated loading placeholder for data cards.
 *
 * Used in Dashboard and TicketDetail while async data is being fetched.
 * The pulse animation signals loading without the jarring "spinner + blank" pattern.
 */
const SkeletonCard = ({ lines = 3 }) => (
    <div className="animate-pulse bg-gray-800/60 rounded-xl p-5 border border-gray-700/30">
        {/* Title line */}
        <div className="h-4 bg-gray-700 rounded-md w-3/4 mb-4" />

        {/* Content lines */}
        {Array.from({ length: lines - 1 }).map((_, i) => (
            <div
                key={i}
                className={`h-3 bg-gray-700 rounded-md mb-2 ${
                    i === lines - 2 ? 'w-1/3' : 'w-full'
                }`}
            />
        ))}
    </div>
);

/**
 * SkeletonList — Renders N skeleton cards in a vertical list.
 *
 * @param {number} count - Number of skeleton cards to render (default: 5)
 * @param {number} lines - Lines per card (default: 3)
 */
export const SkeletonList = ({ count = 5, lines = 3 }) => (
    <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} lines={lines} />
        ))}
    </div>
);

/**
 * SkeletonTable — For tabular data loading states.
 */
export const SkeletonTable = ({ rows = 5 }) => (
    <div className="animate-pulse space-y-2">
        {/* Header row */}
        <div className="flex gap-4 pb-2 border-b border-gray-700">
            {[40, 20, 20, 20].map((w, i) => (
                <div key={i} className={`h-3 bg-gray-700 rounded w-${w}`} />
            ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4 py-2">
                {[40, 20, 20, 20].map((w, j) => (
                    <div
                        key={j}
                        className={`h-3 rounded ${j === 0 ? 'bg-gray-600' : 'bg-gray-700'}`}
                        style={{ width: `${w}%` }}
                    />
                ))}
            </div>
        ))}
    </div>
);

export default SkeletonCard;
