import BarcodeFormat from "@zxing/library/esm/core/BarcodeFormat";
import EncodeHintType from "@zxing/library/esm/core/EncodeHintType";
import DataMatrixWriter from "@zxing/library/esm/core/datamatrix/DataMatrixWriter";
import { normalizeAwbForBarcode } from "../../shared/shipping-label";

const MIN_SYMBOL_WIDTH = 48;
const MIN_SYMBOL_HEIGHT = 16;
const QUIET_ZONE_MODULES = 2;
const FORCE_RECTANGLE = 2;

export type DataMatrixArtwork = {
  normalizedValue: string;
  path: string;
  symbolWidth: number;
  symbolHeight: number;
  totalWidth: number;
  totalHeight: number;
};

export function createDataMatrixArtwork(value?: string | null): DataMatrixArtwork | null {
  const normalizedValue = normalizeAwbForBarcode(value);
  if (!normalizedValue) return null;

  const hints = new Map<EncodeHintType, unknown>([
    [EncodeHintType.DATA_MATRIX_SHAPE, FORCE_RECTANGLE],
    [EncodeHintType.MIN_SIZE, {
      getWidth: () => MIN_SYMBOL_WIDTH,
      getHeight: () => MIN_SYMBOL_HEIGHT,
    }],
  ]);
  const matrix = new DataMatrixWriter().encode(normalizedValue, BarcodeFormat.DATA_MATRIX, 0, 0, hints);
  const pathSegments: string[] = [];
  for (let y = 0; y < matrix.getHeight(); y += 1) {
    for (let x = 0; x < matrix.getWidth(); x += 1) {
      if (matrix.get(x, y)) pathSegments.push(`M${x + QUIET_ZONE_MODULES} ${y + QUIET_ZONE_MODULES}h1v1h-1z`);
    }
  }
  return {
    normalizedValue,
    path: pathSegments.join(""),
    symbolWidth: matrix.getWidth(),
    symbolHeight: matrix.getHeight(),
    totalWidth: matrix.getWidth() + QUIET_ZONE_MODULES * 2,
    totalHeight: matrix.getHeight() + QUIET_ZONE_MODULES * 2,
  };
}
