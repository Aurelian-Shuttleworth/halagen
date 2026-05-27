/**
 * SvgRenderer — Generates SVG strings from LabelLayout results.
 *
 * Consumes a LayoutResult from LabelLayout.compute() where all coordinates
 * are in millimetres.  Outputs a valid SVG string with physical dimensions
 * (mm) on the root element and a pixel viewBox at 96 PPI (Inkscape standard).
 *
 * Usage:
 *   const layout = LabelLayout.compute({ ... });
 *   const svg = await SvgRenderer.render(layout, icons, customIcons, { rotate: false });
 *
 * This file is a vanilla JS <script> — no ES modules, no imports.
 */
class SvgRenderer {

    // ── Constants ────────────────────────────────────────────────────────
    /** SVG standard PPI (matches Inkscape / CSS reference pixel) */
    static SVG_PPI = 96;
    /** Conversion factor: millimetres → pixels at 96 PPI */
    static MM_TO_PX = 96 / 25.4;

    // ── Public API ──────────────────────────────────────────────────────

    /**
     * Render a LayoutResult to an SVG string.
     *
     * @param {Object}  layout      – LayoutResult from LabelLayout.compute()
     * @param {Object}  icons       – Map of iconKey → file path (built-in)
     * @param {Object}  customIcons – Map of iconKey → file path (user-uploaded)
     * @param {Object}  [options]
     * @param {boolean} [options.rotate=false] – Rotate label 90° clockwise
     * @returns {Promise<string>} Complete SVG document string
     */
    static async render(layout, icons, customIcons, options = {}) {
        const { rotate = false } = options;
        const S = SvgRenderer.MM_TO_PX;

        // ── Canvas dimensions ───────────────────────────────────────────
        const origW_mm = layout.width_mm;
        const origH_mm = layout.height_mm;

        // When rotated, swap the outer SVG canvas dimensions
        const canvasW_mm = rotate ? origH_mm : origW_mm;
        const canvasH_mm = rotate ? origW_mm : origH_mm;
        const viewBoxW   = canvasW_mm * S;
        const viewBoxH   = canvasH_mm * S;

        let svg = '';

        // ── SVG root ────────────────────────────────────────────────────
        svg += `<svg width="${canvasW_mm}mm" height="${canvasH_mm}mm"`;
        svg += ` viewBox="0 0 ${viewBoxW} ${viewBoxH}"`;
        svg += ` xmlns="http://www.w3.org/2000/svg"`;
        svg += ` xmlns:xlink="http://www.w3.org/1999/xlink">`;

        // ── Metadata (DPI info for design software) ─────────────────────
        svg += `\n  <metadata>`;
        svg += `\n    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">`;
        svg += `\n      <rdf:Description>`;
        svg += `\n        <dpi>${SvgRenderer.SVG_PPI}</dpi>`;
        svg += `\n        <print-dpi>${SvgRenderer.SVG_PPI}</print-dpi>`;
        svg += `\n      </rdf:Description>`;
        svg += `\n    </rdf:RDF>`;
        svg += `\n  </metadata>`;

        // ── Rotation wrapper ────────────────────────────────────────────
        if (rotate) {
            const origVBW = origW_mm * S;
            const origVBH = origH_mm * S;
            const cx = origVBW / 2;
            const cy = origVBH / 2;
            const tx = (viewBoxW - origVBW) / 2;
            const ty = (viewBoxH - origVBH) / 2;
            svg += `\n  <g transform="translate(${tx + cx}, ${ty + cy}) rotate(90) translate(${-cx}, ${-cy})">`;
        }

        // ── Background rect (near-transparent, for easier selection) ────
        const bgW = origW_mm * S;
        const bgH = origH_mm * S;
        svg += `\n  <rect x="0" y="0" width="${bgW}" height="${bgH}" fill="white" fill-opacity="0.01" stroke="none"/>`;

        // ── Icon ────────────────────────────────────────────────────────
        if (layout.icon) {
            svg += await SvgRenderer._renderIcon(layout.icon, icons, customIcons);
        }

        // ── Main text columns ───────────────────────────────────────────
        const mt = layout.mainText;
        const mainFontPx = mt.fontSize_mm * S;

        for (const col of mt.columns) {
            const xPx = col.x * S;
            const yPx = col.y * S;
            svg += `\n  <text x="${xPx}" y="${yPx}"`;
            svg += ` font-family=${SvgRenderer._quoteAttr(mt.fontFamily)}`;
            svg += ` font-size="${mainFontPx}px"`;
            svg += ` font-weight="${mt.fontWeight}"`;
            svg += ` fill="${mt.fill}"`;
            svg += ` dominant-baseline="hanging"`;
            svg += `>${SvgRenderer._escapeXml(col.text)}</text>`;
        }

        // ── Sub text columns ────────────────────────────────────────────
        const st = layout.subText;
        if (st.columns.length > 0) {
            const subFontPx = st.fontSize_mm * S;

            for (const col of st.columns) {
                const xPx = col.x * S;
                const yPx = col.y * S;
                svg += `\n  <text x="${xPx}" y="${yPx}"`;
                svg += ` font-family=${SvgRenderer._quoteAttr(st.fontFamily)}`;
                svg += ` font-size="${subFontPx}px"`;
                svg += ` fill="${st.fill}"`;
                svg += ` dominant-baseline="hanging"`;
                svg += `>${SvgRenderer._escapeXml(col.text)}</text>`;
            }
        }

        // ── Close rotation wrapper ──────────────────────────────────────
        if (rotate) {
            svg += `\n  </g>`;
        }

        svg += `\n</svg>`;
        return svg;
    }

