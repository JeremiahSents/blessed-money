import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * A friendly, Notion-style illustrated avatar.
 *
 * The look is derived deterministically from `seed` (use the person's id) so the
 * same person always gets the same face — no database column needed. There are
 * 8 backgrounds × 4 skin tones × 5 hairstyles × 4 mouths = plenty of variety,
 * effectively ~20+ distinct avatars assigned at random across people.
 */

const BG = ["#FDE68A", "#A7F3D0", "#BFDBFE", "#DDD6FE", "#FBCFE8", "#FECACA", "#BAE6FD", "#FED7AA"];
const SKIN = ["#F4D0B0", "#E8B58A", "#C68642", "#8D5524"];
const HAIR = ["#2B2B2B", "#5C3A21", "#A65E2E", "#E0AC69", "#6B7280"];

function hashString(input: string): number {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
        h = (input.charCodeAt(i) + ((h << 5) - h)) | 0;
    }
    return Math.abs(h);
}

// ── Hairstyles (drawn behind/above the face) ────────────────────────────────
function Hair({ style, color }: { style: number; color: string }) {
    switch (style) {
        case 0: // short
            return <path d="M22 46c0-18 12-30 28-30s28 12 28 30c-6-10-16-14-28-14s-22 4-28 14z" fill={color} />;
        case 1: // bun
            return (
                <>
                    <circle cx="50" cy="14" r="8" fill={color} />
                    <path d="M22 46c0-18 12-30 28-30s28 12 28 30c-6-12-16-16-28-16s-22 4-28 16z" fill={color} />
                </>
            );
        case 2: // curly
            return (
                <>
                    <circle cx="32" cy="30" r="11" fill={color} />
                    <circle cx="50" cy="22" r="12" fill={color} />
                    <circle cx="68" cy="30" r="11" fill={color} />
                </>
            );
        case 3: // long
            return <path d="M20 70V44c0-17 13-28 30-28s30 11 30 28v26c-6-4-9-18-9-30-7 6-14 8-21 8s-14-2-21-8c0 12-3 26-9 30z" fill={color} />;
        default: // bald-ish / receding
            return <path d="M26 40c2-14 12-22 24-22s22 8 24 22c-7-7-15-9-24-9s-17 2-24 9z" fill={color} />;
    }
}

// ── Mouths ───────────────────────────────────────────────────────────────────
function Mouth({ style }: { style: number }) {
    switch (style) {
        case 0: // smile
            return <path d="M42 64c3 4 13 4 16 0" stroke="#3a2a1a" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
        case 1: // open smile
            return <path d="M43 62c2 6 12 6 14 0z" fill="#3a2a1a" />;
        case 2: // soft
            return <path d="M44 64h12" stroke="#3a2a1a" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
        default: // smirk
            return <path d="M43 64c4 3 9 3 13 1" stroke="#3a2a1a" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
    }
}

export function PersonAvatar({
    seed,
    name,
    className,
}: {
    seed?: string | null;
    name?: string | null;
    className?: string;
}) {
    const h = hashString(seed || name || "anon");
    const bg = BG[h % BG.length];
    const skin = SKIN[(h >> 2) % SKIN.length];
    const hairColor = HAIR[(h >> 4) % HAIR.length];
    const hairStyle = (h >> 6) % 5;
    const mouthStyle = (h >> 9) % 4;

    return (
        <Avatar className={cn("overflow-hidden rounded-full", className)}>
            <svg viewBox="0 0 100 100" className="size-full" role="img" aria-label={name ? `${name}'s avatar` : "avatar"}>
                <rect width="100" height="100" fill={bg} />
                {/* neck + shoulders */}
                <path d="M30 100c0-12 9-20 20-20s20 8 20 20z" fill={skin} opacity="0.9" />
                {/* head */}
                <ellipse cx="50" cy="48" rx="22" ry="24" fill={skin} />
                {/* ears */}
                <circle cx="28" cy="50" r="4" fill={skin} />
                <circle cx="72" cy="50" r="4" fill={skin} />
                <Hair style={hairStyle} color={hairColor} />
                {/* eyes */}
                <circle cx="42" cy="50" r="2.6" fill="#2b2b2b" />
                <circle cx="58" cy="50" r="2.6" fill="#2b2b2b" />
                <Mouth style={mouthStyle} />
            </svg>
        </Avatar>
    );
}
