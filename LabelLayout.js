/**
 * LabelLayout — Single source of truth for label layout computation.
 *
 * All coordinates are in millimetres. Renderers convert to pixels at render
 * time using their target DPI.  This class has NO side-effects, NO DOM access,
 * and is safe to call from any context (UI thread, worker, tests).
 *
 * Usage:
 *   const layout = LabelLayout.compute({
 *     width_mm: 50,
 *     height_mm: 12,
 *     iconKey: 'heads_hex_socket',
 *     mainTexts: ['M3', 'M3'],
 *     subTexts: ['8 mm', '10 mm'],
 *   });
 */
class LabelLayout {

    // ── Constants ────────────────────────────────────────────────────────
    /** Margin around the label content (mm) */
    static MARGIN_MM  = 1;
    /** Gap between icon right edge and text area (mm) */
    static ICON_TEXT_GAP_MM = 2;
    /** Right-side padding for text area (mm) */
    static TEXT_RIGHT_PAD_MM = 1;
    /** Font family used across all renderers */
    static FONT_FAMILY = "'Helvetica Neue', Arial, sans-serif";
    /** Main-to-sub font size ratio */
    static SUB_FONT_RATIO = 0.75;
    /** Minimum font size in mm */
    static MIN_FONT_SIZE_MM = 2.5;

    // ── Public API ──────────────────────────────────────────────────────

    /**
     * Compute the full label layout from a descriptor.
     *
     * @param {Object} descriptor
     * @param {number} descriptor.width_mm      – Label width in mm
     * @param {number} descriptor.height_mm     – Label height in mm
     * @param {string|null} descriptor.iconKey  – Icon identifier (null = no icon)
     * @param {string[]} descriptor.mainTexts   – Main text column values
     * @param {string[]} descriptor.subTexts    – Sub text column values
     * @returns {Object} LayoutResult with all positions in mm
     */
    static compute(descriptor) {
        const {
            width_mm,
            height_mm,
            iconKey = null,
            mainTexts = [],
            subTexts = [],
        } = descriptor;

        const M  = LabelLayout.MARGIN_MM;
        const G  = LabelLayout.ICON_TEXT_GAP_MM;
        const PR = LabelLayout.TEXT_RIGHT_PAD_MM;

        // ── Icon ────────────────────────────────────────────────────────
        const hasIcon = iconKey != null && iconKey !== '';
        const iconSize = hasIcon ? height_mm - (2 * M) : 0;
        const icon = hasIcon
            ? { x: M, y: M, size: iconSize, key: iconKey }
            : null;

        // ── Text area bounds ────────────────────────────────────────────
        const textAreaX = hasIcon ? M + iconSize + G : M;
        const textAreaWidth = width_mm - textAreaX - PR;

        // ── Font sizing (continuous formula) ────────────────────────────
        const mainFontSize = LabelLayout.fontSizeForHeight(height_mm);
        const subFontSize  = mainFontSize * LabelLayout.SUB_FONT_RATIO;

        // ── Vertical positioning ────────────────────────────────────────
        // When sub-text is present: main text sits higher, sub-text below.
        // When no sub-text: main text is vertically centred.
        const hasSubText = subTexts.length > 0 && subTexts.some(t => t.trim());
        const contentHeight = hasIcon ? iconSize : (height_mm - 2 * M);

        let mainTextY, subTextY;
        if (hasSubText) {
            // Main text at ~20% from top of content area
            mainTextY = M + (contentHeight * 0.2);
            // Sub text below main text with spacing
            subTextY = mainTextY + (mainFontSize * 1.2);
        } else {
            // Centre the main text vertically
            mainTextY = M + (contentHeight * 0.4);
            subTextY = null;
        }

        // ── Column positions ────────────────────────────────────────────
        const effectiveMainTexts = mainTexts.length > 0 ? mainTexts : [''];
        const mainColumns = effectiveMainTexts.map((text, i) => ({
            text,
            x: textAreaX + (i * (textAreaWidth / effectiveMainTexts.length)),
            y: mainTextY,
        }));

        let subColumns = [];
        if (hasSubText) {
            subColumns = subTexts.map((text, i) => ({
                text,
                x: textAreaX + (i * (textAreaWidth / subTexts.length)),
                y: subTextY,
            }));
        }

        // ── Assemble result ─────────────────────────────────────────────
        return {
            width_mm,
            height_mm,

            icon,

            mainText: {
                fontSize_mm: mainFontSize,
                fontWeight: 'bold',
                fontFamily: LabelLayout.FONT_FAMILY,
                fill: 'black',
                columns: mainColumns,
            },

            subText: {
                fontSize_mm: subFontSize,
                fontFamily: LabelLayout.FONT_FAMILY,
                fill: '#666',
                columns: subColumns,
            },

            // Convenience accessors for renderers
            textAreaX_mm: textAreaX,
            textAreaWidth_mm: textAreaWidth,
            hasIcon,
            hasSubText,
        };
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    /**
     * Continuous font-size formula (mm) for a given label height (mm).
     *
     * Replaces the old discrete switch-table (9→3, 12→4, 18→6.5, 24→8)
     * with a linear function that handles arbitrary custom heights.
     *
     * The formula is calibrated to produce values close to the old table:
     *   height  9 → ~3.0mm   (old: 3)
     *   height 12 → ~4.0mm   (old: 4)
     *   height 18 → ~5.9mm   (old: 6.5)
     *   height 24 → ~7.9mm   (old: 8)
     *
     * @param {number} height_mm
     * @returns {number} Font size in mm
     */
    static fontSizeForHeight(height_mm) {
        // Linear: fontSize = 0.33 * height, clamped to a minimum
        const size = height_mm * 0.33;
        return Math.max(LabelLayout.MIN_FONT_SIZE_MM, size);
    }
}
