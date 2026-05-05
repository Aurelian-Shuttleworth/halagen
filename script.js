class LabelMaker {
    constructor() {
        this.icons = this.loadIconsFromStructure();
        
        this.customIcons = this.loadCustomIcons();
        this.initializeEventListeners();
        this.initializeDefaultColumns();
        this.updatePreview();
        this.initializeTabs();
        this.loadAvailableIcons();
        this.initializeYamlEditor();
        this.initializeIconPicker();
        this.initializeIconUpload();
        this.loadDPISettings();
        this.initializePrinter();
    }

    loadIconsFromStructure() {
        const iconMapping = {
            'electronics': {
                'wago-logo': 'Wago Logo',
                'wago-alt1': 'Wago Alt 1', 
                'wago-alt2': 'Wago Alt 2',
                'wire-nut': 'Wire Nut',
                'generic': 'Generic Electrical'
            },
            'heads': {
                'cross': 'Cross Head',
                'hex-external': 'Hex External',
                'hex-socket': 'Hex Socket',
                'phillips': 'Phillips Head',
                'pozidriv': 'Pozidriv',
                'robertson': 'Robertson Head',
                'slotted': 'Slotted Head',
                'square-external': 'Square External',
                'ta': 'TA Head',
                'torx': 'Torx Head',
                'torx-tamperproof': 'Torx Tamperproof'
            },
            'inserts': {
                'heat': 'Heat Insert',
                'wood': 'Wood Insert'
            },
            'nuts': {
                'nut-cap': 'Cap Nut',
                'nut-lock': 'Lock Nut',
                'nut-standard': 'Standard Nut'
            },
            'fasteners': {
                'screw-round': 'Round Screw',
                'screw-tbolt': 'T-Bolt',
                'screw-truss': 'Truss Screw',
                'screw-truss-modified': 'Truss Modified',
                'screw-wafer': 'Wafer Screw',
                'screw-bugle': 'Bugle Screw',
                'screw-fillister': 'Fillister Screw',
                'screw-flat': 'Flat Screw',
                'screw-hex': 'Hex Screw',
                'screw-oval': 'Oval Screw',
                'screw-pan': 'Pan Screw',
                'screw-pan-hex': 'Pan Hex Screw',
                'screw-thumb-knurled': 'Thumb Knurled',
                'screw-trim': 'Trim Screw',
                'thumb-screw': 'Thumb Screw'
            },
            'washers': {
                'fender': 'Fender Washer',
                'flat': 'Flat Washer',
                'split': 'Split Washer',
                'star-exterior': 'Star Exterior',
                'star-interior': 'Star Interior'
            }
        };

        const icons = {};
        const availableIcons = [];

        Object.entries(iconMapping).forEach(([category, items]) => {
            Object.entries(items).forEach(([filename, displayName]) => {
                const iconKey = `${category}_${filename}`.replace(/-/g, '_');
                // Determine file extension based on category - heads use SVG, others use PNG
                const extension = category === 'heads' ? 'svg' : 'png';
                // For heads, convert filename to match actual file structure
                let actualFilename = filename;
                if (category === 'heads') {
                    actualFilename = `Screw_Head_-_${filename.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join('_')}`;
                }
                const iconPath = `icons/${category}/${actualFilename}.${extension}`;
                icons[iconKey] = iconPath;
                availableIcons.push(iconKey);
            });
        });

        this.availableIcons = availableIcons;
        return icons;
    }

    setupEditableTextHandlers(element) {
        const resetScroll = () => {
            element.scrollLeft = 0;
            // Force selection to start if text is focused
            if (document.activeElement === element) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    if (range.endOffset > element.textContent.length || element.scrollLeft > 0) {
                        element.scrollLeft = 0;
                    }
                }
            }
        };

        element.addEventListener('input', () => {
            this.syncEditableTextToInputs();
            // Force scroll to beginning to show start of text
            setTimeout(resetScroll, 0);
        });
        
        element.addEventListener('blur', () => {
            this.syncEditableTextToInputs();
            resetScroll();
        });

        element.addEventListener('focus', () => {
            resetScroll();
        });

        element.addEventListener('keyup', () => {
            resetScroll();
        });
    }

    initializeEventListeners() {
        // Basic form elements
        const iconSelect = document.getElementById('icon-select');
        const labelHeight = document.getElementById('label-height');
        const labelWidth = document.getElementById('label-width');
        const downloadPng = document.getElementById('download-png');
        const validateYaml = document.getElementById('validate-yaml');
        const generateZip = document.getElementById('generate-zip');

        if (iconSelect) iconSelect.addEventListener('change', () => {
            this.updatePreview();
            this.syncSingleToYaml();
        });
        if (labelHeight) labelHeight.addEventListener('change', () => {
            this.updatePreview();
            this.syncSingleToYaml();
        });
        if (labelWidth) labelWidth.addEventListener('input', () => {
            this.updatePreview();
            this.syncSingleToYaml();
        });
        if (downloadPng) downloadPng.addEventListener('click', () => this.downloadPNG());

        // Dimension arrow controls
        this.initializeDimensionArrows();

        // DPI preset buttons
        document.querySelectorAll('[data-dpi]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dpi = e.target.dataset.dpi;
                document.getElementById('png-dpi').value = dpi;
            });
        });

        const downloadSvg = document.getElementById('download-svg');
        if (downloadSvg) downloadSvg.addEventListener('click', () => this.downloadSVG());
        if (validateYaml) validateYaml.addEventListener('click', () => this.validateYAML());
        if (generateZip) generateZip.addEventListener('click', () => this.generateZIP());

        // WYSIWYG preview interactions
        this.setupPreviewInteractions();

        // Initial setup for text inputs
        this.setupMainTextInputs();
        this.setupSubTextInputs();
    }

    initializeDimensionArrows() {
        // Width arrows (horizontal)
        const widthArrows = document.querySelectorAll('.width-control .dimension-arrow');
        const widthInput = document.getElementById('label-width');
        
        if (widthArrows.length >= 2 && widthInput) {
            const leftArrow = widthArrows[0]; // ←
            const rightArrow = widthArrows[1]; // →
            
            leftArrow.addEventListener('click', () => {
                const currentValue = parseInt(widthInput.value);
                const minValue = parseInt(widthInput.min);
                if (currentValue > minValue) {
                    widthInput.value = currentValue - 1;
                    widthInput.dispatchEvent(new Event('input'));
                }
            });
            
            rightArrow.addEventListener('click', () => {
                const currentValue = parseInt(widthInput.value);
                const maxValue = parseInt(widthInput.max);
                if (currentValue < maxValue) {
                    widthInput.value = currentValue + 1;
                    widthInput.dispatchEvent(new Event('input'));
                }
            });
        }
        
        // Height arrows (vertical)
        const heightArrows = document.querySelectorAll('.height-control .dimension-arrow');
        const heightInput = document.getElementById('label-height');
        
        if (heightArrows.length >= 2 && heightInput) {
            const upArrow = heightArrows[0]; // ↑
            const downArrow = heightArrows[1]; // ↓
            
            upArrow.addEventListener('click', () => {
                const currentValue = parseInt(heightInput.value);
                const maxValue = parseInt(heightInput.max);
                if (currentValue < maxValue) {
                    heightInput.value = currentValue + 1;
                    heightInput.dispatchEvent(new Event('change'));
                }
            });
            
            downArrow.addEventListener('click', () => {
                const currentValue = parseInt(heightInput.value);
                const minValue = parseInt(heightInput.min);
                if (currentValue > minValue) {
                    heightInput.value = currentValue - 1;
                    heightInput.dispatchEvent(new Event('change'));
                }
            });
        }
    }

    setupPreviewInteractions() {
        // Add click handler to existing overlay
        const overlay = document.querySelector('.icon-picker-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeIconPicker();
            });
        }

        // Click handler for preview icon to open icon picker
        const previewIcon = document.querySelector('.clickable-icon');
        if (previewIcon) {
            previewIcon.addEventListener('click', () => {
                this.openIconPicker();
            });
        }

        // Content editable text change handlers
        document.querySelectorAll('.editable-text').forEach(element => {
            this.setupEditableTextHandlers(element);
        });


        // Column control buttons in form
        document.querySelectorAll('.column-btn, .column-btn-small').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const type = e.target.dataset.type;
                this.updateColumn(type, action);
            });
        });
    }

    syncEditableTextToInputs() {
        // Sync main text
        const mainTextColumns = document.querySelectorAll('.main-text-column');
        const mainTextInputs = document.querySelectorAll('.main-text-input');

        mainTextColumns.forEach((column, index) => {
            if (mainTextInputs[index]) {
                mainTextInputs[index].value = column.textContent.trim();
            }
        });

        // Sync sub text
        const subTextColumns = document.querySelectorAll('.sub-text-column');
        const subTextInputs = document.querySelectorAll('.sub-text-input');

        subTextColumns.forEach((column, index) => {
            if (subTextInputs[index]) {
                subTextInputs[index].value = column.textContent.trim();
            }
        });

        // Sync to YAML
        this.syncSingleToYaml();
    }

    syncSingleToYaml() {
        // Only sync if YAML editor is initialized
        if (!this.yamlEditor) {
            return;
        }

        // Get current state from single tab
        const iconSelect = document.getElementById('icon-select').value;
        const width = parseInt(document.getElementById('label-width').value);
        const height = parseInt(document.getElementById('label-height').value);

        const mainTextInputs = document.querySelectorAll('.main-text-input');
        const mainTexts = Array.from(mainTextInputs).map(input => input.value.trim()).filter(text => text);

        const subTextInputs = document.querySelectorAll('.sub-text-input');
        const subTexts = Array.from(subTextInputs).map(input => input.value.trim()).filter(text => text);

        // Generate YAML for the current label
        let yamlContent = `# Hardware Label Generator - Current Label from Single Tab
# This YAML is auto-synced with the Single tab
# Available icons: ${this.availableIcons.join(', ')}

# Global settings (optional)
long_png: true        # Generate one continuous PNG strip of all labels
cut_marks: true       # Add cut marks between labels for easy trimming
export_svg: true      # Also generate SVG files (vector format, scalable)
png_dpi: 300          # PNG export resolution in dots per inch (50-1200)

labels:
  - icon: "${iconSelect}"
    width_mm: ${width}
    height_mm: ${height}`;

        // Add main text columns
        if (mainTexts.length > 0) {
            yamlContent += `\n    maintext_columns:`;
            mainTexts.forEach(text => {
                yamlContent += `\n      - "${text}"`;
            });
        }

        // Add sub text columns
        if (subTexts.length > 0) {
            yamlContent += `\n    subtext_columns:`;
            subTexts.forEach(text => {
                yamlContent += `\n      - "${text}"`;
            });
        }

        yamlContent += `\n    rotate: false

# You can add more labels below by copying the format above
# Example:
# - icon: "heads_phillips"
#   width_mm: 50
#   height_mm: 12
#   maintext_columns:
#     - "M4"
#     - "M4"
#   subtext_columns:
#     - "16 mm"
#     - "20 mm"
#   rotate: false
`;

        // Update the YAML editor
        this.yamlEditor.setValue(yamlContent);
    }


    addHiddenInput(isMain, value = '') {
        const container = document.getElementById(isMain ? 'main-text-inputs' : 'sub-text-inputs');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = isMain ? 'main-text-input' : 'sub-text-input';
        input.value = value;
        input.addEventListener('input', () => this.updatePreview());
        container.appendChild(input);
    }

    removeHiddenInput(isMain) {
        const container = document.getElementById(isMain ? 'main-text-inputs' : 'sub-text-inputs');
        const inputs = container.querySelectorAll(isMain ? '.main-text-input' : '.sub-text-input');
        if (inputs.length > 1) {
            const lastInput = inputs[inputs.length - 1];
            lastInput.remove();
        }
    }

    initializeDefaultColumns() {
        // Set up event listeners for all pre-existing input fields
        document.querySelectorAll('.main-text-input').forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
        });
        
        document.querySelectorAll('.sub-text-input').forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
        });
    }

    updateColumn(type, action) {
        const isMain = type === 'main';
        const container = document.getElementById(isMain ? 'main-text-inputs' : 'sub-text-inputs');
        const inputClass = isMain ? 'main-text-input' : 'sub-text-input';

        let currentCount = container.querySelectorAll(`.${inputClass}`).length;

        if (action === 'add' && currentCount < 8) {
            currentCount++;
        } else if (action === 'remove' && currentCount > 1) {
            currentCount--;
        }

        this.updateTextInputs(container, inputClass, currentCount, isMain);
        this.updateColumnDisplay(type, currentCount);
        this.updatePreviewFromInputs();
        this.syncSingleToYaml();
    }

    updateColumnDisplay(type, count) {
        const countElement = document.getElementById(type === 'main' ? 'main-column-count' : 'sub-column-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    updatePreviewFromInputs() {
        // Update the preview based on hidden inputs, then sync to editable elements
        const mainInputs = document.querySelectorAll('.main-text-input');
        const subInputs = document.querySelectorAll('.sub-text-input');
        
        // Update main text columns
        const mainContainer = document.querySelector('.main-text');
        mainContainer.innerHTML = '';
        Array.from(mainInputs).forEach((input, index) => {
            const column = document.createElement('div');
            column.className = 'main-text-column editable-text';
            column.contentEditable = true;
            column.textContent = input.value.trim() || `New ${index + 1}`;
            
            this.setupEditableTextHandlers(column);
            
            mainContainer.appendChild(column);
        });
        
        // Update sub text columns
        const subContainer = document.querySelector('.sub-text');
        subContainer.innerHTML = '';
        Array.from(subInputs).forEach((input, index) => {
            const column = document.createElement('div');
            column.className = 'sub-text-column editable-text';
            column.contentEditable = true;
            column.textContent = input.value.trim() || `Sub ${index + 1}`;
            
            this.setupEditableTextHandlers(column);
            
            subContainer.appendChild(column);
        });
        
        // Update other preview elements
        this.updatePreview();
        
    }

    updateTextInputs(container, inputClass, columnCount, isMain) {
        const currentInputs = container.querySelectorAll(`.${inputClass}`);
        const currentValues = Array.from(currentInputs).map(input => input.value);

        // Clear existing inputs
        container.innerHTML = '';

        // Create new inputs
        for (let i = 0; i < columnCount; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = inputClass;
            input.placeholder = isMain ? `Column ${i + 1}` : `Sub Column ${i + 1}`;
            input.value = currentValues[i] || '';
            input.addEventListener('input', () => this.updatePreview());
            container.appendChild(input);
        }
    }

    setupMainTextInputs() {
        // Add event listeners to existing inputs
        document.querySelectorAll('.main-text-input').forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
        });
    }
    
    setupSubTextInputs() {
        // Add event listeners to existing inputs
        document.querySelectorAll('.sub-text-input').forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
        });
    }

    updatePreview() {
        const iconSelect = document.getElementById('icon-select').value;
        const height = document.getElementById('label-height').value;
        const width = document.getElementById('label-width').value;

        const labelPreview = document.getElementById('header-label-preview');
        const iconContainer = labelPreview.querySelector('.label-icon img');

        // Get icon path from either built-in icons or custom icons
        const iconPath = this.icons[iconSelect] || this.customIcons[iconSelect] || this.icons['heads_hex_socket'];
        if (iconContainer) {
            iconContainer.src = iconPath;
            iconContainer.alt = iconSelect;
        }

        labelPreview.setAttribute('data-height', height);
        labelPreview.style.width = `${width}mm`;
        labelPreview.style.height = `${height}mm`;
        
        // Update CSS custom property for control positioning
        document.documentElement.style.setProperty('--label-width', `${width}mm`);
        
        // Dynamically set icon size based on height (height - 2mm for 1mm margin on each side)
        const iconSize = Math.max(6, height - 2); // Minimum 6mm, otherwise height - 2mm
        const labelIcon = labelPreview.querySelector('.label-icon');
        if (labelIcon) {
            labelIcon.style.width = `${iconSize}mm`;
            labelIcon.style.height = `${iconSize}mm`;
        }

        // Check if sub text has any non-empty columns
        const subTextColumns = document.querySelectorAll('.sub-text-column');
        const hasSubText = Array.from(subTextColumns).some(col => col.textContent.trim());
        const subTextContainer = document.querySelector('.sub-text');
        
        if (!hasSubText) {
            subTextContainer.style.display = 'none';
        } else {
            subTextContainer.style.display = 'flex';
        }
        
    }

    async downloadPNG() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const height = parseInt(document.getElementById('label-height').value);
            const width = parseInt(document.getElementById('label-width').value);
            const mainTextInputs = document.querySelectorAll('.main-text-input');
            const mainTexts = Array.from(mainTextInputs).map(input => input.value.trim()).filter(text => text);
            const subTextInputs = document.querySelectorAll('.sub-text-input');
            const subTexts = Array.from(subTextInputs).map(input => input.value.trim()).filter(text => text);
            const iconSelect = document.getElementById('icon-select').value;
            const dpi = this.validateDPI(parseInt(document.getElementById('png-dpi').value) || 96);
            const shouldRotate = document.getElementById('export-rotate').checked;
            const mmToPx = dpi / 25.4;
            
            // Always set canvas to normal dimensions first (we'll rotate after drawing)
            canvas.width = width * mmToPx;
            canvas.height = height * mmToPx;

            // Always use transparent background

            const iconSize = (height - 2) * mmToPx;
            const iconX = 1 * mmToPx;
            const iconY = 1 * mmToPx;

            await this.drawIcon(ctx, iconX, iconY, iconSize, iconSelect);

            const textX = iconX + iconSize + (2 * mmToPx);
            const textAreaWidth = canvas.width - textX - (1 * mmToPx);

            ctx.fillStyle = 'black';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            const mainFontSize = this.calculateFontSize(height);
            const subFontSize = mainFontSize * 0.75;

            ctx.font = `bold ${mainFontSize * mmToPx}px Arial`;
            const textY = subTexts.length > 0 ? iconY + (iconSize * 0.2) : iconY + (iconSize * 0.4);
            
            // Handle multiple columns for main text
            if (mainTexts.length === 0) {
                const defaultTexts = ['M3', 'M3', 'M3'];
                const columnWidth = textAreaWidth / defaultTexts.length;
                defaultTexts.forEach((text, index) => {
                    const columnX = textX + (index * columnWidth);
                    ctx.textAlign = 'left';
                    ctx.fillText(text, columnX, textY);
                });
            } else {
                const columnWidth = textAreaWidth / mainTexts.length;
                mainTexts.forEach((text, index) => {
                    const columnX = textX + (index * columnWidth);
                    ctx.textAlign = 'left';
                    ctx.fillText(text, columnX, textY);
                });
            }

            // Handle multiple columns for sub text
            ctx.font = `${subFontSize * mmToPx}px Arial`;
            ctx.fillStyle = '#666';
            const subTextY = textY + (mainFontSize * mmToPx * 1.2);
            
            if (subTexts.length === 0) {
                const defaultSubTexts = ['8 mm', '10 mm', '12 mm'];
                const columnWidth = textAreaWidth / defaultSubTexts.length;
                defaultSubTexts.forEach((text, index) => {
                    const columnX = textX + (index * columnWidth);
                    ctx.textAlign = 'left';
                    ctx.fillText(text, columnX, subTextY);
                });
            } else {
                const columnWidth = textAreaWidth / subTexts.length;
                subTexts.forEach((text, index) => {
                    const columnX = textX + (index * columnWidth);
                    ctx.textAlign = 'left';
                    ctx.fillText(text, columnX, subTextY);
                });
            }

            // Apply rotation if requested
            let finalCanvas = canvas;
            if (shouldRotate) {
                finalCanvas = this.rotateCanvas(canvas, 90);
            }
            
            // Save DPI setting to localStorage
            this.saveDPISettings();
            
            const link = document.createElement('a');
            const labelName = mainTexts.length > 0 ? mainTexts.join('_') : 'label';
            const rotation = shouldRotate ? '_rotated' : '';
            link.download = `label-${labelName.replace(/[^a-zA-Z0-9]/g, '_')}-${dpi}dpi${rotation}.png`;
            link.href = finalCanvas.toDataURL();
            link.click();
        } catch (error) {
            console.error('PNG download failed:', error);
            alert('Failed to download PNG. Please try again.');
        }
    }

    async downloadSVG() {
        try {
            const height = parseInt(document.getElementById('label-height').value);
            const width = parseInt(document.getElementById('label-width').value);
            const mainTextInputs = document.querySelectorAll('.main-text-input');
            const mainTexts = Array.from(mainTextInputs).map(input => input.value.trim()).filter(text => text);
            const subTextInputs = document.querySelectorAll('.sub-text-input');
            const subTexts = Array.from(subTextInputs).map(input => input.value.trim()).filter(text => text);
            const iconSelect = document.getElementById('icon-select').value;
            const shouldRotate = document.getElementById('export-rotate').checked;
            
            const svg = await this.generateLabelSVG({
                height_mm: height,
                width_mm: width,
                columns: mainTexts.length > 0 ? mainTexts : ['M3', 'M3', 'M3'],
                subtext_columns: subTexts.length > 0 ? subTexts : ['8 mm', '10 mm', '12 mm'],
                icon: iconSelect,
                rotate: shouldRotate
            });
            
            // Save DPI setting to localStorage
            this.saveDPISettings();

            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const link = document.createElement('a');
            const labelName = mainTexts.length > 0 ? mainTexts.join('_') : 'label';
            const rotation = shouldRotate ? '_rotated' : '';
            link.download = `label-${labelName.replace(/[^a-zA-Z0-9]/g, '_')}${rotation}.svg`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('SVG download failed:', error);
            alert('Failed to download SVG. Please try again.');
        }
    }

    async generateLabelSVG(label) {
        const originalHeight = label.height_mm;
        const originalWidth = label.width_mm;
        const shouldRotate = label.rotate || false;
        
        const mainTexts = label.columns ? label.columns.filter(col => col.trim()) : [label.title];
        const subTexts = label.subtext_columns ? label.subtext_columns.filter(col => col.trim()) : (label.subtext ? [label.subtext] : []);
        const iconSelect = label.icon;
        const svgDpi = 96; // Fixed SVG DPI

        // Always use original dimensions for layout calculations
        const iconSize = originalHeight - 2;
        const iconX = 1;
        const iconY = 1;
        const textX = iconX + iconSize + 2;
        const textAreaWidth = originalWidth - textX - 1;
        
        // For rotation, swap dimensions only for the SVG canvas
        const canvasHeight = shouldRotate ? originalWidth : originalHeight;
        const canvasWidth = shouldRotate ? originalHeight : originalWidth;

        // Use 96 PPI for SVG (Inkscape standard)
        const dpi = 96;
        const mmToPx = dpi / 25.4; // ~3.78
        const baseFontSize = this.calculateFontSize(originalHeight);
        const mainFontSizePx = baseFontSize * mmToPx;
        const subFontSizePx = mainFontSizePx * 0.75;
        
        // Convert to px-based viewBox for consistent sizing with PNG
        const viewBoxWidth = canvasWidth * mmToPx;
        const viewBoxHeight = canvasHeight * mmToPx;
        const scale = mmToPx; // For converting mm coordinates to px

        let svgContent = `<svg width="${canvasWidth}mm" height="${canvasHeight}mm" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <rdf:Description>
        <dpi>${svgDpi}</dpi>
        <print-dpi>${svgDpi}</print-dpi>
      </rdf:Description>
    </rdf:RDF>
  </metadata>`;

        // Add rotation group if needed
        if (shouldRotate) {
            // For 90-degree rotation, we need to rotate around the center and then translate
            // to ensure the content fits within the swapped canvas dimensions
            const originalViewBoxWidth = originalWidth * mmToPx;
            const originalViewBoxHeight = originalHeight * mmToPx;
            const centerX = originalViewBoxWidth / 2;
            const centerY = originalViewBoxHeight / 2;
            
            // Calculate the translation needed after rotation to center content in new canvas
            const translateX = (viewBoxWidth - originalViewBoxWidth) / 2;
            const translateY = (viewBoxHeight - originalViewBoxHeight) / 2;
            
            svgContent += `<g transform="translate(${translateX + centerX}, ${translateY + centerY}) rotate(90) translate(${-centerX}, ${-centerY})">`;
        }

        // Add transparent background box for easier selection in design software
        const backgroundWidth = originalWidth * mmToPx;
        const backgroundHeight = originalHeight * mmToPx;
        svgContent += `<rect x="0" y="0" width="${backgroundWidth}" height="${backgroundHeight}" fill="white" fill-opacity="0.01" stroke="none"/>`;

        // Add icon - convert coordinates to pixel space
        const iconXPx = iconX * scale;
        const iconYPx = iconY * scale;
        const iconSizePx = iconSize * scale;
        
        const iconPath = this.icons[iconSelect] || this.customIcons[iconSelect] || this.icons['heads_hex_socket'];
        if (iconPath.endsWith('.svg')) {
            try {
                const response = await fetch(iconPath);
                const iconSvg = await response.text();
                const parser = new DOMParser();
                const iconDoc = parser.parseFromString(iconSvg, 'image/svg+xml');
                const iconSvgElement = iconDoc.documentElement;
                
                // Get original viewBox or width/height to calculate proper scale
                const viewBox = iconSvgElement.getAttribute('viewBox');
                let originalWidth = 100, originalHeight = 100; // fallback
                
                if (viewBox) {
                    const parts = viewBox.split(' ');
                    if (parts.length === 4) {
                        originalWidth = parseFloat(parts[2]);
                        originalHeight = parseFloat(parts[3]);
                    }
                } else {
                    const widthAttr = iconSvgElement.getAttribute('width');
                    const heightAttr = iconSvgElement.getAttribute('height');
                    if (widthAttr) originalWidth = parseFloat(widthAttr.replace(/\D/g, ''));
                    if (heightAttr) originalHeight = parseFloat(heightAttr.replace(/\D/g, ''));
                }
                
                // Calculate scale to fit icon in square
                const iconScale = iconSizePx / Math.max(originalWidth, originalHeight);
                
                // Extract the inner content and scale it properly
                const iconContent = iconSvgElement.innerHTML;
                svgContent += `<g transform="translate(${iconXPx},${iconYPx}) scale(${iconScale})">`;
                svgContent += iconContent;
                svgContent += '</g>';
            } catch (error) {
                console.error('Failed to embed SVG icon:', error);
            }
        } else {
            // For PNG icons, embed as image
            svgContent += `<image x="${iconXPx}" y="${iconYPx}" width="${iconSizePx}" height="${iconSizePx}" href="${iconPath}"/>`;
        }

        // Add main text - position so bottom of text is on horizontal centerline
        const textXPx = textX * scale;
        const textAreaWidthPx = textAreaWidth * scale;
        const centerYPx = (originalHeight * mmToPx) / 2; // Use original height for centerline
        const textYPx = subTexts.length > 0 ? centerYPx : centerYPx;
        
        if (mainTexts.length === 1) {
            svgContent += `<text x="${textXPx}" y="${textYPx}" font-family="Arial, sans-serif" font-size="${mainFontSizePx}px" font-weight="bold" fill="black" dominant-baseline="bottom">${this.escapeXml(mainTexts[0])}</text>`;
        } else {
            const columnWidthPx = textAreaWidthPx / mainTexts.length;
            mainTexts.forEach((text, index) => {
                const columnXPx = textXPx + (index * columnWidthPx);
                svgContent += `<text x="${columnXPx}" y="${textYPx}" font-family="Arial, sans-serif" font-size="${mainFontSizePx}px" font-weight="bold" fill="black" dominant-baseline="bottom">${this.escapeXml(text)}</text>`;
            });
        }

        // Add sub text - position below main text with same spacing
        if (subTexts.length > 0) {
            const subTextYPx = textYPx + (mainFontSizePx * 0.3) + (subFontSizePx * 0.8); // Adjust spacing for new positioning
            if (subTexts.length === 1) {
                svgContent += `<text x="${textXPx}" y="${subTextYPx}" font-family="Arial, sans-serif" font-size="${subFontSizePx}px" fill="#666" dominant-baseline="bottom">${this.escapeXml(subTexts[0])}</text>`;
            } else {
                const columnWidthPx = textAreaWidthPx / subTexts.length;
                subTexts.forEach((text, index) => {
                    const columnXPx = textXPx + (index * columnWidthPx);
                    svgContent += `<text x="${columnXPx}" y="${subTextYPx}" font-family="Arial, sans-serif" font-size="${subFontSizePx}px" fill="#666" dominant-baseline="bottom">${this.escapeXml(text)}</text>`;
                });
            }
        }

        // Close rotation group if needed
        if (shouldRotate) {
            svgContent += '</g>';
        }

        svgContent += '</svg>';
        return svgContent;
    }

    escapeXml(str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&apos;');
    }

    calculateFontSize(height) {
        switch(height) {
            case 9: return 3;
            case 12: return 4;
            case 18: return 6.5;
            case 24: return 8;
            default: return 4;
        }
    }

    async drawIcon(ctx, x, y, size, iconType) {
        const iconPath = this.icons[iconType] || this.customIcons[iconType] || this.icons['heads_hex_socket'];
        
        return new Promise((resolve, reject) => {
            if (iconPath.endsWith('.svg')) {
                // Handle SVG icons
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
                // Handle PNG/JPG icons
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

    initializeTabs() {
        const tabButtons = document.querySelectorAll('.btn[data-tab]');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;

                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.style.display = 'none');

                button.classList.add('active');
                document.getElementById(`${targetTab}-tab`).style.display = 'block';

                // Refresh CodeMirror editor when batch tab becomes visible
                if (targetTab === 'batch' && this.yamlEditor) {
                    setTimeout(() => {
                        this.syncSingleToYaml();
                        this.yamlEditor.refresh();
                    }, 100);
                }
            });
        });
    }

    validateYAML() {
        const yamlInput = this.yamlEditor ? this.yamlEditor.getValue().trim() : document.getElementById('yaml-input').value.trim();
        const resultDiv = document.getElementById('validation-result');
        
        if (!yamlInput) {
            this.showValidationResult('Please enter YAML content to validate.', 'error');
            return;
        }

        try {
            const parsed = this.parseYAML(yamlInput);
            const validation = this.validateLabels(parsed);
            
            if (validation.isValid) {
                this.showValidationResult(`✅ YAML is valid! Found ${validation.labelCount} labels.`, 'success');
            } else {
                this.showValidationResult(`❌ Validation failed:\n${validation.errors.join('\n')}`, 'error');
            }
        } catch (error) {
            this.showValidationResult(`❌ YAML parsing error: ${error.message}`, 'error');
        }
    }

    async generateZIP() {
        const yamlInput = this.yamlEditor ? this.yamlEditor.getValue().trim() : document.getElementById('yaml-input').value.trim();
        
        if (!yamlInput) {
            this.showValidationResult('Please enter YAML content first.', 'error');
            return;
        }

        try {
            const parsed = this.parseYAML(yamlInput);
            const validation = this.validateLabels(parsed);
            
            if (!validation.isValid) {
                this.showValidationResult(`❌ Cannot generate ZIP: ${validation.errors.join(', ')}`, 'error');
                return;
            }

            this.showValidationResult('⏳ Generating labels and creating ZIP...', 'warning');
            
            const labels = parsed.labels;
            const zip = new JSZip();
            
            // Check for export options from YAML settings
            const generateLongPng = parsed.long_png || false;
            const includeCutMarks = parsed.cut_marks || false;
            const generateSvg = parsed.export_svg || false;
            const dpiSetting = parsed.png_dpi || 300;
            
            // Generate individual labels
            for (let i = 0; i < labels.length; i++) {
                const label = labels[i];
                const titleText = label.title || (label.columns ? label.columns.join('_') : 'label');
                
                // Generate PNG
                const canvas = await this.generateLabelCanvas(label, dpiSetting);
                const imageData = canvas.toDataURL().split(',')[1];
                const pngFilename = `label_${i + 1}_${titleText.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                zip.file(pngFilename, imageData, { base64: true });
                
                // Generate SVG if requested
                if (generateSvg) {
                    const svgContent = await this.generateLabelSVG(label);
                    const svgFilename = `label_${i + 1}_${titleText.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
                    zip.file(svgFilename, svgContent);
                }
            }
            
            // Generate long PNG strip if requested
            if (generateLongPng) {
                const longPngCanvas = await this.generateLongPngStrip(labels, includeCutMarks, dpiSetting);
                const longPngData = longPngCanvas.toDataURL().split(',')[1];
                
                // Calculate total strip length - no extra space for cut marks
                const totalStripLength = labels.reduce((sum, label) => sum + label.width_mm, 0);
                
                const longPngFilename = `labels_strip_${totalStripLength}mm.png`;
                
                zip.file(longPngFilename, longPngData, { base64: true });
            }
            
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = 'hardware_labels.zip';
            link.click();
            
            let message = `✅ ZIP generated successfully with ${labels.length} labels!`;
            if (generateLongPng) {
                message += ' Long PNG strip included.';
            }
            if (generateSvg) {
                message += ' SVG files included.';
            }
            
            this.showValidationResult(message, 'success');
            
        } catch (error) {
            this.showValidationResult(`❌ Error generating ZIP: ${error.message}`, 'error');
        }
    }

    parseYAML(yamlString) {
        const lines = yamlString.split('\n');
        const result = { labels: [] };
        let currentLabel = null;
        let inLabels = false;
        let currentArray = null;
        let currentArrayKey = null;

        for (let line of lines) {
            const originalLine = line;
            line = line.trim();
            if (!line || line.startsWith('#')) continue;

            if (line === 'labels:') {
                inLabels = true;
                continue;
            }

            if (inLabels) {
                if (line.startsWith('- ') && originalLine.match(/^  - /)) {
                    // New label item (starts with exactly 2 spaces + dash)
                    if (currentLabel) {
                        // Finish any pending array
                        if (currentArray && currentArrayKey && currentArray.length > 0) {
                            currentLabel[currentArrayKey] = currentArray;
                        }
                        if (Object.keys(currentLabel).length > 0) {
                            result.labels.push(currentLabel);
                        }
                    }
                    currentLabel = {};
                    currentArray = null;
                    currentArrayKey = null;
                    
                    const keyValue = line.substring(2).trim();
                    if (keyValue.includes(':')) {
                        const [key, value] = keyValue.split(':', 2);
                        const trimmedKey = key.trim();
                        const trimmedValue = value.trim();
                        if (trimmedKey && trimmedValue) {
                            currentLabel[trimmedKey] = this.parseValue(trimmedValue);
                        }
                    }
                } else if (line.startsWith('- ') && originalLine.match(/^      - /) && currentArray) {
                    // Array item (starts with exactly 6 spaces + dash)
                    const value = line.substring(2).trim();
                    currentArray.push(this.parseValue(value));
                } else if (line.includes(':') && currentLabel) {
                    // Finish previous array if exists
                    if (currentArray && currentArrayKey && currentArray.length > 0) {
                        currentLabel[currentArrayKey] = currentArray;
                    }
                    
                    const [key, value] = line.split(':', 2);
                    const trimmedKey = key.trim();
                    const trimmedValue = value.trim();
                    if (trimmedKey) {
                        // Check if the value is just a comment (starts with #)
                        const parsedValue = this.parseValue(trimmedValue);
                        if (trimmedValue && !trimmedValue.startsWith('#') && parsedValue !== '') {
                            // Has real value on same line
                            currentLabel[trimmedKey] = parsedValue;
                            currentArray = null;
                            currentArrayKey = null;
                        } else {
                            // Start of array - prepare to collect items (empty value or comment only)
                            currentArray = [];
                            currentArrayKey = trimmedKey;
                        }
                    }
                }
            } else {
                // Handle global options outside of labels
                if (line.includes(':')) {
                    const [key, value] = line.split(':', 2);
                    const trimmedKey = key.trim();
                    if (trimmedKey === 'long_png' || trimmedKey === 'cut_marks' || trimmedKey === 'export_svg' || trimmedKey === 'width_mm' || trimmedKey === 'height_mm' || trimmedKey === 'png_dpi') {
                        result[trimmedKey] = this.parseValue(value.trim());
                    }
                }
            }
        }

        if (currentLabel) {
            // Finish any pending array
            if (currentArray && currentArrayKey && currentArray.length > 0) {
                currentLabel[currentArrayKey] = currentArray;
            }
            if (Object.keys(currentLabel).length > 0) {
                result.labels.push(currentLabel);
            }
        }

        return result;
    }

    parseValue(value) {
        // Remove inline comments
        const commentIndex = value.indexOf('#');
        if (commentIndex !== -1) {
            value = value.substring(0, commentIndex).trim();
        }
        
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1);
        }
        if (value.startsWith("'") && value.endsWith("'")) {
            return value.slice(1, -1);
        }
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }
        if (!isNaN(value) && value !== '') {
            return Number(value);
        }
        return value;
    }

    validateLabels(parsed) {
        const errors = [];
        const validHeights = [9, 12, 18, 24];
        
        if (!parsed.labels || !Array.isArray(parsed.labels)) {
            errors.push('Missing or invalid "labels" array');
            return { isValid: false, errors, labelCount: 0 };
        }

        if (parsed.labels.length === 0) {
            errors.push('No labels found');
            return { isValid: false, errors, labelCount: 0 };
        }

        // Validate optional global settings
        if (parsed.long_png !== undefined && typeof parsed.long_png !== 'boolean') {
            errors.push('Invalid long_png setting. Must be true or false if provided');
        }
        
        if (parsed.cut_marks !== undefined && typeof parsed.cut_marks !== 'boolean') {
            errors.push('Invalid cut_marks setting. Must be true or false if provided');
        }
        
        if (parsed.export_svg !== undefined && typeof parsed.export_svg !== 'boolean') {
            errors.push('Invalid export_svg setting. Must be true or false if provided');
        }

        // Validate global width_mm and height_mm
        if (parsed.width_mm !== undefined && (typeof parsed.width_mm !== 'number' || parsed.width_mm < 20 || parsed.width_mm > 100)) {
            errors.push('Invalid global width_mm. Must be a number between 20 and 100 if provided');
        }
        
        if (parsed.height_mm !== undefined && (typeof parsed.height_mm !== 'number' || !validHeights.includes(parsed.height_mm))) {
            errors.push(`Invalid global height_mm. Must be one of: ${validHeights.join(', ')} if provided`);
        }
        
        if (parsed.png_dpi !== undefined && (typeof parsed.png_dpi !== 'number' || parsed.png_dpi < 50 || parsed.png_dpi > 1200)) {
            errors.push('Invalid global png_dpi. Must be a number between 50 and 1200 if provided');
        }

        parsed.labels.forEach((label, index) => {
            const labelNum = index + 1;
            
            // Normalize maintext_columns to columns for backwards compatibility
            if (label.maintext_columns && !label.columns) {
                label.columns = label.maintext_columns;
            }
            
            // Apply global defaults
            if (!label.width_mm && parsed.width_mm) {
                label.width_mm = parsed.width_mm;
            }
            if (!label.height_mm && parsed.height_mm) {
                label.height_mm = parsed.height_mm;
            }
            
            // Check for either title (single column) or columns (multi-column)
            if (!label.title && !label.columns) {
                errors.push(`Label ${labelNum}: Missing title or columns (or maintext_columns)`);
            } else if (label.title && label.columns) {
                errors.push(`Label ${labelNum}: Cannot have both title and columns. Use either title for single column or columns/maintext_columns for multi-column`);
            } else if (label.title && typeof label.title !== 'string') {
                errors.push(`Label ${labelNum}: Invalid title. Must be a string`);
            } else if (label.columns && (!Array.isArray(label.columns) || label.columns.length === 0 || label.columns.length > 8)) {
                errors.push(`Label ${labelNum}: Invalid columns/maintext_columns. Must be an array with 1-8 string elements`);
            } else if (label.columns && label.columns.some(col => typeof col !== 'string')) {
                errors.push(`Label ${labelNum}: Invalid columns/maintext_columns. All column values must be strings`);
            }
            
            if (!label.icon || typeof label.icon !== 'string') {
                errors.push(`Label ${labelNum}: Missing or invalid icon`);
            } else if (!this.availableIcons.includes(label.icon)) {
                errors.push(`Label ${labelNum}: Invalid icon "${label.icon}". Must be one of: ${this.availableIcons.join(', ')}`);
            }
            
            if (!label.width_mm || typeof label.width_mm !== 'number' || label.width_mm < 20 || label.width_mm > 100) {
                errors.push(`Label ${labelNum}: Invalid width_mm. Must be a number between 20 and 100`);
            }
            
            if (!label.height_mm || typeof label.height_mm !== 'number' || !validHeights.includes(label.height_mm)) {
                errors.push(`Label ${labelNum}: Invalid height_mm. Must be one of: ${validHeights.join(', ')}`);
            }
            
            if (label.subtext && typeof label.subtext !== 'string') {
                errors.push(`Label ${labelNum}: Invalid subtext. Must be a string if provided`);
            }
            
            if (label.subtext_columns && (!Array.isArray(label.subtext_columns) || label.subtext_columns.length === 0 || label.subtext_columns.length > 8)) {
                errors.push(`Label ${labelNum}: Invalid subtext_columns. Must be an array with 1-8 string elements if provided`);
            } else if (label.subtext_columns && label.subtext_columns.some(col => typeof col !== 'string')) {
                errors.push(`Label ${labelNum}: Invalid subtext_columns. All column values must be strings`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            labelCount: parsed.labels.length
        };
    }

    async generateLabelCanvas(label, dpi = 300) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Normalize maintext_columns to columns for backwards compatibility
        if (label.maintext_columns && !label.columns) {
            label.columns = label.maintext_columns;
        }
        
        const height = label.height_mm;
        const width = label.width_mm;
        const mainTexts = label.columns ? label.columns.filter(col => col.trim()) : [label.title];
        const subTexts = label.subtext_columns ? label.subtext_columns.filter(col => col.trim()) : (label.subtext ? [label.subtext] : []);
        const iconSelect = label.icon;
        const mmToPx = dpi / 25.4;
        
        canvas.width = width * mmToPx;
        canvas.height = height * mmToPx;

        // Always use transparent background

        const iconSize = (height - 2) * mmToPx;
        const iconX = 1 * mmToPx;
        const iconY = 1 * mmToPx;

        await this.drawIcon(ctx, iconX, iconY, iconSize, iconSelect);

        const textX = iconX + iconSize + (2 * mmToPx);
        const textAreaWidth = canvas.width - textX - (1 * mmToPx);

        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const mainFontSize = this.calculateFontSize(height);
        const subFontSize = mainFontSize * 0.75;

        ctx.font = `bold ${mainFontSize * mmToPx}px Arial`;
        const textY = subTexts.length > 0 ? iconY + (iconSize * 0.2) : iconY + (iconSize * 0.4);
        
        // Handle multiple columns for main text
        if (mainTexts.length === 1) {
            ctx.fillText(mainTexts[0], textX, textY);
        } else {
            const columnWidth = textAreaWidth / mainTexts.length;
            mainTexts.forEach((text, index) => {
                const columnX = textX + (index * columnWidth);
                ctx.textAlign = 'left';
                ctx.fillText(text, columnX, textY);
            });
        }

        // Handle multiple columns for sub text
        if (subTexts.length > 0) {
            ctx.font = `${subFontSize * mmToPx}px Arial`;
            ctx.fillStyle = '#666';
            const subTextY = textY + (mainFontSize * mmToPx * 1.2);
            
            if (subTexts.length === 1) {
                ctx.fillText(subTexts[0], textX, subTextY);
            } else {
                const columnWidth = textAreaWidth / subTexts.length;
                subTexts.forEach((text, index) => {
                    const columnX = textX + (index * columnWidth);
                    ctx.textAlign = 'left';
                    ctx.fillText(text, columnX, subTextY);
                });
            }
        }

        return canvas;
    }

    async generateLongPngStrip(labels, includeCutMarks, dpi = 300) {
        const mmToPx = dpi / 25.4;
        
        // Calculate dimensions - horizontal strip
        const firstLabel = labels[0];
        const labelHeight = firstLabel.height_mm * mmToPx;
        
        let totalWidth = 0;
        const labelCanvases = [];
        
        // Generate individual label canvases and calculate total width
        for (const label of labels) {
            const canvas = await this.generateLabelCanvas(label, dpi);
            labelCanvases.push(canvas);
            totalWidth += canvas.width;
            // No extra space for cut marks - they're just visual lines
        }
        
        // Create the horizontal strip canvas
        const stripCanvas = document.createElement('canvas');
        const stripCtx = stripCanvas.getContext('2d');
        
        stripCanvas.width = totalWidth;
        stripCanvas.height = labelHeight;
        
        // Fill with white background
        stripCtx.fillStyle = 'white';
        stripCtx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);
        
        // Draw labels and cut marks horizontally
        let currentX = 0;
        
        for (let i = 0; i < labelCanvases.length; i++) {
            const labelCanvas = labelCanvases[i];
            
            // Draw the label
            stripCtx.drawImage(labelCanvas, currentX, 0);
            currentX += labelCanvas.width;
            
            // Draw cut marks between labels (except after the last one) - no space taken
            if (i < labelCanvases.length - 1 && includeCutMarks) {
                this.drawCutMarks(stripCtx, currentX, labelHeight);
            }
        }
        
        return stripCanvas;
    }
    
    drawCutMarks(ctx, x, labelHeight) {
        const cutMarkLength = labelHeight * 0.1; // 10% of label height
        const cutMarkThickness = 1;
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = cutMarkThickness;
        
        // Draw cut mark at the exact boundary between labels
        
        // Top cut mark
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, cutMarkLength);
        ctx.stroke();
        
        // Bottom cut mark
        ctx.beginPath();
        ctx.moveTo(x, labelHeight - cutMarkLength);
        ctx.lineTo(x, labelHeight);
        ctx.stroke();
    }

    showValidationResult(message, type) {
        const resultDiv = document.getElementById('validation-result');
        resultDiv.className = `validation-result ${type}`;
        resultDiv.innerHTML = message.replace(/\n/g, '<br>');
        resultDiv.style.display = 'block';
    }

    loadAvailableIcons() {
        // Use all available icons from the icon picker + custom icons
        this.availableIcons = Object.keys(this.icons).concat(Object.keys(this.customIcons));
        // Only generate prompt if YAML editor is ready
        if (this.yamlEditor) {
            this.generatePrompt();
        }
    }

    loadCustomIcons() {
        try {
            const stored = localStorage.getItem('customIcons');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading custom icons:', error);
            return {};
        }
    }

    saveCustomIcons() {
        try {
            localStorage.setItem('customIcons', JSON.stringify(this.customIcons));
        } catch (error) {
            console.error('Error saving custom icons:', error);
        }
    }

    initializeIconUpload() {
        const uploadBtn = document.getElementById('upload-icon-btn');
        const fileInput = document.getElementById('icon-upload');

        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.handleIconUpload(file);
            }
        });
    }

    async handleIconUpload(file) {
        // Validate file type
        if (!file.type.startsWith('image/png')) {
            alert('Please upload a PNG image file.');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be less than 2MB.');
            return;
        }

        try {
            // Create image element to validate dimensions
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const imageDataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            await new Promise((resolve, reject) => {
                img.onload = () => {
                    // Validate minimum size
                    if (img.width < 32 || img.height < 32) {
                        alert('Image must be at least 32x32 pixels.');
                        reject(new Error('Too small'));
                        return;
                    }

                    // Resize to standard size, maintaining aspect ratio and centering
                    const targetSize = 128;
                    canvas.width = targetSize;
                    canvas.height = targetSize;
                    
                    // Fill with white background
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, targetSize, targetSize);
                    
                    // Calculate scaling to fit within target size while maintaining aspect ratio
                    const scale = Math.min(targetSize / img.width, targetSize / img.height);
                    const scaledWidth = img.width * scale;
                    const scaledHeight = img.height * scale;
                    
                    // Center the image
                    const offsetX = (targetSize - scaledWidth) / 2;
                    const offsetY = (targetSize - scaledHeight) / 2;
                    
                    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
                    
                    resolve();
                };
                img.onerror = reject;
                img.src = imageDataUrl;
            });

            // Get processed image data
            const processedDataUrl = canvas.toDataURL('image/png');
            
            // Generate unique name for the icon
            const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
            let iconName = `Custom_${baseName}`;
            let counter = 1;
            
            // Ensure unique name
            while (this.icons[iconName] || this.customIcons[iconName]) {
                iconName = `Custom_${baseName}_${counter}`;
                counter++;
            }

            // Save to custom icons
            this.customIcons[iconName] = processedDataUrl;
            this.saveCustomIcons();
            
            // Update available icons list
            this.loadAvailableIcons();
            
            // Refresh the icon picker
            this.populateIconGrid();
            
            // Auto-select the new icon
            this.selectIcon(iconName);
            
            alert(`✅ Icon "${iconName}" uploaded successfully!`);
            
        } catch (error) {
            console.error('Error processing uploaded icon:', error);
            if (error.message !== 'Too small') {
                alert('Error processing uploaded image. Please try again.');
            }
        }
    }
    
    

    generatePrompt() {
        const yamlTemplate = `# Hardware Label Generator - Batch YAML Template
#
# 💡 TIP: Copy this template to your favorite LLM tool (ChatGPT, Claude, etc.) 
#         and ask it to generate labels for your specific hardware collection!
#         Example prompt: "Generate 20 labels for my M3-M8 bolt collection with various lengths"
#
# Available icons: ${this.availableIcons.join(', ')}

# Global settings (optional - applied to all labels unless overridden)
long_png: true        # Generate one continuous PNG strip of all labels
cut_marks: true       # Add cut marks between labels for easy trimming  
export_svg: true      # Also generate SVG files (vector format, scalable)
width_mm: 50          # Default width for all labels (20-100mm)
height_mm: 12         # Default height for all labels (9, 12, 18, or 24mm)
png_dpi: 300          # PNG export resolution in dots per inch (50-1200)

labels:
  # Multi-column label example (great for drawer compartments)
  - icon: "heads_hex_socket"            # Icon to display on the left
    maintext_columns:                   # Main text columns (1-8 columns max)
      - "M3"
      - "M3" 
      - "M3"
    subtext_columns:                    # Optional sub-text columns
      - "8 mm"
      - "10 mm"
      - "12 mm"
    rotate: false                       # Rotate label 90 degrees (default: false)

  # Another multi-column example
  - icon: "heads_hex_socket"
    maintext_columns:
      - "M4"
      - "M4"
      - "M4"
    subtext_columns:
      - "14 mm"
      - "16 mm"
      - "18 mm"
    rotate: false                       # Rotate label 90 degrees (default: false)

# Single column alternatives (if you prefer):
# - title: "M5 × 20"                   # Single main text
#   subtext: "DIN 7984"                # Optional single sub-text  
#   icon: "fasteners_screw_hex"
#   width_mm: 45                       # Override global width
#   height_mm: 18                      # Override global height
#   rotate: false                      # Rotate label 90 degrees (default: false)
`;
        
        // Set the template in the YAML editor
        if (this.yamlEditor) {
            this.yamlEditor.setValue(yamlTemplate);
        } else {
            document.getElementById('yaml-input').value = yamlTemplate;
        }
    }

    initializeYamlEditor() {
        // Wait for CodeMirror to be available
        if (typeof CodeMirror === 'undefined') {
            setTimeout(() => this.initializeYamlEditor(), 100);
            return;
        }

        const yamlTextarea = document.getElementById('yaml-input');
        
        this.yamlEditor = CodeMirror.fromTextArea(yamlTextarea, {
            mode: 'yaml',
            theme: 'default',
            lineNumbers: true,
            lineWrapping: true,
            indentUnit: 2,
            tabSize: 2,
            indentWithTabs: false,
            autoCloseBrackets: true,
            matchBrackets: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
            placeholder: 'Paste your YAML here...'
        });

        // Set initial size
        this.yamlEditor.setSize(null, 400);

        // Add class to indicate CodeMirror loaded successfully
        document.body.classList.add('codemirror-loaded');

        // Update the editor when the tab becomes visible
        this.yamlEditor.refresh();

        // Load template after editor is ready
        this.generatePrompt();

        // Sync initial state from single tab
        setTimeout(() => {
            this.syncSingleToYaml();
        }, 100);

    }

    initializeIconPicker() {
        const iconCategories = {
            'Electronics': ['electronics_wago_logo', 'electronics_wago_alt1', 'electronics_wago_alt2', 'electronics_wire_nut', 'electronics_generic'],
            'Screw Heads': ['heads_cross', 'heads_hex_external', 'heads_hex_socket', 'heads_phillips', 'heads_pozidriv', 'heads_robertson', 'heads_slotted', 'heads_square_external', 'heads_ta', 'heads_torx', 'heads_torx_tamperproof'],
            'Inserts': ['inserts_heat', 'inserts_wood'],
            'Nuts': ['nuts_nut_cap', 'nuts_nut_lock', 'nuts_nut_standard'],
            'Screws': ['fasteners_screw_round', 'fasteners_screw_tbolt', 'fasteners_screw_truss', 'fasteners_screw_truss_modified', 'fasteners_screw_wafer', 'fasteners_screw_bugle', 'fasteners_screw_fillister', 'fasteners_screw_flat', 'fasteners_screw_hex', 'fasteners_screw_oval', 'fasteners_screw_pan', 'fasteners_screw_pan_hex', 'fasteners_screw_thumb_knurled', 'fasteners_screw_trim', 'fasteners_thumb_screw'],
            'Washers': ['washers_fender', 'washers_flat', 'washers_split', 'washers_star_exterior', 'washers_star_interior']
        };

        const iconNames = {
            'electronics_wago_logo': 'Wago Logo',
            'electronics_wago_alt1': 'Wago Alt 1',
            'electronics_wago_alt2': 'Wago Alt 2',
            'electronics_wire_nut': 'Wire Nut',
            'electronics_generic': 'Generic Electrical',
            'heads_cross': 'Cross Head',
            'heads_hex_external': 'Hex External',
            'heads_hex_socket': 'Hex Socket',
            'heads_phillips': 'Phillips Head',
            'heads_pozidriv': 'Pozidriv',
            'heads_robertson': 'Robertson Head',
            'heads_slotted': 'Slotted Head',
            'heads_square_external': 'Square External',
            'heads_ta': 'TA Head',
            'heads_torx': 'Torx Head',
            'heads_torx_tamperproof': 'Torx Tamperproof',
            'inserts_heat': 'Heat Insert',
            'inserts_wood': 'Wood Insert',
            'nuts_nut_cap': 'Cap Nut',
            'nuts_nut_lock': 'Lock Nut',
            'nuts_nut_standard': 'Standard Nut',
            'fasteners_screw_round': 'Round Screw',
            'fasteners_screw_tbolt': 'T-Bolt',
            'fasteners_screw_truss': 'Truss Screw',
            'fasteners_screw_truss_modified': 'Truss Modified',
            'fasteners_screw_wafer': 'Wafer Screw',
            'fasteners_screw_bugle': 'Bugle Screw',
            'fasteners_screw_fillister': 'Fillister Screw',
            'fasteners_screw_flat': 'Flat Screw',
            'fasteners_screw_hex': 'Hex Screw',
            'fasteners_screw_oval': 'Oval Screw',
            'fasteners_screw_pan': 'Pan Screw',
            'fasteners_screw_pan_hex': 'Pan Hex Screw',
            'fasteners_screw_thumb_knurled': 'Thumb Knurled',
            'fasteners_screw_trim': 'Trim Screw',
            'fasteners_thumb_screw': 'Thumb Screw',
            'washers_fender': 'Fender Washer',
            'washers_flat': 'Flat Washer',
            'washers_split': 'Split Washer',
            'washers_star_exterior': 'Star Exterior',
            'washers_star_interior': 'Star Interior'
        };

        this.iconCategories = iconCategories;
        this.iconNames = iconNames;
        this.selectedIcon = 'heads_hex_socket';

        // Populate the icon grid
        this.populateIconGrid();

        // Search functionality
        const searchInput = document.getElementById('icon-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterIcons(e.target.value);
            });
        }
    }

    populateIconGrid() {
        const grid = document.getElementById('icon-grid');
        grid.innerHTML = '';

        // Add custom icons first if they exist
        if (Object.keys(this.customIcons).length > 0) {
            const customCategoryDiv = document.createElement('div');
            customCategoryDiv.className = 'icon-picker-category custom-icon-category';
            customCategoryDiv.textContent = 'Custom Icons';
            grid.appendChild(customCategoryDiv);

            Object.keys(this.customIcons).forEach(iconKey => {
                const iconDiv = document.createElement('div');
                iconDiv.className = 'icon-picker-item';
                iconDiv.dataset.icon = iconKey;
                iconDiv.innerHTML = `
                    <img src="${this.customIcons[iconKey]}" alt="${iconKey}">
                    <span>${iconKey.replace('Custom_', '').replace(/_/g, ' ')}</span>
                    <button class="rename-icon-btn" onclick="event.stopPropagation(); labelMaker.renameCustomIcon('${iconKey}')" title="Rename icon">✎</button>
                    <button class="delete-icon-btn" onclick="event.stopPropagation(); labelMaker.deleteCustomIcon('${iconKey}')" title="Delete icon">×</button>
                `;

                iconDiv.addEventListener('click', () => {
                    this.selectIcon(iconKey);
                });

                if (iconKey === this.selectedIcon) {
                    iconDiv.classList.add('selected');
                }

                grid.appendChild(iconDiv);
            });
        }

        // Add built-in icons
        Object.entries(this.iconCategories).forEach(([category, icons]) => {
            // Add category header
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'icon-picker-category';
            categoryDiv.textContent = category;
            grid.appendChild(categoryDiv);

            // Add icons
            icons.forEach(iconKey => {
                const iconDiv = document.createElement('div');
                iconDiv.className = 'icon-picker-item';
                iconDiv.dataset.icon = iconKey;
                iconDiv.innerHTML = `
                    <img src="${this.icons[iconKey]}" alt="${iconKey}">
                    <span>${this.iconNames[iconKey]}</span>
                `;

                iconDiv.addEventListener('click', () => {
                    this.selectIcon(iconKey);
                });

                if (iconKey === this.selectedIcon) {
                    iconDiv.classList.add('selected');
                }

                grid.appendChild(iconDiv);
            });
        });
    }

    selectIcon(iconKey) {
        this.selectedIcon = iconKey;

        // Get icon path and display name
        const iconPath = this.icons[iconKey] || this.customIcons[iconKey];
        const displayName = this.iconNames[iconKey] || iconKey.replace('Custom_', '').replace(/_/g, ' ');

        // Update the selected icon display
        const selectedIconDiv = document.querySelector('.selected-icon');
        selectedIconDiv.dataset.icon = iconKey;
        selectedIconDiv.innerHTML = `
            <img src="${iconPath}" alt="${iconKey}">
            <span>${displayName}</span>
        `;

        // Update the hidden select for compatibility
        const selectElement = document.getElementById('icon-select');
        selectElement.value = iconKey;
        selectElement.innerHTML = `<option value="${iconKey}" selected>${displayName}</option>`;

        // Update grid selection
        document.querySelectorAll('.icon-picker-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.icon === iconKey);
        });

        // Close picker and update preview
        this.closeIconPicker();
        this.updatePreview();
        this.syncSingleToYaml();
    }

    openIconPicker() {
        const iconPicker = document.getElementById('icon-picker');
        const overlay = document.querySelector('.icon-picker-overlay');
        
        if (iconPicker && overlay) {
            iconPicker.style.display = 'block';
            overlay.classList.add('active');
            
            // Focus search input
            setTimeout(() => {
                const searchInput = document.getElementById('icon-search');
                if (searchInput) {
                    searchInput.focus();
                }
            }, 100);
        }
    }

    closeIconPicker() {
        const iconPicker = document.getElementById('icon-picker');
        const overlay = document.querySelector('.icon-picker-overlay');
        
        if (iconPicker && overlay) {
            iconPicker.style.display = 'none';
            overlay.classList.remove('active');
            
            // Clear search
            const searchInput = document.getElementById('icon-search');
            if (searchInput) {
                searchInput.value = '';
                this.filterIcons('');
            }
        }
    }

    filterIcons(searchTerm) {
        const items = document.querySelectorAll('.icon-picker-item');
        const categories = document.querySelectorAll('.icon-picker-category');
        
        searchTerm = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const iconKey = item.dataset.icon;
            const iconName = (this.iconNames[iconKey] || iconKey.replace('Custom_', '').replace(/_/g, ' ')).toLowerCase();
            const matches = iconName.includes(searchTerm) || iconKey.toLowerCase().includes(searchTerm);
            
            item.style.display = matches ? 'flex' : 'none';
        });

        // Show/hide categories based on whether they have visible items
        categories.forEach(category => {
            let hasVisibleItems = false;
            let sibling = category.nextElementSibling;
            
            while (sibling && !sibling.classList.contains('icon-picker-category')) {
                if (sibling.style.display !== 'none') {
                    hasVisibleItems = true;
                    break;
                }
                sibling = sibling.nextElementSibling;
            }
            
            category.style.display = hasVisibleItems ? 'block' : 'none';
        });
    }

    renameCustomIcon(iconKey) {
        const currentName = iconKey.replace('Custom_', '').replace(/_/g, ' ');
        const newName = prompt(`Rename custom icon:\n\nCurrent name: ${currentName}\n\nEnter new name (alphanumeric and spaces only):`, currentName);

        if (!newName || newName.trim() === '') {
            return; // User cancelled or entered empty name
        }

        // Sanitize the new name
        const sanitizedName = newName.trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');

        if (!sanitizedName) {
            alert('Invalid name. Please use only letters, numbers, and spaces.');
            return;
        }

        // Create new key with Custom_ prefix
        const newKey = `Custom_${sanitizedName}`;

        // Check if the new name already exists
        if (newKey !== iconKey && (this.icons[newKey] || this.customIcons[newKey])) {
            alert(`An icon with the name "${sanitizedName}" already exists. Please choose a different name.`);
            return;
        }

        // If the name hasn't changed, do nothing
        if (newKey === iconKey) {
            return;
        }

        // Copy the icon data to the new key
        this.customIcons[newKey] = this.customIcons[iconKey];

        // Delete the old key
        delete this.customIcons[iconKey];

        // Save changes
        this.saveCustomIcons();
        this.loadAvailableIcons();
        this.populateIconGrid();

        // If this was the selected icon, update the selection to use new key
        if (this.selectedIcon === iconKey) {
            this.selectIcon(newKey);
        }

        // Sync to YAML to reflect the new name
        this.syncSingleToYaml();
    }

    deleteCustomIcon(iconKey) {
        if (confirm(`Are you sure you want to delete the custom icon "${iconKey}"?`)) {
            delete this.customIcons[iconKey];
            this.saveCustomIcons();
            this.loadAvailableIcons();
            this.populateIconGrid();

            // If this was the selected icon, switch to default
            if (this.selectedIcon === iconKey) {
                this.selectIcon('heads_hex_socket');
            }
        }
    }

    validateDPI(dpi) {
        // Validate DPI is within acceptable range
        if (isNaN(dpi) || dpi < 50 || dpi > 1200) {
            return 96; // Default fallback
        }
        return dpi;
    }

    rotateCanvas(canvas, degrees) {
        const rotatedCanvas = document.createElement('canvas');
        const rotatedCtx = rotatedCanvas.getContext('2d');
        
        // For 90 degree rotation, swap width and height
        if (degrees === 90) {
            rotatedCanvas.width = canvas.height;
            rotatedCanvas.height = canvas.width;
            
            // Translate and rotate
            rotatedCtx.translate(canvas.height, 0);
            rotatedCtx.rotate(Math.PI / 2);
        }
        
        // Draw the original canvas onto the rotated canvas
        rotatedCtx.drawImage(canvas, 0, 0);
        
        return rotatedCanvas;
    }

    loadDPISettings() {
        try {
            const settings = localStorage.getItem('dpiSettings');
            if (settings) {
                const parsed = JSON.parse(settings);
                if (parsed.pngDpi) {
                    document.getElementById('png-dpi').value = this.validateDPI(parsed.pngDpi);
                }
                // SVG DPI removed - using fixed 96 DPI
                if (parsed.exportRotate !== undefined) {
                    document.getElementById('export-rotate').checked = parsed.exportRotate;
                }
            }
        } catch (error) {
            console.error('Error loading DPI settings:', error);
        }
    }

    saveDPISettings() {
        try {
            const settings = {
                pngDpi: parseInt(document.getElementById('png-dpi').value),
                exportRotate: document.getElementById('export-rotate').checked
            };
            localStorage.setItem('dpiSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving DPI settings:', error);
        }
    }

    // =========================================================================
    // Printer Integration (NiimBlueLib — Bluetooth + Serial/USB)
    // =========================================================================

    /** Returns the currently selected connection mode ('bluetooth' or 'serial') */
    getConnectionMode() {
        const checked = document.querySelector('input[name="conn-mode"]:checked');
        return checked ? checked.value : 'serial';
    }

    initializePrinter() {
        const section = document.getElementById('printer-section');
        const unavailable = document.getElementById('printer-unavailable');

        // Feature detection: need at least one of Web Bluetooth or Web Serial
        const hasBluetooth = !!navigator.bluetooth;
        const hasSerial = !!navigator.serial;

        if (!hasBluetooth && !hasSerial) {
            if (section) section.style.display = 'none';
            if (unavailable) unavailable.style.display = 'block';
            console.log('[Printer] Neither Web Bluetooth nor Web Serial API available');
            return;
        }

        // Check NiimBlueLib loaded
        if (typeof niimbluelib === 'undefined') {
            if (section) section.style.display = 'none';
            if (unavailable) {
                unavailable.style.display = 'block';
                unavailable.querySelector('.alert').textContent =
                    '\u{1F5A8}\uFE0F NiimBlueLib failed to load. Check your internet connection.';
            }
            console.error('[Printer] NiimBlueLib not loaded');
            return;
        }

        // Show the printer section
        if (section) section.style.display = 'block';
        if (unavailable) unavailable.style.display = 'none';

        // Disable unavailable modes
        const bleRadio = document.getElementById('conn-mode-ble');
        const serialRadio = document.getElementById('conn-mode-serial');
        const bleLabel = document.querySelector('label[for="conn-mode-ble"]');
        const serialLabel = document.querySelector('label[for="conn-mode-serial"]');

        if (!hasBluetooth && bleRadio) {
            bleRadio.disabled = true;
            if (bleLabel) bleLabel.title = 'Web Bluetooth not available in this browser';
        }
        if (!hasSerial && serialRadio) {
            serialRadio.disabled = true;
            if (serialLabel) serialLabel.title = 'Web Serial not available in this browser';
        }

        // Auto-select the available mode
        if (!hasSerial && hasBluetooth && bleRadio) {
            bleRadio.checked = true;
        } else if (hasSerial && serialRadio) {
            serialRadio.checked = true;  // Serial is preferred (more reliable)
        }

        // Initialize state
        this.niimbotClient = null;
        this.printerConnected = false;
        this.isPrinting = false;

        // Load saved settings (including connection mode)
        this.loadPrinterSettings();

        // Event listeners
        const connectBtn = document.getElementById('printer-connect');
        const disconnectBtn = document.getElementById('printer-disconnect');
        const printBtn = document.getElementById('printer-print');
        const densitySlider = document.getElementById('printer-density');
        const modelSelect = document.getElementById('printer-model');
        const quantityInput = document.getElementById('printer-quantity');

        if (connectBtn) connectBtn.addEventListener('click', () => this.connectPrinter());
        if (disconnectBtn) disconnectBtn.addEventListener('click', () => this.disconnectPrinter());
        if (printBtn) printBtn.addEventListener('click', () => this.printLabel());

        if (densitySlider) {
            densitySlider.addEventListener('input', (e) => {
                document.getElementById('density-value').textContent = e.target.value;
                this.savePrinterSettings();
            });
        }

        if (modelSelect) {
            modelSelect.addEventListener('change', () => this.savePrinterSettings());
        }

        if (quantityInput) {
            quantityInput.addEventListener('change', () => this.savePrinterSettings());
        }

        // Save connection mode on toggle
        document.querySelectorAll('input[name="conn-mode"]').forEach(radio => {
            radio.addEventListener('change', () => this.savePrinterSettings());
        });


    }

    async connectPrinter() {
        const connectBtn = document.getElementById('printer-connect');
        const statusBadge = document.getElementById('printer-status-badge');
        const mode = this.getConnectionMode();

        try {
            connectBtn.disabled = true;
            connectBtn.textContent = '\u{1F50D} Searching...';
            statusBadge.className = 'badge bg-warning text-dark';
            statusBadge.textContent = 'Connecting...';

            const modeLabel = mode === 'serial' ? 'USB serial port' : 'Bluetooth device';
            this.showPrinterMessage(`Select your ${modeLabel} from the picker...`, 'muted');

            this.niimbotClient = mode === 'serial'
                ? new niimbluelib.NiimbotSerialClient()
                : new niimbluelib.NiimbotBluetoothClient();

            this.niimbotClient.on('connect', () => {
                this.printerConnected = true;
                this.updatePrinterUI(true);
                this.showPrinterMessage(`Connected via ${mode === 'serial' ? 'USB' : 'Bluetooth'}!`, 'success');
                this.fetchPrinterInfo();
            });

            this.niimbotClient.on('disconnect', () => {
                this.printerConnected = false;
                this.isPrinting = false;
                this.updatePrinterUI(false);
                this.showPrinterMessage('Printer disconnected', 'muted');
            });

            this.niimbotClient.on('printprogress', (e) => {
                this.updatePrintProgress(e);
            });

            await this.niimbotClient.connect();

            // macOS USB CDC needs longer packet intervals (default 10ms saturates the port)
            if (mode === 'serial' && this.niimbotClient.setPacketInterval) {
                this.niimbotClient.setPacketInterval(50);
            }

        } catch (error) {
            console.error('[Printer] Connection failed:', error);
            this.printerConnected = false;
            this.niimbotClient = null;
            this.updatePrinterUI(false);

            if (error.name === 'NotFoundError') {
                this.showPrinterMessage('No device selected. Click Connect to try again.', 'muted');
            } else if (error.message?.includes('No port selected')) {
                this.showPrinterMessage('No serial port selected. Click Connect to try again.', 'muted');
            } else {
                this.showPrinterMessage(`Connection failed: ${error.message}`, 'danger');
            }
        }
    }

    async disconnectPrinter() {
        try {
            if (this.niimbotClient) {
                this.niimbotClient.disconnect();
                this.niimbotClient = null;
            }
        } catch (error) {
            console.error('[Printer] Disconnect error:', error);
        }
        this.printerConnected = false;
        this.isPrinting = false;
        this.updatePrinterUI(false);
    }

    async fetchPrinterInfo() {
        if (!this.niimbotClient) return;

        try {
            // fetchPrinterInfo() sends info-request packets to the printer,
            // stores the results, and returns the PrinterInfo object
            const info = await this.niimbotClient.fetchPrinterInfo();
            const batteryEl = document.getElementById('printer-battery');
            const modelEl = document.getElementById('printer-model-info');
            const infoRow = document.getElementById('printer-info');

            if (info && infoRow) {
                infoRow.style.display = 'flex';

                if (info.charge !== undefined && batteryEl) {
                    batteryEl.textContent = `\u{1F50B} ${info.charge}%`;
                }

                if (info.softwareVersion && modelEl) {
                    modelEl.textContent = `\u{1F4F1} FW: ${info.softwareVersion}`;
                }
            }
        } catch (error) {
            console.warn('[Printer] Could not fetch printer info:', error);
        }
    }



    /**
     * Render the label at exact pixel dimensions for the printer.
     * Renders directly to the pixel grid, then thresholds to 1-bit B/W for thermal printing.
     */
    async renderForPrinterNative(widthPx, heightPx) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const mainTextInputs = document.querySelectorAll('.main-text-input');
        const mainTexts = Array.from(mainTextInputs).map(input => input.value.trim()).filter(text => text);
        const subTextInputs = document.querySelectorAll('.sub-text-input');
        const subTexts = Array.from(subTextInputs).map(input => input.value.trim()).filter(text => text);
        const iconSelect = document.getElementById('icon-select').value;

        canvas.width = widthPx;
        canvas.height = heightPx;

        // pxPerUnit: treat the canvas as a unit grid (height = 1.0)
        // All layout is proportional to the height
        const pxPerUnit = heightPx;

        // White background (required for thermal printing — no transparency)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw icon (square, with margin)
        const margin = Math.round(pxPerUnit * 0.06);
        const iconSize = heightPx - (2 * margin);
        const iconX = margin;
        const iconY = margin;
        await this.drawIcon(ctx, iconX, iconY, iconSize, iconSelect);

        // Draw text
        const textX = iconX + iconSize + Math.round(pxPerUnit * 0.12);
        const textAreaWidth = canvas.width - textX - margin;

        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Font sizes proportional to canvas height
        const mainFontSize = Math.round(heightPx * 0.35);
        const subFontSize = Math.round(mainFontSize * 0.7);

        // Main text
        ctx.font = `bold ${mainFontSize}px Arial`;
        const textY = subTexts.length > 0 ? iconY + Math.round(iconSize * 0.1) : iconY + Math.round(iconSize * 0.3);

        if (mainTexts.length === 0) {
            const defaultTexts = ['M3', 'M3', 'M3'];
            const columnWidth = textAreaWidth / defaultTexts.length;
            defaultTexts.forEach((text, index) => {
                ctx.fillText(text, textX + (index * columnWidth), textY);
            });
        } else {
            const columnWidth = textAreaWidth / mainTexts.length;
            mainTexts.forEach((text, index) => {
                ctx.fillText(text, textX + (index * columnWidth), textY);
            });
        }

        // Sub text
        ctx.font = `${subFontSize}px Arial`;
        ctx.fillStyle = 'black';
        const subTextY = textY + Math.round(mainFontSize * 1.15);

        if (subTexts.length === 0) {
            const defaultSubTexts = ['8 mm', '10 mm', '12 mm'];
            const columnWidth = textAreaWidth / defaultSubTexts.length;
            defaultSubTexts.forEach((text, index) => {
                ctx.fillText(text, textX + (index * columnWidth), subTextY);
            });
        } else {
            const columnWidth = textAreaWidth / subTexts.length;
            subTexts.forEach((text, index) => {
                ctx.fillText(text, textX + (index * columnWidth), subTextY);
            });
        }

        // Threshold to 1-bit black/white for thermal printing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const thresholdVal = 140;
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
            const bw = gray < thresholdVal ? 0 : 255;
            data[i] = data[i+1] = data[i+2] = bw;
        }
        ctx.putImageData(imageData, 0, 0);

        return canvas;
    }

    async printLabel() {
        if (!this.printerConnected || !this.niimbotClient) {
            this.showPrinterMessage('No printer connected. Click Connect first.', 'danger');
            return;
        }

        if (this.isPrinting) {
            this.showPrinterMessage('Print already in progress...', 'muted');
            return;
        }

        const printBtn = document.getElementById('printer-print');
        const progressContainer = document.getElementById('printer-progress-container');
        const progressBar = document.getElementById('printer-progress-bar');

        let printTask;
        try {
            this.isPrinting = true;
            printBtn.disabled = true;
            printBtn.textContent = '\u{23F3} Printing...';
            progressContainer.style.display = 'block';
            this.setProgress(0);
            this.showPrinterMessage('Rendering label...', 'muted');

            const meta = this.niimbotClient.getModelMetadata();
            const printDirection = meta?.printDirection || 'left';
            const printheadPixels = meta?.printheadPixels || 96;
            const labelWidthMm = parseInt(document.getElementById('label-width').value);
            const labelHeightMm = parseInt(document.getElementById('label-height').value);
            const dpi = meta?.dpi || 203;
            const mmToPx = dpi / 25.4;

            // Column axis must equal printheadPixels
            let canvasW, canvasH;
            if (printDirection === 'left') {
                canvasH = printheadPixels;
                canvasW = Math.round(labelWidthMm * mmToPx);
            } else {
                canvasW = printheadPixels;
                canvasH = Math.round(labelHeightMm * mmToPx);
            }



            const canvas = await this.renderForPrinterNative(canvasW, canvasH);

            const encoded = niimbluelib.ImageEncoder.encodeCanvas(canvas, printDirection);

            const model = document.getElementById('printer-model').value;
            const density = parseInt(document.getElementById('printer-density').value);
            const quantity = parseInt(document.getElementById('printer-quantity').value) || 1;

            const printerInfo = this.niimbotClient.getPrinterInfo();
            const taskType = this.niimbotClient.getPrintTaskType() || model;

            const clampedDensity = Math.max(
                meta?.densityMin ?? 1,
                Math.min(meta?.densityMax ?? 5, density)
            );

            const labelType = printerInfo.labelType ?? 1;

            this.showPrinterMessage('Printing...', 'muted');

            // Stop heartbeat to prevent packet collisions during print
            this.niimbotClient.stopHeartbeat();

            printTask = this.niimbotClient.abstraction.newPrintTask(taskType, {
                totalPages: quantity,
                density: clampedDensity,
                speed: 1,
                labelType: labelType,
                statusPollIntervalMs: 100,
                statusTimeoutMs: 8_000,
            });

            await printTask.printInit();
            this.setProgress(10);

            await printTask.printPage(encoded, quantity);
            this.setProgress(50);

            const progressListener = (e) => {
                const pct = Math.floor((e.page / quantity) * ((e.pagePrintProgress + e.pageFeedProgress) / 2));
                this.setProgress(50 + (pct * 0.4));
            };
            this.niimbotClient.on('printprogress', progressListener);

            await printTask.waitForFinished();
            this.niimbotClient.off('printprogress', progressListener);
            this.setProgress(90);

        } catch (error) {
            console.error('[Printer] Print failed:', error);
            this.showPrinterMessage(`Print failed: ${error.message}`, 'danger');
            this._printFailed = true;
        } finally {
            try {
                if (printTask) {
                    await printTask.printEnd();
                } else if (this.niimbotClient?.abstraction) {
                    await this.niimbotClient.abstraction.printEnd();
                }
            } catch (_) {}

            try { this.niimbotClient.startHeartbeat(); } catch (_) {}

            if (!this._printFailed) {
                this.setProgress(100);
                const qty = document.getElementById('printer-quantity')?.value || 1;
                this.showPrinterMessage(`\u{2705} Print complete! (${qty} label(s))`, 'success');
            }
            delete this._printFailed;

            // Hide progress bar after a delay
            setTimeout(() => {
                const pc = document.getElementById('printer-progress-container');
                if (pc) pc.style.display = 'none';
                this.setProgress(0);
            }, 3000);

            this.isPrinting = false;
            printBtn.disabled = !this.printerConnected;
            printBtn.textContent = '\u{1F5A8}\uFE0F Print Label';
        }
    }

    updatePrintProgress(e) {
        if (!e) return;
        // Calculate overall progress (10-90% range, leaving room for init/end)
        let progress = 10;
        if (e.pagePrintProgress !== undefined) {
            progress = 10 + (e.pagePrintProgress * 0.7);
        }
        if (e.pageFeedProgress !== undefined) {
            progress = Math.max(progress, 80 + (e.pageFeedProgress * 0.1));
        }
        this.setProgress(Math.min(90, Math.round(progress)));
    }

    setProgress(percent) {
        const bar = document.getElementById('printer-progress-bar');
        if (bar) {
            bar.style.width = `${percent}%`;
            bar.textContent = `${percent}%`;
            bar.setAttribute('aria-valuenow', percent);
        }
    }

    updatePrinterUI(connected) {
        const connectBtn = document.getElementById('printer-connect');
        const disconnectBtn = document.getElementById('printer-disconnect');
        const printBtn = document.getElementById('printer-print');
        const statusBadge = document.getElementById('printer-status-badge');
        const infoRow = document.getElementById('printer-info');

        if (connected) {
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'inline-block';
            printBtn.disabled = false;
            statusBadge.className = 'badge bg-success';
            statusBadge.textContent = 'Connected';
        } else {
            connectBtn.style.display = 'inline-block';
            connectBtn.disabled = false;
            connectBtn.textContent = '\u{1F517} Connect Printer';
            disconnectBtn.style.display = 'none';
            printBtn.disabled = true;
            statusBadge.className = 'badge bg-secondary';
            statusBadge.textContent = 'Disconnected';
            if (infoRow) infoRow.style.display = 'none';
        }
    }

    showPrinterMessage(text, type = 'muted') {
        const msg = document.getElementById('printer-message');
        if (!msg) return;
        msg.style.display = 'block';
        msg.className = `mt-2 small text-${type}`;
        msg.textContent = text;

        // Auto-hide success/info messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (msg.textContent === text) {
                    msg.style.display = 'none';
                }
            }, 5000);
        }
    }

    loadPrinterSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem('printerSettings') || '{}');
            if (saved.model) {
                const modelSelect = document.getElementById('printer-model');
                if (modelSelect) modelSelect.value = saved.model;
            }
            if (saved.density) {
                const densitySlider = document.getElementById('printer-density');
                const densityValue = document.getElementById('density-value');
                if (densitySlider) densitySlider.value = saved.density;
                if (densityValue) densityValue.textContent = saved.density;
            }
            if (saved.quantity) {
                const quantityInput = document.getElementById('printer-quantity');
                if (quantityInput) quantityInput.value = saved.quantity;
            }
            if (saved.connectionMode) {
                const radio = document.getElementById(
                    saved.connectionMode === 'bluetooth' ? 'conn-mode-ble' : 'conn-mode-serial'
                );
                if (radio && !radio.disabled) radio.checked = true;
            }
        } catch (error) {
            console.warn('[Printer] Could not load settings:', error);
        }
    }

    savePrinterSettings() {
        try {
            const settings = {
                model: document.getElementById('printer-model')?.value || 'D110',
                density: document.getElementById('printer-density')?.value || '3',
                quantity: document.getElementById('printer-quantity')?.value || '1',
                connectionMode: this.getConnectionMode(),
            };
            localStorage.setItem('printerSettings', JSON.stringify(settings));
        } catch (error) {
            console.warn('[Printer] Could not save settings:', error);
        }
    }
}


let labelMaker;

document.addEventListener('DOMContentLoaded', () => {
    labelMaker = new LabelMaker();
});
