import { type ReactNode, useRef, useEffect } from 'react';

interface PopoverProps {
    trigger: ReactNode;
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    align?: 'left' | 'right';
}

export function Popover({ trigger, children, isOpen, onClose, align = 'right' }: PopoverProps) {
    const popoverRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Close on escape
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    return (
        <div className="relative">
            <div ref={triggerRef}>{trigger}</div>
            {isOpen && (
                <div
                    ref={popoverRef}
                    className={`absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} z-50 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden`}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