    // ── Private helpers ─────────────────────────────────────────────────

    /**
     * Render an icon element (SVG embed or PNG image).
     *
     * @param {Object} icon         – { x, y, size, key } from LayoutResult (mm)
     * @param {Object} icons        – Built-in icon paths
     * @param {Object} customIcons  – User-uploaded icon paths
     * @returns {Promise<string>} SVG fragment
     */
    static async _renderIcon(icon, icons, customIcons) {
        const S = SvgRenderer.MM_TO_PX;
        const xPx    = icon.x * S;
        const yPx    = icon.y * S;
        const sizePx = icon.size * S;

        const iconPath = icons[icon.key]
            || (customIcons && customIcons[icon.key])
            || icons['heads_hex_socket']
            || '';

        if (!iconPath) {
            return '';
        }

        if (iconPath.endsWith('.svg')) {
            return await SvgRenderer._embedSvgIcon(iconPath, xPx, yPx, sizePx);
        }

        // PNG / raster fallback
        return `\n  <image x="${xPx}" y="${yPx}" width="${sizePx}" height="${sizePx}" href="${SvgRenderer._escapeXml(iconPath)}"/>`;
    }

    /**
     * Fetch an SVG icon, extract its inner content, and return a
     * positioned + scaled <g> element.
     *
     * @param {string} path   – URL / relative path to the SVG file
     * @param {number} xPx    – Target x in px
     * @param {number} yPx    – Target y in px
     * @param {number} sizePx – Target square size in px
     * @returns {Promise<string>} SVG fragment
     */
    static async _embedSvgIcon(path, xPx, yPx, sizePx) {
        try {
            const response = await fetch(path);
            const svgText  = await response.text();
            const parser   = new DOMParser();
            const doc      = parser.parseFromString(svgText, 'image/svg+xml');
            const root     = doc.documentElement;

            // Determine original icon dimensions from viewBox or attributes
            let origW = 100;
            let origH = 100;

            const viewBox = root.getAttribute('viewBox');
            if (viewBox) {
                const parts = viewBox.split(/[\s,]+/);
                if (parts.length === 4) {
                    origW = parseFloat(parts[2]);
                    origH = parseFloat(parts[3]);
                }
            } else {
                const wAttr = root.getAttribute('width');
                const hAttr = root.getAttribute('height');
                if (wAttr) origW = parseFloat(wAttr.replace(/[^\d.]/g, '')) || 100;
                if (hAttr) origH = parseFloat(hAttr.replace(/[^\d.]/g, '')) || 100;
            }

            // Uniform scale to fit in the target square
            const scale = sizePx / Math.max(origW, origH);

            const innerContent = root.innerHTML;

            let frag = '';
            frag += `\n  <g transform="translate(${xPx},${yPx}) scale(${scale})">`;
            frag += innerContent;
            frag += `\n  </g>`;
            return frag;
        } catch (err) {
            console.error('SvgRenderer: failed to embed SVG icon:', path, err);
            return '';
        }
    }

    /**
     * Escape special XML characters in text content.
     *
     * @param {string} str
     * @returns {string}
     */
    static _escapeXml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Quote an attribute value that may itself contain quotes.
     * Uses double-quote wrapping after escaping internal double-quotes.
     *
     * @param {string} value
     * @returns {string} e.g. `"'Helvetica Neue', Arial, sans-serif"`
     */
    static _quoteAttr(value) {
        return `"${String(value).replace(/"/g, '&quot;')}"`;
    }
}
