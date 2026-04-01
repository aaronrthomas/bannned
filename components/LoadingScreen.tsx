'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TARGET = ['B', 'A', 'N', 'N', 'N', 'E', 'D'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHAR_HEIGHT = 1; // in em units, for the reel step size

// Each reel spins for a base duration + staggered delay per letter
const BASE_SPIN_MS = 800;
const STAGGER_MS = 400;

// A single vault reel (vertical spinning column of letters)
function VaultReel({
    targetChar,
    index,
    onLocked,
}: {
    targetChar: string;
    index: number;
    onLocked: (i: number) => void;
}) {
    const reelRef = useRef<HTMLDivElement>(null);
    const [locked, setLocked] = useState(false);
    const [offset, setOffset] = useState(0);
    const frameRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    // Build the reel strip: alphabet repeated several times, ending on the target char
    const targetIndex = ALPHABET.indexOf(targetChar);

    // Reel content: 3 full alphabet cycles + up to the target letter
    const reelChars: string[] = [];
    const fullCycles = 3;
    for (let c = 0; c < fullCycles; c++) {
        for (let i = 0; i < ALPHABET.length; i++) {
            reelChars.push(ALPHABET[i]);
        }
    }
    // Add partial cycle up to target
    for (let i = 0; i <= targetIndex; i++) {
        reelChars.push(ALPHABET[i]);
    }
    const finalStopIndex = reelChars.length - 1;

    useEffect(() => {
        const delay = index * STAGGER_MS;
        const spinDuration = BASE_SPIN_MS + index * 220; // later letters spin longer

        const delayTimer = setTimeout(() => {
            startTimeRef.current = performance.now();

            const animate = (now: number) => {
                const elapsed = now - startTimeRef.current;
                const progress = Math.min(elapsed / spinDuration, 1);

                // Ease-out cubic — fast at start, slows at end (like a real reel)
                const eased = 1 - Math.pow(1 - progress, 3);

                // Map progress to reel position
                const currentPos = eased * finalStopIndex;
                setOffset(currentPos);

                if (progress < 1) {
                    frameRef.current = requestAnimationFrame(animate);
                } else {
                    // Snap to exact final position
                    setOffset(finalStopIndex);
                    setLocked(true);
                    onLocked(index);
                }
            };
            frameRef.current = requestAnimationFrame(animate);
        }, delay);

        return () => {
            clearTimeout(delayTimer);
            cancelAnimationFrame(frameRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // The translateY to show the current character — moves upward
    const translateY = -offset * CHAR_HEIGHT;

    return (
        <div className={`vault-reel-slot ${locked ? 'locked' : ''}`}>
            {/* Reel window — clips to show one character */}
            <div className="vault-reel-window">
                <div
                    ref={reelRef}
                    className="vault-reel-strip"
                    style={{
                        transform: `translateY(${translateY}em)`,
                    }}
                >
                    {reelChars.map((char, i) => (
                        <div
                            key={i}
                            className={`vault-reel-char ${
                                locked && i === finalStopIndex ? 'final' : ''
                            }`}
                        >
                            {char}
                        </div>
                    ))}
                </div>
            </div>

            {/* Notch marks on either side — vault grooves */}
            <div className="vault-notch vault-notch-left" />
            <div className="vault-notch vault-notch-right" />

            {/* Lock flash */}
            {locked && (
                <motion.div
                    className="vault-lock-flash"
                    initial={{ opacity: 0.8, scale: 1.3 }}
                    animate={{ opacity: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            )}
        </div>
    );
}

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
    const [visible, setVisible] = useState(true);
    const [lockedLetters, setLockedLetters] = useState<Set<number>>(new Set());
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [allLocked, setAllLocked] = useState(false);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        setMousePos({
            x: (e.clientX / window.innerWidth) * 100,
            y: (e.clientY / window.innerHeight) * 100,
        });
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [handleMouseMove]);

    const handleLocked = useCallback(
        (index: number) => {
            setLockedLetters((prev) => {
                const next = new Set(prev);
                next.add(index);

                if (next.size === TARGET.length && !allLocked) {
                    setAllLocked(true);
                    // Delay before dismissing
                    setTimeout(() => {
                        setVisible(false);
                        setTimeout(onComplete, 700);
                    }, 600);
                }

                return next;
            });
        },
        [allLocked, onComplete]
    );

    const progress = (lockedLetters.size / TARGET.length) * 100;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="loading-screen"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: 'easeInOut' }}
                    style={
                        {
                            '--mouse-x': `${mousePos.x}%`,
                            '--mouse-y': `${mousePos.y}%`,
                        } as React.CSSProperties
                    }
                >
                    {/* Interactive radial glow following cursor */}
                    <div className="loading-glow" />

                    {/* Vertical lines decoration */}
                    <div className="loading-lines" aria-hidden="true">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="loading-line"
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{
                                    duration: 1.2,
                                    delay: i * 0.1,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                            />
                        ))}
                    </div>

                    {/* Top tagline */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="loading-tagline"
                    >
                        Premium Streetwear Collection
                    </motion.div>

                    {/* Vault lock reels */}
                    <motion.div
                        className="vault-reels-row"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {TARGET.map((char, i) => (
                            <VaultReel
                                key={i}
                                targetChar={char}
                                index={i}
                                onLocked={handleLocked}
                            />
                        ))}
                    </motion.div>

                    {/* Progress bar */}
                    <div className="loading-bar-track">
                        <motion.div
                            className="loading-bar-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Bottom: status */}
                    <div className="loading-bottom">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="loading-percent"
                        >
                            {lockedLetters.size} / {TARGET.length}
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            transition={{ delay: 0.5 }}
                            className="loading-tagline"
                        >
                            {allLocked ? 'Access granted' : 'Cracking the vault'}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
