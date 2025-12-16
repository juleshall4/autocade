/**
 * Dartboard - SVG dartboard with dart position markers
 * 
 * Coordinates: -1 to 1 with (0,0) at center
 * SVG viewBox: -100 to 100
 */

// Segment numbers in clockwise order starting from top
const SEGMENTS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]

// Colors
const BLACK = '#212121'
const WHITE = '#FFFDE7'
const RED = '#F05350'
const GREEN = '#66BB6B'

// Ring radii (as percentage of board radius)
const RINGS = {
  doubleBull: 3.2,
  singleBull: 8,
  innerSingle: 47,
  triple: 52,
  outerSingle: 75,
  double: 80,
  numberRing: 100,
}

interface DartPosition {
  x: number;
  y: number;
  timestamp?: number;
}

interface DartboardProps {
  darts?: DartPosition[];
  size?: number;
  highlightSegment?: string; // Legacy support (single)
  highlightSegments?: string[]; // New support (multiple)
  glowColor?: string;
}

// Segment info for highlight matching
interface SegmentInfo {
  type: string | null;
  num: number;
}

// Parse segment string to type and number
const getSegmentFromStr = (str: string): SegmentInfo | null => {
  if (!str) return null;
  if (str === 'Bull' || str === 'D25') return { type: 'doubleBull', num: 25 };
  if (str === '25' || str === 'S25') return { type: 'singleBull', num: 25 };
  if (str === 'full25') return { type: 'fullBull', num: 25 }; // Full bull = both rings

  // Check for 'full' prefix (highlight entire segment - all rings)
  if (str.startsWith('full')) {
    const num = parseInt(str.slice(4));
    return { type: 'full', num };
  }

  // Check for 'OS' prefix (outer-single only)
  if (str.startsWith('OS')) {
    const num = parseInt(str.slice(2));
    return { type: 'outerSingle', num };
  }

  const type = str.startsWith('T') ? 'triple' :
    str.startsWith('D') ? 'double' :
      str.startsWith('S') ? 'single' : null;
  const num = parseInt(str.slice(1));
  return { type, num };
};

