import { useEffect, useRef } from 'react';

/**
 * Hook to capture input from a USB/Bluetooth hardware barcode scanner.
 * Hardware scanners simulate a keyboard, typing characters very rapidly, 
 * typically ending with the "Enter" key.
 * 
 * @param onScan - Callback function triggered when a barcode is successfully scanned
 */
export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const buffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if the user is typing into an input or textarea
      const activeElement = document.activeElement;
      if (activeElement) {
        const tagName = activeElement.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea') {
          return;
        }
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;
      
      // If time between keystrokes is too long (e.g. > 100ms), it's likely a human typing, so reset buffer
      if (timeDiff > 100) {
        buffer.current = '';
      }

      lastKeyTime.current = currentTime;

      // When the scanner sends the "Enter" key, process the buffer
      if (e.key === 'Enter') {
        if (buffer.current.length > 3) { // Most barcodes are > 3 chars
          onScan(buffer.current);
          e.preventDefault();
        }
        buffer.current = '';
        return;
      }

      // Only accept printable single characters
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        buffer.current += e.key;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onScan]);
}
