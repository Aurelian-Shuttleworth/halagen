# halagen (hardware label generator)

> **This is a vibe-coded fork** of [timmmmmmmmm/halagen](https://github.com/timmmmmmmmm/halagen) with added support for **direct printing to Niimbot Bluetooth printers**, SVG export, label size presets, and connection hardening for macOS.

Visit [aurelian-shuttleworth.github.io/halagen](https://aurelian-shuttleworth.github.io/halagen) to use the tool directly in your browser.

<div align="center">
  <a href="https://aurelian-shuttleworth.github.io/halagen">
    <img src="img/screenshot_halagen.png" alt="halagen Interface" width="570px">
  </a>
</div>

## Features

- **No backend required** — Works entirely in your browser, no install needed
- **Direct printing** — Print labels straight to Niimbot printers via Bluetooth or USB
- **Label size presets** — Auto-detected per printer model on connection
- **Customizable labels** — Set custom height (9–50mm) and width (20–100mm)
- **Custom icon loading** — Upload your own icons or use the built-in collection
- **Real-time preview** — See your label at actual size before exporting or printing
- **Multi-column support** — Create labels with multiple columns for sectioned containers
- **YAML batch processor** — Generate multiple labels at once using YAML input
- **PNG & SVG export** — Download labels as high-quality PNG or scalable SVG files
- **AI/LLM friendly** — YAML format designed for AI-assisted label generation

## Direct Printing

This fork adds direct printing to Niimbot thermal label printers, powered by [NiimBlueLib](https://github.com/MultiMote/niimbluelib).

### Supported Printers

| Model | Print Direction | Printhead |
|:------|:---------------|:----------|
| D110 / D110M / D11 | Left | 96 px (203 DPI) |
| D11 (old) | Left | 96 px (203 DPI) |
| B21 | Left | 384 px (203 DPI) |
| B1 / B21 Pro / B2 Pro | Top | 384 px (203 DPI) |

### Connection Modes

- **Bluetooth** — Web Bluetooth API (wireless)
- **USB Serial** — Web Serial API (wired, more reliable on macOS)

### Browser Requirements

- **Chrome** or **Edge** (v89+) — required for Web Bluetooth and Web Serial APIs
- **HTTPS** or **localhost** — Web Bluetooth requires a secure context

### Label Size Presets

When you connect a printer, a label size dropdown appears with common roll sizes for that model (e.g. 15×30mm, 12×40mm for the D110). Selecting a preset automatically updates the label dimensions and refreshes the preview. Your last-used preset is remembered across sessions.

### macOS Notes

Bluetooth connections on macOS can be unreliable. The app includes:
- **Connection timeout** (15s) to prevent indefinite hangs
- **Reconnect button** on unexpected disconnects, with automatic retry after the first manual reconnect
- **Exponential backoff** (2s → 4s → 8s → 16s) for reconnection attempts

If Bluetooth fails, try: System Settings → Bluetooth → "Forget" the printer, then reconnect. USB Serial is generally more reliable on macOS.

## Example Output

Here are some examples of labels generated with halagen:
<div align="center">
<table>
  <tr>
    <td><img src="img/label-M3.png" alt="M3 Label" width="200px"></td>
    <td><img src="img/label-M3_heat_insert.png" alt="M3 Heat Insert" width="200px"></td>
    <td><img src="img/label-M4.png" alt="M4 Label" width="200px"></td>
  </tr>
  <tr>
    <td><img src="img/label-M6.png" alt="M6 Label" width="200px"></td>
    <td><img src="img/label-TX20_screws.png" alt="TX20 Screws" width="200px"></td>
    <td><img src="img/label-Wago_221.png" alt="Wago 221" width="200px"></td>
  </tr>
</table>
</div>

## Multi-column Labels

halagen supports multi-column labels for when your storage containers have multiple sections. This feature allows you to create a single label that covers multiple compartments, with each column representing a different section of your container. Simply specify the number of columns needed and fill in the content for each section.

## YAML Batch Processor

halagen includes a powerful YAML batch processor that allows you to generate multiple labels simultaneously. This feature is particularly useful when you need to create many labels at once.

**AI/LLM Integration**: The YAML format is designed to work seamlessly with AI assistants and Large Language Models (LLMs). Simply take for example a screenshot of your hardware shopping basket or current organizer, and ask an AI to generate the YAML configuration for all the parts it can identify. This makes organizing large quantities of hardware components incredibly efficient.

<div align="center">
<img src="img/screenshot_batch_yaml.png" alt="YAML Batch Processor" width="570px">
</div>

Example YAML format:
```yaml
# Global settings (optional)
width_mm: 50
height_mm: 12
png_dpi: 300

labels:
  - title: "M4 × 12"
    subtext: "DIN 7984"
    icon: "heads_hex_socket"
    rotate: false
  - title: "M6 × 20"
    subtext: "Hex Bolt"
    icon: "fasteners_screw_hex"
    width_mm: 45
    height_mm: 18
```

## Architecture

This is a static site — no build step, no npm, pure vanilla JS.

```
halagen/
├── index.html              # Main page
├── LabelLayout.js          # Layout engine (mm-based coordinates)
├── renderers/
│   ├── CanvasRenderer.js   # PNG export (Canvas 2D)
│   ├── SvgRenderer.js      # SVG export
│   └── ThermalRenderer.js  # Niimbot thermal printing
├── script.js               # UI, events, printer communication
├── styles-bootstrap.css    # Styling
├── icons/                  # Built-in icon library
└── lib/                    # Vendored dependencies (JSZip, CodeMirror, js-yaml)
```

All rendering paths share a single `LabelLayout.compute()` engine that produces mm-based coordinates, which each renderer then maps to its target (pixels at arbitrary DPI, SVG viewBox, or thermal bitmap).

## Upstream Contribution

> **Note**: This fork has not submitted a merge request to the original repository. The changes were developed through vibe coding and have not been through a formal code review process. I welcome a request from the original maintainer to create a proper MR to merge these features into the original project.
>
> Original project: [timmmmmmmmm/halagen](https://github.com/timmmmmmmmm/halagen)

## License

This project is open source and available under the [MIT License](LICENSE).

## Icon Attribution

Some of the icons in the current icon set are based on designs by **Joe Jankowiak**, available at: https://www.printables.com/model/621771-gridfinity-bin-label-icons

Used under the Creative Commons Attribution 4.0 International License (CC BY 4.0).
https://creativecommons.org/licenses/by/4.0/