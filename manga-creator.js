// ========================================
// NanoComic Canvas - Manga Creation Tool
// ========================================

// ========================================
// Data Definitions
// ========================================

const styles = [
    { id: 'webtoon', label: 'Webtoon (縦スクロール)', prompt: "webtoon style, full color, vibrant colors, digital art, high resolution, vertical scrolling comic format, 8k wallpaper, highly detailed, sharp focus" },
    { id: 'comic_book', label: 'カラーコミック (縦長ページ)', prompt: "full color comic page, american comic style, detailed lineart, vivid colors, vertical aspect ratio, --ar 2:3, dynamic shading, comic book inking" },
    { id: 'anime_color', label: 'アニメ塗り (高品質)', prompt: "full color anime manga, cel shading, high quality, vivid colors, detailed background, crisp lines, studio anime style, --ar 2:3, kyoto animation style, ufotable style" },
    { id: 'modern_manga', label: '日本の漫画 (モノクロ)', prompt: "modern manga style, monochrome, manga screentones, high quality, detailed lineart, ink drawing, traditional media, g-pen texture, --ar 2:3, shonen manga style, high contrast" },
];

const colorThemes = [
    { id: 'vibrant', label: '昼・明るい (Vibrant)', prompt: "vibrant lighting, daylight, cheerful atmosphere, high saturation, sunny day, lens flare, bright colors" },
    { id: 'sunset', label: '夕方・ドラマチック', prompt: "sunset lighting, orange and purple hues, dramatic shadows, golden hour, emotional lighting, ray tracing, cinematic light" },
    { id: 'night', label: '夜・シネマティック', prompt: "night time, dark atmosphere, moonlight, cinematic lighting, blue tones, city lights, neon lights, glowing eyes" },
    { id: 'gloomy', label: '曇り・シリアス', prompt: "desaturated colors, rainy, gloomy atmosphere, cool tones, grey sky, depressed mood, heavy clouds, dramatic atmosphere" },
    { id: 'horror', label: 'ホラー・不気味', prompt: "dark, horror atmosphere, eerie lighting, high contrast, red and black, suspense, volumetric lighting, scary ambience" }
];

const panelTypes = [
    { id: 'medium_shot', label: 'バストアップ', prompt: "medium shot, upper body, focus on character interaction" },
    { id: 'close_up', label: '顔アップ', prompt: "extreme close-up shot, focus on eyes and face, emotional impact" },
    { id: 'wide_shot', label: '風景・遠景', prompt: "wide shot, scenery focus, establishing shot, environmental view" },
    { id: 'full_body', label: '全身', prompt: "full body shot, showing outfit, dynamic pose, head to toe" },
    { id: 'dutch_angle', label: '斜め構図', prompt: "dutch angle, dynamic perspective, tilted camera, action framing" },
    { id: 'from_above', label: '俯瞰(上から)', prompt: "high angle view, bird's eye view, from above" },
    { id: 'from_below', label: 'アオリ(下から)', prompt: "low angle view, worm's eye view, from below" }
];

// Layout Templates
const layoutTemplates = [
    {
        id: '1_full', label: '1コマ', icon: 'square',
        panels: [{ colSpan: 12, height: 900 }]
    },
    {
        id: '2_vert', label: '2コマ(縦)', icon: 'rows',
        panels: [{ colSpan: 12, height: 450 }, { colSpan: 12, height: 450 }]
    },
    {
        id: '2_diag', label: '2コマ(斜)', icon: 'spline',
        panels: [
            { colSpan: 12, height: 450, corners: { tl:{x:0,y:0}, tr:{x:100,y:0}, br:{x:100,y:80}, bl:{x:0,y:100} } },
            { colSpan: 12, height: 450, corners: { tl:{x:0,y:20}, tr:{x:100,y:0}, br:{x:100,y:100}, bl:{x:0,y:100} } }
        ]
    },
    {
        id: '3_vert', label: '3コマ(縦)', icon: 'rows',
        panels: [{ colSpan: 12, height: 300 }, { colSpan: 12, height: 300 }, { colSpan: 12, height: 300 }]
    },
    {
        id: '3_t', label: '3コマ(T字)', icon: 'layout',
        panels: [{ colSpan: 12, height: 450 }, { colSpan: 6, height: 450 }, { colSpan: 6, height: 450 }]
    },
    {
        id: '4_koma', label: '4コマ漫画', icon: 'stretch',
        panels: [{ colSpan: 12, height: 225 }, { colSpan: 12, height: 225 }, { colSpan: 12, height: 225 }, { colSpan: 12, height: 225 }]
    },
    {
        id: '4_grid', label: '4コマ(田)', icon: 'grid',
        panels: [{ colSpan: 6, height: 450 }, { colSpan: 6, height: 450 }, { colSpan: 6, height: 450 }, { colSpan: 6, height: 450 }]
    },
    {
        id: '5_std', label: '5コマ(王道)', icon: 'layout',
        panels: [{ colSpan: 12, height: 300 }, { colSpan: 6, height: 300 }, { colSpan: 6, height: 300 }, { colSpan: 6, height: 300 }, { colSpan: 6, height: 300 }]
    },
    {
        id: '6_grid', label: '6コマ', icon: 'grid',
        panels: Array(6).fill(null).map(() => ({ colSpan: 6, height: 300 }))
    },
    {
        id: 'action', label: 'アクション', icon: 'spline',
        panels: [
            { colSpan: 12, height: 300, corners: { tl:{x:0,y:0}, tr:{x:100,y:0}, br:{x:100,y:90}, bl:{x:0,y:100} } },
            { colSpan: 5, height: 600, corners: { tl:{x:0,y:10}, tr:{x:100,y:0}, br:{x:80,y:100}, bl:{x:0,y:100} } },
            { colSpan: 7, height: 600, corners: { tl:{x:20,y:0}, tr:{x:100,y:10}, br:{x:100,y:100}, bl:{x:0,y:90} } }
        ]
    },
];

