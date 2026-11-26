/**
 * Copies text when the modern Clipboard API is available and falls back to the
 * legacy command for HTTP and older-browser contexts. The caller decides how
 * to offer manual copy when both mechanisms are unavailable.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Browsers can reject this after an async action or outside HTTPS.
        }
    }

    if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
        return false;
    }

    let textarea: HTMLTextAreaElement | null = null;
    let activeElement: HTMLElement | null = null;
    let selection: Selection | null = null;
    let ranges: Range[] = [];

    try {
        activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const currentSelection = window.getSelection();
        selection = currentSelection;
        ranges = currentSelection
            ? Array.from({ length: currentSelection.rangeCount }, (_, index) => currentSelection.getRangeAt(index).cloneRange())
            : [];
        textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.setAttribute('aria-hidden', 'true');
        textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        try {
            textarea?.remove();
        } catch {
            // Cleanup cannot change the copy result.
        }
        const selectionToRestore = selection;
        if (selectionToRestore) {
            try {
                selectionToRestore.removeAllRanges();
                ranges.forEach((range) => selectionToRestore.addRange(range));
            } catch {
                // A stale selection must not prevent focus restoration.
            }
        }
        try {
            activeElement?.focus();
        } catch {
            // A detached element can no longer receive focus.
        }
    }
}
