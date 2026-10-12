import { useState, useRef, useCallback, useMemo } from 'react'

// Lets a form save once at a time. Call `begin()` when a save starts: it
// returns false if one is already under way, so a double click or a second
// Enter cannot send the same thing twice. Call `end()` when it settles.
// `isPending` is for the button: disabled, with a "Saving…" label.
//
// The ref is what stops the second attempt: `isPending` only changes on the
// next render, which is too late for two clicks in the same instant.
export function useSubmitGuard() {
  const [isPending, setIsPending] = useState(false);
  const busy = useRef(false);

  const begin = useCallback(() => {
    if (busy.current) return false;
    busy.current = true;
    setIsPending(true);
    return true;
  }, []);

  const end = useCallback(() => {
    busy.current = false;
    setIsPending(false);
  }, []);

  return useMemo(() => ({ isPending, begin, end }), [isPending, begin, end]);
}