export function Dartboard({ darts = [], size = 600, highlightSegment, highlightSegments = [], glowColor }: DartboardProps) {
  // Parse all highlight segments
  const allSegments = [...highlightSegments, ...(highlightSegment ? [highlightSegment] : [])];
  const highlightInfos = allSegments.map(s => getSegmentFromStr(s)).filter((i): i is SegmentInfo => i !== null);

  // Check if a segment type/num should be highlighted
  const isHighlighted = (type: string, num: number): boolean => {
    return highlightInfos.some(info => {
      if (info.num !== num) return false;

      // 'full' highlights all parts of the segment (double, triple, inner single, outer single)
      if (info.type === 'full') {
        return type === 'double' || type === 'triple' || type === 'innerSingle' || type === 'outerSingle';
      }

      // 'fullBull' highlights both bull rings
      if (info.type === 'fullBull') {
        return type === 'singleBull' || type === 'doubleBull';
      }

      // 'single' matches both inner and outer single
      if (info.type === 'single') {
        return type === 'innerSingle' || type === 'outerSingle';
      }

      // Direct match for specific types
      return type === info.type;
    });
  };

  // Generate segment paths
  const segments = SEGMENTS.map((num, i) => {
    const startAngle = (i * 18 - 99) * Math.PI / 180
    const endAngle = (i * 18 - 81) * Math.PI / 180
    const isEven = i % 2 === 0

    return { num, startAngle, endAngle, isEven }
  })

  // Create arc path
  const arc = (innerR: number, outerR: number, startAngle: number, endAngle: number) => {
    const x1 = Math.cos(startAngle) * innerR
    const y1 = Math.sin(startAngle) * innerR
    const x2 = Math.cos(endAngle) * innerR
    const y2 = Math.sin(endAngle) * innerR
    const x3 = Math.cos(endAngle) * outerR
    const y3 = Math.sin(endAngle) * outerR
    const x4 = Math.cos(startAngle) * outerR
    const y4 = Math.sin(startAngle) * outerR

    return `M ${x1} ${y1} A ${innerR} ${innerR} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${outerR} ${outerR} 0 0 0 ${x4} ${y4} Z`
  }

  return (
    <div className="relative">
      {/* Theme glow behind dartboard */}
      {glowColor && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${glowColor})`,
            filter: 'blur(60px)',
            transform: 'scale(0.9)',
          }}
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox="-105 -105 210 210"
        className="relative z-10"
      >
        {/* Black number ring (surround) */}
        <circle cx="0" cy="0" r={RINGS.numberRing} fill={BLACK} />

        {/* Segments */}
        {segments.map((seg) => (
          <g key={seg.num}>
            {/* Double ring */}
            <path
              d={arc(RINGS.outerSingle, RINGS.double, seg.startAngle, seg.endAngle)}
              fill={seg.isEven ? RED : GREEN}
            />
            {isHighlighted('double', seg.num) && (
              <path
                d={arc(RINGS.outerSingle, RINGS.double, seg.startAngle, seg.endAngle)}
                fill="#fbbf24"
                className="animate-pulse-transparency"
              />
            )}

            {/* Outer single */}
            <path
              d={arc(RINGS.triple, RINGS.outerSingle, seg.startAngle, seg.endAngle)}
              fill={seg.isEven ? BLACK : WHITE}
            />
            {isHighlighted('outerSingle', seg.num) && (
              <path
                d={arc(RINGS.triple, RINGS.outerSingle, seg.startAngle, seg.endAngle)}
                fill="#fbbf24"
                className="animate-pulse-transparency"
              />
            )}

            {/* Triple ring */}
            <path
              d={arc(RINGS.innerSingle, RINGS.triple, seg.startAngle, seg.endAngle)}
              fill={seg.isEven ? RED : GREEN}
            />
            {isHighlighted('triple', seg.num) && (
              <path
                d={arc(RINGS.innerSingle, RINGS.triple, seg.startAngle, seg.endAngle)}
                fill="#fbbf24"
                className="animate-pulse-transparency"
              />
            )}

            {/* Inner single */}
            <path
              d={arc(RINGS.singleBull, RINGS.innerSingle, seg.startAngle, seg.endAngle)}
              fill={seg.isEven ? BLACK : WHITE}
            />
            {isHighlighted('innerSingle', seg.num) && (
              <path
                d={arc(RINGS.singleBull, RINGS.innerSingle, seg.startAngle, seg.endAngle)}
                fill="#fbbf24"
                className="animate-pulse-transparency"
              />
            )}
          </g>
        ))}

        {/* Bull */}
        <circle
          cx="0" cy="0" r={RINGS.singleBull}
          fill={GREEN}
        />
        {isHighlighted('singleBull', 25) && (
          <circle
            cx="0" cy="0" r={RINGS.singleBull}
            fill="#fbbf24"
            className="animate-pulse-transparency"
          />
        )}

        <circle
          cx="0" cy="0" r={RINGS.doubleBull}
          fill={RED}
        />
        {isHighlighted('doubleBull', 25) && (
          <circle
            cx="0" cy="0" r={RINGS.doubleBull}
            fill="#fbbf24"
            className="animate-pulse-transparency"
          />
        )}

        {/* Segment numbers - aligned to outer edge of black surround */}
        {segments.map((seg) => {
          const midAngle = (seg.startAngle + seg.endAngle) / 2
          const numberRadius = RINGS.numberRing - 3  // Just inside the outer edge
          const x = Math.cos(midAngle) * numberRadius
          const y = Math.sin(midAngle) * numberRadius
          let rotation = (midAngle * 180 / Math.PI) + 90
          // Flip numbers on bottom half so they stay upright
          const isFlipped = rotation > 90 && rotation < 270
          if (isFlipped) {
            rotation += 180
          }
          return (
            <text
              key={`num-${seg.num}`}
              x={x}
              y={y}
              fill="#eeeeee"
              fontSize="10"
              fontWeight="800"
              fontFamily="'Google Sans', 'Product Sans', system-ui, sans-serif"
              textAnchor="middle"
              dominantBaseline={isFlipped ? "auto" : "hanging"}
              transform={`rotate(${rotation}, ${x}, ${y})`}
            >
              {seg.num}
            </text>
          )
        })}

        {/* Dart markers */}
        {darts.map((dart, i) => {
          const x = dart.x * RINGS.double
          const y = dart.y * RINGS.double
          const isLatest = i === darts.length - 1

          return (
            <g key={dart.timestamp || i}>
              <circle
                cx={x + 1}
                cy={y + 1}
                r={isLatest ? 4 : 2.5}
                fill="rgba(0,0,0,0.5)"
              />
              <circle
                cx={x}
                cy={y}
                r={isLatest ? 4 : 2.5}
                fill={isLatest ? '#f59e0b' : '#fbbf24'}
                stroke="#fff"
                strokeWidth={isLatest ? 1.5 : 0.8}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