// Template Icons SVG
const templateIcons = {
    square: '<rect x="4" y="4" width="16" height="16" rx="2"/>',
    rows: '<rect x="4" y="4" width="16" height="6" rx="1"/><rect x="4" y="14" width="16" height="6" rx="1"/>',
    spline: '<path d="M4 4h16l-4 8H8l-4 8"/>',
    layout: '<rect x="4" y="4" width="16" height="8" rx="1"/><rect x="4" y="14" width="7" height="6" rx="1"/><rect x="13" y="14" width="7" height="6" rx="1"/>',
    stretch: '<rect x="4" y="2" width="16" height="4" rx="1"/><rect x="4" y="8" width="16" height="4" rx="1"/><rect x="4" y="14" width="16" height="4" rx="1"/><rect x="4" y="20" width="16" height="2" rx="1"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>'
};

// ========================================
// State Management
// ========================================

let state = {
    pages: [],
    activePageIndex: 0,
    activeSceneIndex: null,
    apiKey: '',
    isGenerating: false,
    isAnalyzingLayout: false,
    dragState: null,
    dragItemIndex: null,
    dragOverItemIndex: null
};

// ========================================
// Helper Functions
// ========================================

function createNewScene(idOffset = 0, overrides = {}) {
    return {
        id: Date.now() + idOffset,
        panelType: 'medium_shot',
        characterCount: 1,
        characters: [
            { id: 1, name: '', tags: '', expression: '', dialogue: '', image: null }
        ],
        background: '',
        sfx: '',
        activeTab: 1,
        layout: {
            colSpan: 12,
            height: 200,
            corners: {
                tl: { x: 0, y: 0 },
                tr: { x: 100, y: 0 },
                br: { x: 100, y: 100 },
                bl: { x: 0, y: 100 }
            },
            padding: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            },
            ...overrides
        }
    };
}

function createInitialPageData() {
    return {
        id: Date.now(),
        style: 'comic_book',
        colorTheme: 'vibrant',
        scenes: [
            createNewScene(0, { colSpan: 12, height: 450 }),
            createNewScene(1, { colSpan: 6, height: 450 }),
            createNewScene(2, { colSpan: 6, height: 450 })
        ]
    };
}

function getActivePage() {
    return state.pages[state.activePageIndex];
}

function getClipPath(corners) {
    return `polygon(${corners.tl.x}% ${corners.tl.y}%, ${corners.tr.x}% ${corners.tr.y}%, ${corners.br.x}% ${corners.br.y}%, ${corners.bl.x}% ${corners.bl.y}%)`;
}

function getSvgPoints(corners) {
    return `${corners.tl.x},${corners.tl.y} ${corners.tr.x},${corners.tr.y} ${corners.br.x},${corners.br.y} ${corners.bl.x},${corners.bl.y}`;
}

// ========================================
// Prompt Generation
// ========================================

