/**
 * ThermalRenderer — Renders a label for Niimbot thermal label printers.
 *
 * Extends the CanvasRenderer pattern but applies thermal-specific
 * post-processing:
 *   1. White background (no transparency)
 *   2. `imageSmoothingEnabled = false` for crisp icon edges
 *   3. Alpha compositing against white before thresholding
 *   4. 1-bit black/white thresholding (configurable)
 *   5. Byte-aligned canvas width (multiple of 8)
 *   6. Sub-text rendered in black (not grey — grey vanishes after threshold)
 *   7. All coordinates integer-snapped for pixel-perfect output
 *
 * Usage:
 *   const canvas = await ThermalRenderer.render(layout, icons, customIcons, {
 *     printheadPixels: 96,
 *     printDirection: 'left',
 *     dpi: 203,
 *     threshold: 128,
 *   });
 */
class ThermalRenderer {

    /**
     * Render a label for thermal printing.
     *
     * @param {Object} layout         – LayoutResult from LabelLayout.compute()
     * @param {Object} icons          – Built-in icon map { key: path }
     * @param {Object} customIcons    – Custom icon map { key: dataURL }
     * @param {Object} [options]
     * @param {number} [options.printheadPixels=96]  – Printhead width in px
     * @param {string} [options.printDirection='left'] – 'left' or 'top'
     * @param {number} [options.dpi=203]             – Printer DPI
     * @param {number} [options.threshold=128]       – B/W threshold (0–255)
     * @returns {Promise<HTMLCanvasElement>}
     */
    static async render(layout, icons, customIcons, options = {}) {
        const {
            printheadPixels = 96,
            printDirection = 'left',
            dpi = 203,
            threshold = 128,
        } = options;

        const scale = dpi / 25.4;  // mm → px

        // ── Canvas dimensions ───────────────────────────────────────────
        // The axis perpendicular to feed direction must equal printheadPixels.
        let canvasW, canvasH;
        if (printDirection === 'left') {
            canvasH = printheadPixels;
            canvasW = Math.round(layout.width_mm * scale);
        } else {
            canvasW = printheadPixels;
            canvasH = Math.round(layout.height_mm * scale);
        }

        // Byte-align width (protocol packs 8 pixels per byte)
        canvasW = Math.ceil(canvasW / 8) * 8;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width  = canvasW;
        canvas.height = canvasH;

        // ── White background (required for thermal) ─────────────────────
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasW, canvasH);

        // ── Disable image smoothing for crisp icon edges ────────────────
        ctx.imageSmoothingEnabled = false;

        // ── Compute scale for this specific canvas ──────────────────────
        // The layout is in mm. We need to map mm → the actual canvas pixels.
        // For the feed direction, the axis is set by mm * (dpi/25.4).
        // For the cross-axis, it's clamped to printheadPixels, so the
        // effective scale on that axis may differ slightly.
        let scaleX, scaleY;
        if (printDirection === 'left') {
            scaleX = canvasW / layout.width_mm;
            scaleY = canvasH / layout.height_mm;
        } else {
            scaleX = canvasW / layout.width_mm;
            scaleY = canvasH / layout.height_mm;
        }

        // ── Icon ────────────────────────────────────────────────────────
        if (layout.icon) {
            const ix = Math.round(layout.icon.x * scaleX);
            const iy = Math.round(layout.icon.y * scaleY);
            // Icon is square in mm; use the smaller axis scale to keep aspect
            const iconScale = Math.min(scaleX, scaleY);
            const is = Math.round(layout.icon.size * iconScale);
            await CanvasRenderer._drawIcon(ctx, ix, iy, is, layout.icon.key, icons, customIcons);
        }

        // ── Main text ───────────────────────────────────────────────────
        const mainFontPx = Math.round(layout.mainText.fontSize_mm * scaleY);
        ctx.font      = `${layout.mainText.fontWeight} ${mainFontPx}px ${layout.mainText.fontFamily}`;
        ctx.fillStyle = 'black';  // Always black for thermal
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'top';

        for (const col of layout.mainText.columns) {
            ctx.fillText(col.text, Math.round(col.x * scaleX), Math.round(col.y * scaleY));
        }

        // ── Sub text (black, not grey) ──────────────────────────────────
        if (layout.hasSubText && layout.subText.columns.length > 0) {
            const subFontPx = Math.round(layout.subText.fontSize_mm * scaleY);
            ctx.font      = `${subFontPx}px ${layout.subText.fontFamily}`;
            ctx.fillStyle = 'black';  // Grey vanishes after threshold

            for (const col of layout.subText.columns) {
                ctx.fillText(col.text, Math.round(col.x * scaleX), Math.round(col.y * scaleY));
            }
        }

        // ── Alpha compositing + 1-bit threshold ────────────────────────
        ThermalRenderer._applyThreshold(ctx, canvasW, canvasH, threshold);

        return canvas;
    }

    /**
     * Threshold the canvas to 1-bit black/white for thermal printing.
     * Handles alpha compositing against white before thresholding.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width
     * @param {number} height
     * @param {number} thresholdVal – 0-255, pixels darker than this become black
     */
    static _applyThreshold(ctx, width, height, thresholdVal) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3] / 255;  // Normalise alpha to 0–1

            // Composite against white background
            // color_out = color_src * alpha + white * (1 - alpha)
            const rComp = r * a + 255 * (1 - a);
            const gComp = g * a + 255 * (1 - a);
            const bComp = b * a + 255 * (1 - a);

            // Rec. 601 luminance
            const gray = rComp * 0.299 + gComp * 0.587 + bComp * 0.114;

            // Threshold to pure black or white
            const bw = gray < thresholdVal ? 0 : 255;
            data[i]     = bw;
            data[i + 1] = bw;
            data[i + 2] = bw;
            data[i + 3] = 255;  // Fully opaque
        }

        ctx.putImageData(imageData, 0, 0);
    }
}
