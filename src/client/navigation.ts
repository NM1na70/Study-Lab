// Coordinate every mounted question so combined review cannot leave after only one draft saves
const callbacks = new Set<() => Promise<boolean>>();
let navigating = false;

// Wait for every mounted card to flush before following an ordinary unmodified in-app link
async function navigate(event: MouseEvent) {
  const anchor =
    event.target instanceof Element
      ? event.target.closest('a[href^="#/"]')
      : null;
  if (
    !anchor ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.button !== 0
  )
    return;
  event.preventDefault();
  if (navigating) return;
  navigating = true;
  try {
    const results = await Promise.all(
      [...callbacks].map((callback) => callback()),
    );
    if (results.every(Boolean)) location.hash = anchor.getAttribute('href')!;
  } finally {
    navigating = false;
  }
}

// Install one capturing listener while any card needs save-aware navigation
export function registerNavigation(callback: () => Promise<boolean>) {
  callbacks.add(callback);
  if (callbacks.size === 1) document.addEventListener('click', navigate, true);
  return () => {
    callbacks.delete(callback);
    if (!callbacks.size) document.removeEventListener('click', navigate, true);
  };
}