function generatePromptTextForPage(data, pageIndex) {
    const parts = [];
    if (pageIndex > 0) parts.push("Maintain consistent appearance for characters with the same name.");

    const styleDef = styles.find(s => s.id === data.style) || styles[0];
    const colorDef = colorThemes.find(c => c.id === data.colorTheme) || colorThemes[0];

    parts.push(`(vertical comic page:1.5), (aspect ratio 2:3), (masterpiece:1.3), (best quality), (8k resolution)`);
    parts.push(`(${styleDef.prompt})`);
    if (data.style !== 'modern_manga') parts.push(`(${colorDef.prompt})`);

    const panelCount = data.scenes.length;
    parts.push(`${panelCount} panels layout, clear white borders`);

    data.scenes.forEach((scene, index) => {
        const panelDef = panelTypes.find(p => p.id === scene.panelType);
        parts.push(`\n--- Panel ${index + 1} ---`);
        const sceneParts = [];
        sceneParts.push(panelDef.prompt);

        const c = scene.layout.corners;
        if (c.tl.x > 20 || c.bl.x > 20) sceneParts.push("diagonal panel border (left side)");
        if (c.tr.x < 80 || c.br.x < 80) sceneParts.push("diagonal panel border (right side)");

        sceneParts.push(scene.background ? `Background: ${scene.background}` : "simple background");

        const hasDialogue = scene.characters.some(c => c.dialogue && c.dialogue.trim() !== '');
        if (scene.characters.length === 1) {
            const char = scene.characters[0];
            sceneParts.push(`1 person, solo, ${char.name ? `Character: ${char.name}` : ''}`);
            if (char.tags) sceneParts.push(`Appearance: (${char.tags})`);
            if (char.expression) sceneParts.push(`Expression: (${char.expression})`);
            if (char.dialogue) sceneParts.push(`speech bubble: "${char.dialogue}"`);
        } else {
            sceneParts.push(`${scene.characters.length} people, interaction`);
            scene.characters.forEach((char, idx) => {
                let desc = `Char${idx+1}: [${char.tags || 'person'}]`;
                if (char.expression) desc += `, [${char.expression}]`;
                sceneParts.push(desc);
            });
        }
        if (!hasDialogue) sceneParts.push("no text");
        if (scene.sfx) sceneParts.push(`SFX: "${scene.sfx}"`);
        parts.push(sceneParts.join(', '));
    });

    return parts.filter(p => p.trim() !== '').join('\n');
}

function updatePromptDisplay() {
    const textarea = document.getElementById('promptTextarea');
    if (textarea) {
        textarea.value = generatePromptTextForPage(getActivePage(), state.activePageIndex);
    }
}

// ========================================
// Render Functions
// ========================================

function renderPages() {
    const container = document.getElementById('pagesList');
    if (!container) return;

    container.innerHTML = state.pages.map((page, index) => `
        <div class="page-item ${state.activePageIndex === index ? 'active' : ''}" data-index="${index}">
            <div class="page-header">
                <span class="page-number">P.${index + 1}</span>
                ${state.pages.length > 1 ? `
                    <button class="page-delete" data-index="${index}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"></path>
                        </svg>
                    </button>
                ` : ''}
            </div>
            <div class="page-preview">
                ${page.scenes.map(s => `<div class="page-preview-panel" style="width: ${(s.layout.colSpan/12)*100}%"></div>`).join('')}
            </div>
        </div>
    `).join('');

    // Attach event listeners
    container.querySelectorAll('.page-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.page-delete')) {
                state.activePageIndex = parseInt(item.dataset.index);
                state.activeSceneIndex = null;
                render();
            }
        });
    });

    container.querySelectorAll('.page-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            if (state.pages.length > 1) {
                state.pages.splice(index, 1);
                if (state.activePageIndex >= index && state.activePageIndex > 0) {
                    state.activePageIndex--;
                }
                render();
            }
        });
    });
}

function renderTemplates() {
    const container = document.getElementById('templateGrid');
    if (!container) return;

    container.innerHTML = layoutTemplates.map(tmpl => `
        <button class="template-btn" data-id="${tmpl.id}" title="${tmpl.label}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${templateIcons[tmpl.icon] || templateIcons.layout}
            </svg>
            <span class="template-label">${tmpl.label}</span>
        </button>
    `).join('');

    container.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const template = layoutTemplates.find(t => t.id === btn.dataset.id);
            if (template) applyTemplate(template);
        });
    });
}

function renderSceneEditor() {
    const noSceneEl = document.getElementById('noSceneSelected');
    const contentEl = document.getElementById('sceneEditorContent');

    if (state.activeSceneIndex === null) {
        noSceneEl.classList.remove('hidden');
        contentEl.classList.add('hidden');
        return;
    }

    noSceneEl.classList.add('hidden');
    contentEl.classList.remove('hidden');

    const scene = getActivePage().scenes[state.activeSceneIndex];

    document.getElementById('sceneTitle').textContent = `コマ #${state.activeSceneIndex + 1} 詳細`;
    document.getElementById('panelTypeSelect').value = scene.panelType;
    document.getElementById('backgroundInput').value = scene.background;
    document.getElementById('sfxInput').value = scene.sfx;

    // Padding sliders
    document.getElementById('paddingTop').value = scene.layout.padding?.top || 0;
    document.getElementById('paddingBottom').value = scene.layout.padding?.bottom || 0;
    document.getElementById('paddingLeft').value = scene.layout.padding?.left || 0;
    document.getElementById('paddingRight').value = scene.layout.padding?.right || 0;

    renderCharacters();
}

