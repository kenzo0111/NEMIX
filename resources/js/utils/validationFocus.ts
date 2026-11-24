export function focusFirstInvalidField() {
    if (typeof document === 'undefined') return;
    const scope = document.querySelector('[role="dialog"]') || document;
    const field = Array.from(scope.querySelectorAll<HTMLElement>('[aria-invalid="true"]')).find(element => element.getClientRects().length > 0 && !element.hasAttribute('disabled'));
    field?.focus();
}
