import QRCode from 'qrcode';

// Generates a scannable QR code (as a PNG data URL) encoding the given text.
// Used to turn a device's serial number into something that can be printed and
// scanned later (e.g. when creating a sale invoice) instead of retyped by hand.
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#0f172a', light: '#ffffff' },
  });
}