function renderCharacters() {
    if (state.activeSceneIndex === null) return;

    const container = document.getElementById('charactersList');
    const scene = getActivePage().scenes[state.activeSceneIndex];

    container.innerHTML = scene.characters.map((char, idx) => `
        <div class="character-card" data-index="${idx}">
            <button class="character-delete" data-index="${idx}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
            <div class="character-row">
                <input type="text" class="character-name-input" data-field="name" value="${char.name}" placeholder="名前">
                <label class="character-upload-btn">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17,8 12,3 7,8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <input type="file" accept="image/*" class="character-image-input" hidden>
                </label>
            </div>
            <textarea class="character-tags-input" data-field="tags" placeholder="容姿タグ">${char.tags}</textarea>
            <input type="text" class="character-dialogue-input" data-field="dialogue" value="${char.dialogue}" placeholder="セリフ">
        </div>
    `).join('');

    // Attach event listeners
    container.querySelectorAll('.character-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index);
            scene.characters.splice(idx, 1);
            if (scene.characters.length === 0) {
                scene.characters.push({ id: 1, name: '', tags: '', expression: '', dialogue: '', image: null });
            }
            render();
        });
    });

    container.querySelectorAll('.character-name-input, .character-tags-input, .character-dialogue-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const card = e.target.closest('.character-card');
            const charIdx = parseInt(card.dataset.index);
            const field = e.target.dataset.field;
            scene.characters[charIdx][field] = e.target.value;
            renderPanels();
            updatePromptDisplay();
        });
    });

    container.querySelectorAll('.character-image-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const card = e.target.closest('.character-card');
            const charIdx = parseInt(card.dataset.index);
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    scene.characters[charIdx].image = reader.result;
                    renderPanels();
                };
                reader.readAsDataURL(file);
            }
        });
    });
}

function renderPanels() {
    const container = document.getElementById('panelsGrid');
    if (!container) return;

    const page = getActivePage();

    container.innerHTML = page.scenes.map((scene, index) => {
        const isSelected = state.activeSceneIndex === index;
        const themeClass = page.colorTheme === 'night' ? 'theme-night' : 'theme-default';
        const padding = scene.layout.padding || { top: 0, bottom: 0, left: 0, right: 0 };

        const paddingStyle = `
            top: ${padding.top}%;
            bottom: ${padding.bottom}%;
            left: ${padding.left}%;
            right: ${padding.right}%;
        `;

        return `
            <div class="panel ${isSelected ? 'selected' : ''}"
                 id="panel-${scene.id}"
                 data-index="${index}"
                 draggable="true"
                 style="grid-column: span ${scene.layout.colSpan}; height: ${scene.layout.height}px;">

                <div class="panel-inner ${themeClass}"
                     style="${paddingStyle}; clip-path: ${getClipPath(scene.layout.corners)};">

                    <svg class="panel-border" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polygon
                            points="${getSvgPoints(scene.layout.corners)}"
                            fill="none"
                            stroke="${isSelected ? '#3b82f6' : 'black'}"
                            stroke-width="${isSelected ? '4' : '2'}"
                            vector-effect="non-scaling-stroke"
                        />
                    </svg>

                    <div class="panel-content" dir="ltr">
                        <span class="panel-number">#${index + 1}</span>
                        ${scene.sfx ? `<div class="panel-sfx">${scene.sfx}</div>` : ''}

                        <div class="panel-characters">
                            ${scene.characters.map((char, i) => `
                                <div class="panel-character">
                                    ${char.image ?
                                        `<img src="${char.image}" class="character-avatar">` :
                                        `<div class="character-placeholder">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                        </div>`
                                    }
                                    ${char.dialogue ? `
                                        <div class="character-dialogue">
                                            <p>${char.dialogue}</p>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="drag-handle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="5" r="1"></circle>
                        <circle cx="9" cy="12" r="1"></circle>
                        <circle cx="9" cy="19" r="1"></circle>
                        <circle cx="15" cy="5" r="1"></circle>
                        <circle cx="15" cy="12" r="1"></circle>
                        <circle cx="15" cy="19" r="1"></circle>
                    </svg>
                </div>

                <div class="panel-size-badge">${scene.layout.colSpan}/12</div>

                ${isSelected ? `
                    <div class="resize-handle-w" data-index="${index}">
                        <div class="resize-handle-w-inner"></div>
                    </div>
                    <div class="resize-handle-h" data-index="${index}">
                        <div class="resize-handle-h-inner"></div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    // Add corner handles overlay
    renderCornerHandles();

    // Attach panel event listeners
    attachPanelEventListeners();
}

function renderCornerHandles() {
    // Remove existing overlay
    const existingOverlay = document.querySelector('.corner-handles-overlay');
    if (existingOverlay) existingOverlay.remove();

    if (state.activeSceneIndex === null) return;

    const container = document.getElementById('canvasWrapper');
    const page = getActivePage();

    const overlay = document.createElement('div');
    overlay.className = 'corner-handles-overlay';

    page.scenes.forEach((scene, index) => {
        if (index !== state.activeSceneIndex) {
            const spacer = document.createElement('div');
            spacer.className = 'corner-handle-spacer';
            spacer.style.gridColumn = `span ${scene.layout.colSpan}`;
            spacer.style.height = `${scene.layout.height}px`;
            overlay.appendChild(spacer);
            return;
        }

        const padding = scene.layout.padding || { top: 0, bottom: 0, left: 0, right: 0 };

        const wrapper = document.createElement('div');
        wrapper.className = 'corner-handle-wrapper';
        wrapper.style.gridColumn = `span ${scene.layout.colSpan}`;
        wrapper.style.height = `${scene.layout.height}px`;
        wrapper.style.paddingTop = `${padding.top}%`;
        wrapper.style.paddingBottom = `${padding.bottom}%`;
        wrapper.style.paddingLeft = `${padding.left}%`;
        wrapper.style.paddingRight = `${padding.right}%`;
        wrapper.style.position = 'relative';

        const innerWrapper = document.createElement('div');
        innerWrapper.style.width = '100%';
        innerWrapper.style.height = '100%';
        innerWrapper.style.position = 'relative';

        Object.entries(scene.layout.corners).forEach(([key, pos]) => {
            const handle = document.createElement('div');
            handle.className = 'corner-handle';
            handle.dataset.sceneIndex = index;
            handle.dataset.cornerKey = key;
            handle.style.left = `${pos.x}%`;
            handle.style.top = `${pos.y}%`;
            handle.innerHTML = '<div class="corner-handle-dot"></div>';
            innerWrapper.appendChild(handle);
        });

        wrapper.appendChild(innerWrapper);
        overlay.appendChild(wrapper);
    });

    container.appendChild(overlay);

    // Attach corner handle event listeners
    overlay.querySelectorAll('.corner-handle').forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            const sceneIndex = parseInt(handle.dataset.sceneIndex);
            const cornerKey = handle.dataset.cornerKey;
            const scene = page.scenes[sceneIndex];

            state.dragState = {
                type: 'corner',
                sceneIndex,
                cornerKey,
                startX: e.clientX,
                startY: e.clientY,
                startVal: { ...scene.layout.corners[cornerKey] }
            };
        });
    });
}

