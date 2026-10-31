import { useEffect } from "react";

interface ShortcutHandlers {
  onNext?: () => void;
  onPrev?: () => void;
  onApprove?: () => void;
  onEscalate?: () => void;
  onSearch?: () => void;
}

/**
 * Safe keyboard incident triage shortcuts hook.
 * Avoids firing when focus is inside input, textarea, or contentEditable elements.
 */
export function useIncidentKeyboardShortcuts({
  onNext,
  onPrev,
  onApprove,
  onEscalate,
  onSearch,
}: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName?.toUpperCase();
      const isInput =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT" ||
        target.isContentEditable;

      // Handle Ctrl+K / Cmd+K search shortcut (allowed even inside or outside)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        if (onSearch) {
          e.preventDefault();
          onSearch();
          return;
        }
      }

      // If user is actively typing in an input field, do NOT trigger single-key triage shortcuts!
      if (isInput) return;

      // Prevent triggering if modifiers (Alt, Meta, Ctrl) are pressed for single keys
      if (e.altKey || e.metaKey || e.ctrlKey) return;

      const key = e.key.toLowerCase();

      if (key === "j" || e.key === "ArrowDown") {
        if (onNext) {
          e.preventDefault();
          onNext();
        }
      } else if (key === "k" || e.key === "ArrowUp") {
        if (onPrev) {
          e.preventDefault();
          onPrev();
        }
      } else if (key === "a") {
        if (onApprove) {
          e.preventDefault();
          onApprove();
        }
      } else if (key === "x") {
        if (onEscalate) {
          e.preventDefault();
          onEscalate();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrev, onApprove, onEscalate, onSearch]);
}

