import { copyTextToClipboard } from './clipboard';

const message = '*Pedido*\n¡Gracias!';
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
const originalExecCommand = Object.getOwnPropertyDescriptor(document, 'execCommand');

afterEach(() => {
    vi.restoreAllMocks();
    if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
    else delete (navigator as { clipboard?: Clipboard }).clipboard;
    if (originalExecCommand) Object.defineProperty(document, 'execCommand', originalExecCommand);
    else delete (document as { execCommand?: Document['execCommand'] }).execCommand;
});

test('uses Clipboard API when it is available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    await expect(copyTextToClipboard(message)).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith(message);
});

test('falls back when Clipboard API is unavailable and removes the temporary textarea', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const execCommand = vi.fn().mockImplementation(() => {
        expect(document.querySelector('textarea')).toHaveValue(message);
        return true;
    });
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });

    await expect(copyTextToClipboard(message)).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).not.toBeInTheDocument();
});

test('falls back after Clipboard API rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Not allowed'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    Object.defineProperty(document, 'execCommand', { value: vi.fn().mockReturnValue(true), configurable: true });

    await expect(copyTextToClipboard(message)).resolves.toBe(true);
});

test('reports failure when neither automatic mechanism can copy', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    Object.defineProperty(document, 'execCommand', { value: vi.fn().mockReturnValue(false), configurable: true });

    await expect(copyTextToClipboard(message)).resolves.toBe(false);
});

test('returns false without invoking execCommand when fallback insertion fails', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {
        throw new Error('DOM blocked');
    });

    await expect(copyTextToClipboard(message)).resolves.toBe(false);
    expect(execCommand).not.toHaveBeenCalled();
    expect(document.querySelector('textarea')).not.toBeInTheDocument();
});

test('returns false and cleans up when text selection preparation fails', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });
    vi.spyOn(HTMLTextAreaElement.prototype, 'select').mockImplementation(() => {
        throw new Error('Selection blocked');
    });

    await expect(copyTextToClipboard(message)).resolves.toBe(false);
    expect(execCommand).not.toHaveBeenCalled();
    expect(document.querySelector('textarea')).not.toBeInTheDocument();
});

test('returns false and cleans up when execCommand throws', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    Object.defineProperty(document, 'execCommand', {
        value: vi.fn().mockImplementation(() => { throw new Error('Copy blocked'); }),
        configurable: true,
    });

    await expect(copyTextToClipboard(message)).resolves.toBe(false);
    expect(document.querySelector('textarea')).not.toBeInTheDocument();
});

test('preserves a successful copy result when selection restoration fails and still restores focus', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    Object.defineProperty(document, 'execCommand', { value: vi.fn().mockReturnValue(true), configurable: true });
    const selection = {
        rangeCount: 0,
        getRangeAt: vi.fn(),
        removeAllRanges: vi.fn(),
        addRange: vi.fn().mockImplementation(() => { throw new Error('Stale range'); }),
    } as unknown as Selection;
    const range = document.createRange();
    const text = document.createTextNode('selected');
    document.body.appendChild(text);
    Object.assign(selection, { rangeCount: 1, getRangeAt: vi.fn().mockReturnValue(range) });
    vi.spyOn(window, 'getSelection').mockReturnValue(selection);
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();
    const focus = vi.spyOn(button, 'focus');

    await expect(copyTextToClipboard(message)).resolves.toBe(true);
    expect(focus).toHaveBeenCalled();
    button.remove();
    text.remove();
});

test('preserves the copy result when focus restoration fails', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    Object.defineProperty(document, 'execCommand', { value: vi.fn().mockReturnValue(true), configurable: true });
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();
    vi.spyOn(button, 'focus').mockImplementation(() => { throw new Error('Focus blocked'); });

    await expect(copyTextToClipboard(message)).resolves.toBe(true);
    button.remove();
});