function attachPanelEventListeners() {
    const container = document.getElementById('panelsGrid');
    const page = getActivePage();

    // Panel click
    container.querySelectorAll('.panel').forEach(panel => {
        panel.addEventListener('click', (e) => {
            e.stopPropagation();
            state.activeSceneIndex = parseInt(panel.dataset.index);
            render();
        });
    });

    // Drag and drop for sorting
    container.querySelectorAll('.panel').forEach(panel => {
        panel.addEventListener('dragstart', (e) => {
            state.dragItemIndex = parseInt(panel.dataset.index);
            panel.classList.add('dragging');
        });

        panel.addEventListener('dragenter', (e) => {
            e.preventDefault();
            state.dragOverItemIndex = parseInt(panel.dataset.index);
            panel.classList.add('drag-over');
        });

        panel.addEventListener('dragleave', () => {
            panel.classList.remove('drag-over');
        });

        panel.addEventListener('dragend', () => {
            panel.classList.remove('dragging');
            container.querySelectorAll('.panel').forEach(p => p.classList.remove('drag-over'));

            if (state.dragItemIndex !== null && state.dragOverItemIndex !== null &&
                state.dragItemIndex !== state.dragOverItemIndex) {
                const scenes = [...page.scenes];
                const dragItem = scenes[state.dragItemIndex];
                scenes.splice(state.dragItemIndex, 1);
                scenes.splice(state.dragOverItemIndex, 0, dragItem);
                page.scenes = scenes;
                state.activeSceneIndex = state.dragOverItemIndex;
                render();
            }

            state.dragItemIndex = null;
            state.dragOverItemIndex = null;
        });

        panel.addEventListener('dragover', (e) => e.preventDefault());
    });

    // Resize handles
    container.querySelectorAll('.resize-handle-w').forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            const index = parseInt(handle.dataset.index);
            state.dragState = {
                type: 'resize-w',
                sceneIndex: index,
                startX: e.clientX,
                startVal: page.scenes[index].layout.colSpan
            };
        });
    });

    container.querySelectorAll('.resize-handle-h').forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            const index = parseInt(handle.dataset.index);
            state.dragState = {
                type: 'resize-h',
                sceneIndex: index,
                startY: e.clientY,
                startVal: page.scenes[index].layout.height
            };
        });
    });
}

