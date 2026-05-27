/**
 * CanvasRenderer — Renders a label to an HTML Canvas element.
 *
 * Consumes a LayoutResult (mm coordinates) from LabelLayout.compute() and
 * draws to a Canvas at the requested DPI.  Used for PNG export and as the
 * base for ThermalRenderer.
 *
 * Usage:
 *   const canvas = await CanvasRenderer.render(layout, icons, customIcons, {
 *     dpi: 300,
 *     transparent: true,
 *     rotate: false,
 *   });
 */
class CanvasRenderer {

    /**
     * Render a label layout to a canvas.
     *
     * @param {Object} layout        – LayoutResult from LabelLayout.compute()
     * @param {Object} icons         – Built-in icon map { key: path }
     * @param {Object} customIcons   – Custom icon map { key: dataURL }
     * @param {Object} [options]
     * @param {number} [options.dpi=300]          – Target DPI
     * @param {boolean} [options.transparent=true] – Transparent background
     * @param {boolean} [options.rotate=false]     – Rotate 90°
     * @returns {Promise<HTMLCanvasElement>}
     */
    static async render(layout, icons, customIcons, options = {}) {
        const {
            dpi = 300,
            transparent = true,
            rotate = false,
        } = options;

        const scale = dpi / 25.4;  // mm → px

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width  = Math.round(layout.width_mm * scale);
        canvas.height = Math.round(layout.height_mm * scale);

        // Background
        if (!transparent) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // ── Icon ────────────────────────────────────────────────────────
        if (layout.icon) {
            const ix = Math.round(layout.icon.x * scale);
            const iy = Math.round(layout.icon.y * scale);
            const is = Math.round(layout.icon.size * scale);
            await CanvasRenderer._drawIcon(ctx, ix, iy, is, layout.icon.key, icons, customIcons);
        }

        // ── Main text ───────────────────────────────────────────────────
        const mainFontPx = Math.round(layout.mainText.fontSize_mm * scale);
        ctx.font      = `${layout.mainText.fontWeight} ${mainFontPx}px ${layout.mainText.fontFamily}`;
        ctx.fillStyle = layout.mainText.fill;
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'top';

        for (const col of layout.mainText.columns) {
            ctx.fillText(col.text, Math.round(col.x * scale), Math.round(col.y * scale));
        }

        // ── Sub text ────────────────────────────────────────────────────
        if (layout.hasSubText && layout.subText.columns.length > 0) {
            const subFontPx = Math.round(layout.subText.fontSize_mm * scale);
            ctx.font      = `${subFontPx}px ${layout.subText.fontFamily}`;
            ctx.fillStyle = layout.subText.fill;

            for (const col of layout.subText.columns) {
                ctx.fillText(col.text, Math.round(col.x * scale), Math.round(col.y * scale));
            }
        }

        // ── Rotation ────────────────────────────────────────────────────
        if (rotate) {
            return CanvasRenderer._rotateCanvas(canvas, 90);
        }

        return canvas;
    }

    // ── Icon drawing ────────────────────────────────────────────────────

    /**
     * Draw an icon onto a canvas context.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x     – px
     * @param {number} y     – px
     * @param {number} size  – px (square)
     * @param {string} iconKey
     * @param {Object} icons
     * @param {Object} customIcons
     */
    static _drawIcon(ctx, x, y, size, iconKey, icons, customIcons) {
        const iconPath = icons[iconKey] || customIcons[iconKey] || icons['heads_hex_socket'];

        return new Promise((resolve, reject) => {
            if (iconPath.endsWith('.svg')) {
                fetch(iconPath)
                    .then(response => response.text())
                    .then(svgText => {
                        const img = new Image();
                        const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
                        const url = URL.createObjectURL(svgBlob);

                        img.onload = () => {
                            try {
                                ctx.drawImage(img, x, y, size, size);
                                URL.revokeObjectURL(url);
                                resolve();
                            } catch (error) {
                                URL.revokeObjectURL(url);
                                reject(error);
                            }
                        };
                        img.onerror = (error) => {
                            URL.revokeObjectURL(url);
                            console.error('Failed to load SVG icon:', iconPath, error);
                            reject(error);
                        };
                        img.src = url;
                    })
                    .catch(error => {
                        console.error('Failed to fetch SVG:', iconPath, error);
                        reject(error);
                    });
            } else {
                const img = new Image();
                img.onload = () => {
                    try {
                        ctx.drawImage(img, x, y, size, size);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };
                img.onerror = (error) => {
                    console.error('Failed to load icon:', iconPath, error);
                    reject(error);
                };
                img.src = iconPath;
            }
        });
    }

    // ── Canvas rotation ─────────────────────────────────────────────────

    /**
     * Rotate a canvas by the given degrees (only 90° supported).
     *
     * @param {HTMLCanvasElement} canvas
     * @param {number} degrees
     * @returns {HTMLCanvasElement}
     */
    static _rotateCanvas(canvas, degrees) {
        const rotated = document.createElement('canvas');
        const rctx = rotated.getContext('2d');

        if (degrees === 90) {
            rotated.width  = canvas.height;
            rotated.height = canvas.width;
            rctx.translate(canvas.height, 0);
            rctx.rotate(Math.PI / 2);
        }

        rctx.drawImage(canvas, 0, 0);
        return rotated;
    }
}