function updateStyleSelects() {
    const page = getActivePage();
    document.getElementById('styleSelect').value = page.style;
    document.getElementById('colorThemeSelect').value = page.colorTheme;
}

function render() {
    renderPages();
    updateStyleSelects();
    renderSceneEditor();
    renderPanels();
    updatePromptDisplay();
}

// ========================================
// Actions
// ========================================

function addPage() {
    const newId = state.pages.length > 0 ? Math.max(...state.pages.map(p => p.id)) + 1 : 1;
    const newPage = createInitialPageData();
    newPage.id = newId;
    newPage.scenes = [createNewScene(0, { colSpan: 12, height: 250 })];
    state.pages.push(newPage);
    state.activePageIndex = state.pages.length - 1;
    state.activeSceneIndex = null;
    render();
}

function addScene() {
    const page = getActivePage();
    page.scenes.push(createNewScene());
    render();
}

function deleteScene(index) {
    const page = getActivePage();
    if (page.scenes.length > 1) {
        page.scenes.splice(index, 1);
        state.activeSceneIndex = null;
        render();
    }
}

function applyTemplate(template) {
    const page = getActivePage();
    const currentScenes = [...page.scenes];

    const newScenes = template.panels.map((panelLayout, index) => {
        const defaultCorners = { tl: { x: 0, y: 0 }, tr: { x: 100, y: 0 }, br: { x: 100, y: 100 }, bl: { x: 0, y: 100 } };

        if (index < currentScenes.length) {
            return {
                ...currentScenes[index],
                layout: {
                    ...createNewScene().layout,
                    ...panelLayout,
                    corners: panelLayout.corners || defaultCorners,
                }
            };
        } else {
            return createNewScene(index, {
                ...panelLayout,
                corners: panelLayout.corners || defaultCorners
            });
        }
    });

    page.scenes = newScenes;
    state.activeSceneIndex = null;
    render();
}

function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        // Show feedback
        const btn = document.getElementById('copyAllBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> コピー完了';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    });
}

function copyAllPages() {
    const all = state.pages.map((p, i) => `Page ${i + 1}\n` + generatePromptTextForPage(p, i)).join('\n\n');
    copyToClipboard(all);
}

// ========================================
// API Functions
// ========================================

async function analyzeLayoutFromImage(file) {
    if (!state.apiKey) {
        document.getElementById('settingsModal').classList.remove('hidden');
        return;
    }

    state.isAnalyzingLayout = true;
    document.getElementById('loadingOverlay').classList.remove('hidden');
    document.getElementById('layoutImportLabel').classList.add('loading');
    document.getElementById('layoutImportText').textContent = 'レイアウト解析中...';
    document.getElementById('layoutError').classList.add('hidden');
    document.getElementById('layoutSuccess').classList.add('hidden');

    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];

        const systemInstruction = `
            You are an expert Comic Layout Analyzer.
            Map the comic panels in the provided image to a sequential grid layout (Right-to-Left, Top-to-Bottom).

            OUTPUT FORMAT: JSON Array of Objects.

            For EACH panel, output exactly this structure:
            {
              "col_span": number,
              "height_px": number,
              "shape": "rect" | "polygon",
              "corners": {
                 "tl": { "x": 0, "y": 0 },
                 "tr": { "x": 100, "y": 0 },
                 "bl": { "x": 0, "y": 100 },
                 "br": { "x": 100, "y": 100 }
              }
            }

            IMPORTANT:
            - If the panel is a simple rectangle, return "shape": "rect" and standard corners.
            - If the panel has a diagonal cut, set "shape": "polygon" and adjust the corner "x" or "y" values.
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${state.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "Analyze the layout and return the JSON array." },
                            { inline_data: { mime_type: file.type, data: base64Data } }
                        ]
                    }],
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    },
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                })
            });

            const result = await response.json();
            if (result.error) throw new Error(result.error.message);

            let text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("AIからの応答が空でした");

            let layoutData;
            try {
                const cleanedText = text.replace(/```json|```/g, '').trim();
                layoutData = JSON.parse(cleanedText);
            } catch (e) {
                const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
                if (jsonMatch) {
                    layoutData = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("レイアウトデータの形式が正しくありません");
                }
            }

            if (!Array.isArray(layoutData)) {
                if (layoutData.panels && Array.isArray(layoutData.panels)) {
                    layoutData = layoutData.panels;
                } else {
                    layoutData = [layoutData];
                }
            }

            if (layoutData.length === 0) throw new Error("パネルが検出されませんでした");

            const newScenes = layoutData.map((panel, index) => {
                let colSpan = parseInt(panel.col_span);
                if (isNaN(colSpan) || colSpan < 1) colSpan = 12;
                colSpan = Math.min(12, colSpan);

                let height = parseInt(panel.height_px);
                if (isNaN(height) || height < 50) height = 300;

                let corners = { tl: { x: 0, y: 0 }, tr: { x: 100, y: 0 }, br: { x: 100, y: 100 }, bl: { x: 0, y: 100 } };

                if (panel.corners) {
                    const getCoord = (c, defaultX, defaultY) => ({
                        x: (typeof c?.x === 'number') ? Math.max(-50, Math.min(150, c.x)) : defaultX,
                        y: (typeof c?.y === 'number') ? Math.max(-50, Math.min(150, c.y)) : defaultY
                    });

                    corners = {
                        tl: getCoord(panel.corners.tl, 0, 0),
                        tr: getCoord(panel.corners.tr, 100, 0),
                        br: getCoord(panel.corners.br, 100, 100),
                        bl: getCoord(panel.corners.bl, 0, 100)
                    };
                }

                return createNewScene(index, { colSpan, height, corners });
            });

            getActivePage().scenes = newScenes;
            state.activeSceneIndex = null;

            document.getElementById('layoutSuccess').textContent = `成功: ${newScenes.length}コマを認識しました`;
            document.getElementById('layoutSuccess').classList.remove('hidden');
            setTimeout(() => document.getElementById('layoutSuccess').classList.add('hidden'), 4000);

            render();

        } catch (error) {
            console.error("Layout Analysis Error:", error);
            document.getElementById('layoutError').textContent = "エラー: " + error.message;
            document.getElementById('layoutError').classList.remove('hidden');
        } finally {
            state.isAnalyzingLayout = false;
            document.getElementById('loadingOverlay').classList.add('hidden');
            document.getElementById('layoutImportLabel').classList.remove('loading');
            document.getElementById('layoutImportText').textContent = '画像からレイアウト読込';
            document.getElementById('layoutImportInput').value = '';
        }
    };
    reader.readAsDataURL(file);
}

async function generatePromptWithGemini() {
    if (!state.apiKey) {
        document.getElementById('settingsModal').classList.remove('hidden');
        return;
    }

    state.isGenerating = true;
    const btn = document.getElementById('generatePromptBtn');
    btn.innerHTML = '<div class="loading-spinner" style="width:8px;height:8px;border-width:1px;"></div> 生成中';
    btn.disabled = true;
    document.getElementById('promptError').classList.add('hidden');

    const data = getActivePage();
    const promptData = {
        style: data.style,
        theme: data.colorTheme,
        panels: data.scenes.map((s, i) => ({
            id: i + 1,
            type: s.panelType,
            bg: s.background,
            shape: JSON.stringify(s.layout.corners),
            chars: s.characters.map(c => ({ name: c.name, desc: c.tags, act: c.expression, dia: c.dialogue })),
            sfx: s.sfx
        }))
    };

    const systemInstruction = `Convert JSON to Stable Diffusion prompt. Rules: 1. Quality tags first. 2. Style tags. 3. Describe layout dynamically. 4. Detail each panel vividly.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${state.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemInstruction + "\nData:\n" + JSON.stringify(promptData) }] }]
            })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error.message);

        document.getElementById('promptTextarea').value = result.candidates?.[0]?.content?.parts?.[0]?.text || "Error";

    } catch (error) {
        document.getElementById('promptError').textContent = error.message;
        document.getElementById('promptError').classList.remove('hidden');
    } finally {
        state.isGenerating = false;
        btn.innerHTML = '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5"></path></svg> AI生成';
        btn.disabled = false;
    }
}

// ========================================
// Event Listeners
// ========================================

function initEventListeners() {
    // Settings modal
    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('hidden');
        document.getElementById('apiKeyInput').value = state.apiKey;
    });

    document.getElementById('closeSettingsBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('hidden');
    });

    document.querySelector('.modal-overlay').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('hidden');
    });

    document.getElementById('saveApiKeyBtn').addEventListener('click', () => {
        state.apiKey = document.getElementById('apiKeyInput').value;
        localStorage.setItem('gemini_api_key', state.apiKey);
        document.getElementById('settingsModal').classList.add('hidden');
        updateSettingsButtonStyle();
    });

    // Header actions
    document.getElementById('copyAllBtn').addEventListener('click', copyAllPages);
    document.getElementById('addPageBtn').addEventListener('click', addPage);

    // Style selects
    document.getElementById('styleSelect').addEventListener('change', (e) => {
        getActivePage().style = e.target.value;
        renderPanels();
        updatePromptDisplay();
    });

    document.getElementById('colorThemeSelect').addEventListener('change', (e) => {
        getActivePage().colorTheme = e.target.value;
        renderPanels();
        updatePromptDisplay();
    });

    // Layout import
    document.getElementById('layoutImportInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) analyzeLayoutFromImage(file);
    });

    // Scene editor
    document.getElementById('deleteSceneBtn').addEventListener('click', () => {
        if (state.activeSceneIndex !== null) {
            deleteScene(state.activeSceneIndex);
        }
    });

    document.getElementById('panelTypeSelect').addEventListener('change', (e) => {
        if (state.activeSceneIndex !== null) {
            getActivePage().scenes[state.activeSceneIndex].panelType = e.target.value;
            updatePromptDisplay();
        }
    });

    document.getElementById('backgroundInput').addEventListener('input', (e) => {
        if (state.activeSceneIndex !== null) {
            getActivePage().scenes[state.activeSceneIndex].background = e.target.value;
            updatePromptDisplay();
        }
    });

    document.getElementById('sfxInput').addEventListener('input', (e) => {
        if (state.activeSceneIndex !== null) {
            getActivePage().scenes[state.activeSceneIndex].sfx = e.target.value;
            renderPanels();
            updatePromptDisplay();
        }
    });

    // Padding sliders
    ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'].forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => {
            if (state.activeSceneIndex !== null) {
                const key = id.replace('padding', '').toLowerCase();
                getActivePage().scenes[state.activeSceneIndex].layout.padding[key] = parseInt(e.target.value);
                renderPanels();
            }
        });
    });

    // Add character
    document.getElementById('addCharacterBtn').addEventListener('click', () => {
        if (state.activeSceneIndex !== null) {
            const scene = getActivePage().scenes[state.activeSceneIndex];
            if (scene.characters.length < 5) {
                scene.characters.push({
                    id: scene.characters.length + 1,
                    name: '', tags: '', expression: '', dialogue: '', image: null
                });
                renderCharacters();
                renderPanels();
            }
        }
    });

    // Prompt generation
    document.getElementById('generatePromptBtn').addEventListener('click', generatePromptWithGemini);

    // Add scene
    document.getElementById('addSceneBtn').addEventListener('click', addScene);

    // Canvas container click (deselect)
    document.getElementById('canvasContainer').addEventListener('click', (e) => {
        if (e.target === e.currentTarget || e.target.closest('.canvas-wrapper') === document.getElementById('canvasWrapper')) {
            if (!e.target.closest('.panel') && !e.target.closest('.btn-add-scene')) {
                state.activeSceneIndex = null;
                render();
            }
        }
    });

    // Mouse move/up for resize and corner drag
    document.addEventListener('mousemove', (e) => {
        if (!state.dragState) return;
        e.preventDefault();

        const page = getActivePage();
        const scene = page.scenes[state.dragState.sceneIndex];

        if (state.dragState.type === 'resize-w') {
            const dx = e.clientX - state.dragState.startX;
            const sensitivity = 30;
            const deltaSpan = Math.round(dx / sensitivity);
            let newSpan = state.dragState.startVal - deltaSpan;
            newSpan = Math.max(1, Math.min(12, newSpan));
            scene.layout.colSpan = newSpan;
            renderPanels();
        } else if (state.dragState.type === 'resize-h') {
            const dy = e.clientY - state.dragState.startY;
            let newHeight = state.dragState.startVal + dy;
            newHeight = Math.max(50, newHeight);
            scene.layout.height = newHeight;
            renderPanels();
        } else if (state.dragState.type === 'corner') {
            const panelEl = document.getElementById(`panel-${scene.id}`);
            if (panelEl) {
                const rect = panelEl.getBoundingClientRect();
                const dx = e.clientX - state.dragState.startX;
                const dy = e.clientY - state.dragState.startY;
                const percentX = (dx / rect.width) * 100;
                const percentY = (dy / rect.height) * 100;

                let newX = state.dragState.startVal.x + percentX;
                let newY = state.dragState.startVal.y + percentY;

                newX = Math.max(-20, Math.min(120, newX));
                newY = Math.max(-20, Math.min(120, newY));

                scene.layout.corners[state.dragState.cornerKey] = { x: newX, y: newY };
                renderPanels();
            }
        }
    });

    document.addEventListener('mouseup', () => {
        state.dragState = null;
    });
}

function updateSettingsButtonStyle() {
    const btn = document.getElementById('settingsBtn');
    if (state.apiKey) {
        btn.classList.add('has-key');
    } else {
        btn.classList.remove('has-key');
    }
}

// ========================================
// Initialization
// ========================================

function init() {
    // Load API key from localStorage
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) state.apiKey = storedKey;
    updateSettingsButtonStyle();

    // Initialize with one page
    state.pages = [createInitialPageData()];

    // Render templates
    renderTemplates();

    // Render initial state
    render();

    // Initialize event listeners
    initEventListeners();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
