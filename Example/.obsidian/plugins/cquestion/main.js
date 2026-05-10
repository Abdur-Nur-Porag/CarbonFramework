"use strict";

const obsidian = require('obsidian');

// =====================================================================
// 1. DEFAULT CONFIGURATIONS & STATE
// =====================================================================

const DEFAULT_PLUGIN_SETTINGS = {
    history: [],      
    setTypeData: { Hard: [], Medium: [], Easy: [], Hint: [] }, 
    customTags: ["Hard", "Medium", "Easy", "Hint"], // Fixed typo in customTags from original prompt
    repetitionData: {}, 
    version: "4.2.0",   // Updated Version
    defaultLanguage: "en",
    enableDebug: false
};

const DEFAULT_QUIZ_CONFIG = {
    mode: "quiz",       
    name: "Custom Exam",
    show: "",           
    sources: [],
    folderSources: [],
    setType: [],        
    filter: "all",      
    startFrom: 1,       
    endTo: 0,           
    timer: true,        
    duration: 0,        
    markPerQ: 1,
    penalty: 0,
    passMark: 10,       
    formula: "({correct} * @markPerQ) - ({wrong} * @penalty)", 
    allowTags: true,    
    shuffle: false,     
    limit: 0,
    repetition: 0,      
    fontSize: "",
    pauseButton: false, // Toggle pause functionality
    strict: false       // NEW: Strict API to lock user in the note
};

// =====================================================================
// 2. MATH ENGINE & UTILS
// =====================================================================

class MathEngine {
    static evaluate(formulaStr, variables) {
        let f = formulaStr;
        for (const [key, value] of Object.entries(variables)) {
            f = f.replace(new RegExp(`{${key}}`, 'g'), value);
            f = f.replace(new RegExp(`@${key}`, 'g'), value);
        }
        const IF = (condition, trueResult, falseResult) => condition ? trueResult : falseResult;
        const pow = Math.pow;
        const sqrt = Math.sqrt;
        const nroot = (x, n) => Math.pow(x, 1/n);
        const mod = (a, b) => a % b;

        try {
            const evaluator = new Function('IF', 'pow', 'sqrt', 'nroot', 'mod', `"use strict"; return Number(${f});`);
            const result = evaluator(IF, pow, sqrt, nroot, mod);
            return isNaN(result) ? 0 : Number(result.toFixed(2));
        } catch (error) {
            console.error("CQuestion Engine: Formula Parsing Error.", error);
            return 0; 
        }
    }
}

class DOMUtils {
    static safeText(parent, tag, text, className = "") {
        const el = parent.createEl(tag);
        if (className) el.className = className;
        el.textContent = text; 
        return el;
    }
    
    static async renderMarkdown(text, parent, sourcePath, component, className = "") {
        const el = parent.createDiv();
        if (className) el.className = className;
        await obsidian.MarkdownRenderer.renderMarkdown(text, el, sourcePath, component);
        return el;
    }
}

// =====================================================================
// 3. MAIN PLUGIN CLASS
// =====================================================================

class CQuestionPlugin extends obsidian.Plugin {
    async onload() {
        console.log("Loading CQuestion - Advanced LMS Engine v4.2.0...");
        
        this.settings = Object.assign({}, DEFAULT_PLUGIN_SETTINGS, await this.loadData());
        
        if (!this.settings.setTypeData) this.settings.setTypeData = { Hard: [], Medium: [], Easy: [], Hint: [] };
        if (!this.settings.repetitionData) this.settings.repetitionData = {};
        if (!this.settings.customTags) this.settings.customTags = ["Hard", "Medium", "Easy", "Hint"];
        
        this.settings.customTags.forEach(tag => {
            if (!this.settings.setTypeData[tag]) this.settings.setTypeData[tag] = [];
        });
        
        // Session Managers for persistence and Strict Mode
        this.activeSessions = new Map();
        this.lockedFilePath = null;

        this.addSettingTab(new CQuestionSettingTab(this.app, this));
        this.injectStyles();

        // Workspace event hook for Strict Mode API
        this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
            if (this.lockedFilePath) {
                const currentFile = this.app.workspace.getActiveFile();
                if (currentFile && currentFile.path !== this.lockedFilePath) {
                    new obsidian.Notice("⚠️ Strict Exam Active! You cannot leave this note until you pause or submit.", 4000);
                    // Force redirect back to the locked exam file
                    const targetLeaves = this.app.workspace.getLeavesOfType("markdown");
                    const targetLeaf = targetLeaves.find(l => l.view.file && l.view.file.path === this.lockedFilePath);
                    if (targetLeaf) {
                        this.app.workspace.setActiveLeaf(targetLeaf, { focus: true });
                    }
                }
            }
        }));

        this.registerMarkdownCodeBlockProcessor("cquestion", async (source, el, ctx) => {
            el.empty(); 
            const container = el.createDiv({ cls: "cq-app-container" });
            
            try {
                const config = this.parseCodeBlock(source);
                if (config.fontSize) container.style.fontSize = config.fontSize;
                
                if (config.mode.toLowerCase() === "stats") {
                    this.renderStatsDashboard(container, ctx);
                } else {
                    const sessionKey = `${ctx.sourcePath}_${config.name}`;
                    if (this.activeSessions.has(sessionKey)) {
                        // Resume existing active exam session seamlessly
                        this.renderQuizUI(container, this.activeSessions.get(sessionKey), ctx);
                    } else {
                        await this.loadAndStartQuiz(container, config, ctx);
                    }
                }
            } catch (error) {
                console.error("CQuestion Fatal Error:", error);
                DOMUtils.safeText(container, "div", "⚠️ CQuestion Error: Failed to render block. Check console.", "cq-error-box");
            }
        });
    }

    async onunload() {
        const styleEl = document.getElementById("cq-plugin-styles");
        if (styleEl) styleEl.remove();
        console.log("CQuestion Engine Unloaded.");
    }

    // =====================================================================
    // 4. PARSER MANAGER
    // =====================================================================
    parseCodeBlock(source) {
        const config = Object.assign({}, DEFAULT_QUIZ_CONFIG);
        const lines = source.split('\n');
        
        lines.forEach(line => {
            if (!line.trim() || line.trim().startsWith("//")) return;
            const equalIndex = line.indexOf('=');
            if (equalIndex === -1) return;

            let key = line.substring(0, equalIndex).trim();
            let value = line.substring(equalIndex + 1).trim();

            if (key.startsWith("@")) {
                const rawKeyName = key.substring(1);
                
                // Match the case-sensitive key from default config, or fallback to the provided name
                const actualKey = Object.keys(config).find(k => k.toLowerCase() === rawKeyName.toLowerCase()) || rawKeyName;
                const apiNameLower = actualKey.toLowerCase();
                
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length - 1);
                }

                if (value.toLowerCase() === "true") value = true;
                else if (value.toLowerCase() === "false") value = false;
                
                switch(apiNameLower) {
                    case "set": config.sources = this.extractArgs(value); break;
                    case "setall": config.folderSources = this.extractArgs(value); break;
                    case "settype": config.setType = value.split(',').map(s => s.trim().toLowerCase()); break;
                    case "startfrom": config.startFrom = Math.max(1, parseInt(value) || 1); break;
                    case "endto": config.endTo = Math.max(0, parseInt(value) || 0); break;
                    case "repetition": config.repetition = Math.min(Math.max(parseInt(value) || 0, 0), 10); break; 
                    case "random": config.shuffle = (value === true || String(value).toLowerCase() === "true"); break; 
                    case "onlyread": config.filter = value ? "onlyread" : "all"; break;
                    case "duration": config.duration = this.parseTimeValue(value); break;
                    case "show": config.show = value; break;
                    case "name": config.name = value; break;
                    case "formula": config.formula = value; break;
                    case "fontsize": config.fontSize = value; break;
                    case "pausebutton": config.pauseButton = (value === true || String(value).toLowerCase() === "true"); break;
                    case "strict": config.strict = (value === true || String(value).toLowerCase() === "true"); break;
                    default:
                        // Now assigns using actualKey (e.g., passMark instead of passmark)
                        if (typeof value === "string" && !isNaN(value) && value !== "") {
                            config[actualKey] = parseFloat(value);
                        } else {
                            config[actualKey] = value;
                        }
                }
            }
        });
        return config;
    }

    extractArgs(str) {
        const match = str.match(/\(([^)]+)\)/);
        return match ? match[1].split(',').map(s => s.trim().replace(/['"]/g, "")) : [];
    }

    parseTimeValue(str) {
        str = String(str).toLowerCase().trim();
        if (str.endsWith('h')) return parseFloat(str) * 3600;
        if (str.endsWith('m')) return parseFloat(str) * 60;
        if (str.endsWith('s')) return parseFloat(str);
        return parseFloat(str) || 0;
    }

    // =====================================================================
    // 5. FETCHING, PARSING & SLICING
    // =====================================================================

    async loadAndStartQuiz(container, config, ctx) {
        let questions = await this.fetchQuestions(container, config, ctx);
        if (!questions) return;
        this.renderStartUI(container, questions, config, ctx);
    }

    async fetchQuestions(container, config, ctx) {
        let questions = [];
        const targetRefs = new Set();
        const useTypeFilter = config.setType && config.setType.length > 0;

        if (useTypeFilter) {
            config.setType.forEach(typeKey => {
                const exactMatch = this.settings.customTags.find(t => t.toLowerCase() === typeKey.toLowerCase());
                if (exactMatch) {
                    const pool = this.settings.setTypeData[exactMatch] || [];
                    pool.forEach(ref => {
                        const path = ref.path || ref.mdname;
                        const id = ref.id || ref.qText;
                        if (path && id) targetRefs.add(`${path}::${id}`);
                    });
                }
            });
        }

        let filesToRead = new Set();
        const specificSources = config.sources.length > 0 || config.folderSources.length > 0;

        try {
            if (specificSources) {
                for (const path of config.sources) {
                    const file = this.app.metadataCache.getFirstLinkpathDest(path, ctx.sourcePath);
                    if (file instanceof obsidian.TFile) filesToRead.add(file);
                }
                for (const folderPath of config.folderSources) {
                    const folder = this.app.vault.getAbstractFileByPath(folderPath);
                    if (folder instanceof obsidian.TFolder) {
                        obsidian.Vault.recurseChildren(folder, (file) => {
                            if (file instanceof obsidian.TFile && file.extension === "md") filesToRead.add(file);
                        });
                    }
                }
            } else if (useTypeFilter) {
                for (const ref of targetRefs) {
                    const path = ref.split("::")[0];
                    const file = this.app.metadataCache.getFirstLinkpathDest(path, "");
                    if (file instanceof obsidian.TFile) filesToRead.add(file);
                }
            }

            for (const file of filesToRead) {
                const raw = await this.app.vault.read(file);
                const parsed = this.parseQuestions(raw, config.filter, file.path);
                questions.push(...parsed);
            }

            if (useTypeFilter) {
                questions = questions.filter(q => targetRefs.has(`${q.path}::${q.id}`));
            }

        } catch (error) {
            console.error("Fetch Error:", error);
            DOMUtils.safeText(container, "div", "⚠️ Error loading file sources.", "cq-error-box");
            return null;
        }

        if (config.startFrom > 1 || config.endTo > 0) {
            const startIndex = Math.max(0, config.startFrom - 1);
            const endIndex = config.endTo > 0 ? config.endTo : questions.length;
            questions = questions.slice(startIndex, endIndex);
        }

        questions.forEach(q => {
            q.tags = this.settings.customTags.filter(t => 
                (this.settings.setTypeData[t] || []).some(saved => 
                    (saved.path || saved.mdname) === q.path && (saved.id || saved.qText) === q.id
                )
            );
        });

        if (config.repetition > 0) {
            const now = Date.now();
            questions.forEach(q => {
                const qId = q.path + "::" + q.id;
                const rep = this.settings.repetitionData[qId] || { correct: 0, total: 0, nextReview: now, interval: 0 };
                const mastery = rep.total > 0 ? (rep.correct / rep.total) : 0;
                const isOverdue = now > (rep.nextReview || 0);
                const daysOverdue = isOverdue ? (now - rep.nextReview) / 86400000 : 0;
                
                q._repScore = (isOverdue ? (10 + daysOverdue * 2) : 0) + ((1 - mastery) * config.repetition * 2.5);
                q._repScore += Math.random() * 0.5;
            });
            questions.sort((a, b) => b._repScore - a._repScore);
        } else if (config.shuffle) {
            questions.sort(() => Math.random() - 0.5);
        }

        if (config.limit > 0) questions = questions.slice(0, parseInt(config.limit));

        if (questions.length === 0) {
            DOMUtils.safeText(container, "div", "📭 No questions found in the specified range or source.", "cq-empty-state");
            return null;
        }
        return questions;
    }

    parseQuestions(text, filter, path = "Unknown") {
        const lines = text.split('\n');
        const questions = [];
        let currentQ = null;
        let state = "NONE"; 

        lines.forEach(line => {
            const qMatch = line.match(/^(\d+)\.\s+\[([xX\s]?)\]\s+(.*)/);
            const oMatch = line.match(/^\s+(\d+)\.\s+\[([xX\s]?)\]\s+(.*)/);
            const noteMatch = line.match(/^>\s*\[!NOTE\](.*)/i) || line.match(/^>(.*)/);

            if (qMatch && !line.startsWith(" ")) {
                const isRead = qMatch[2].toLowerCase() === 'x';
                if (filter === "onlyread" && !isRead) return;
                if (filter === "unread" && isRead) return;

                currentQ = { 
                    path: path, 
                    id: line.trim(), 
                    questionStr: qMatch[3].trim(), 
                    options: [], 
                    note: "",
                    selected: [], 
                    tags: [] 
                };
                questions.push(currentQ);
                state = "Q";
            } else if (oMatch && currentQ) {
                currentQ.options.push({ text: oMatch[3].trim(), isCorrect: oMatch[2].toLowerCase() === 'x' });
                state = "OPT";
            } else if (noteMatch && currentQ && (state === "OPT" || state === "NOTE")) {
                currentQ.note += line + "\n";
                state = "NOTE";
            } else if (currentQ && state === "Q") {
                currentQ.questionStr += "\n" + line; 
            } else if (currentQ && state === "OPT" && !noteMatch && line.trim() !== "") {
                if (currentQ.options.length > 0) {
                    currentQ.options[currentQ.options.length - 1].text += "\n" + line; 
                }
            }
        });
        return questions.filter(q => q.options.length > 0 || q.questionStr !== "");
    }

    // =====================================================================
    // 6. UI HELPERS & COPY LOGIC
    // =====================================================================

    createCopyButton(parent, q) {
        const btn = parent.createEl("button", { text: "📋 Copy", cls: "cq-copy-btn", title: "Copy Raw Question Format" });
        btn.onclick = async () => {
            let md = `1. [ ] ${q.questionStr}\n`;
            q.options.forEach((opt, i) => {
                md += `\t${i + 1}. [${opt.isCorrect ? 'x' : ' '}] ${opt.text}\n`;
            });
            if (q.note && q.note.trim() !== "") {
                md += q.note.trim();
            }
            
            try {
                await navigator.clipboard.writeText(md.trim());
                btn.textContent = "✔️ Copied";
                btn.classList.add("copied");
                setTimeout(() => {
                    btn.textContent = "📋 Copy";
                    btn.classList.remove("copied");
                }, 2000);
            } catch (e) {
                new obsidian.Notice("Failed to copy question.");
            }
        };
        return btn;
    }

    renderStartUI(el, questions, config, ctx) {
        el.empty();
        const startWrap = el.createDiv({ cls: "cq-start-wrap" });
        
        DOMUtils.safeText(startWrap, "h2", config.name, "cq-start-title");
        if (config.show) DOMUtils.safeText(startWrap, "p", config.show, "cq-start-desc");

        const metaGrid = startWrap.createDiv({ cls: "cq-start-meta" });
        metaGrid.createDiv({ text: `📝 Questions: ${questions.length}` });
        metaGrid.createDiv({ text: `⏱️ Duration: ${config.duration > 0 ? this.formatTime(config.duration) : 'Unlimited'}` });
        if (config.repetition > 0) metaGrid.createDiv({ text: `🧠 Repetition: ${config.repetition}/10` });
        if (config.strict) metaGrid.createDiv({ text: `🔒 Strict Mode ON` });

        const btnRow = startWrap.createDiv({ cls: "cq-start-actions" });
        
        const startBtn = btnRow.createEl("button", { cls: "cq-submit-btn cq-btn-large", text: "🚀 Start Quiz" });
        startBtn.onclick = () => {
            const session = {
                questions: questions,
                config: config,
                timeInSeconds: config.duration > 0 ? config.duration : 0,
                isPaused: false,
                interval: null
            };
            this.renderQuizUI(el, session, ctx);
        };

        const refreshBtn = btnRow.createEl("button", { cls: "cq-secondary-btn", text: "🔄 Refresh Live Source" });
        refreshBtn.onclick = async () => {
            const freshQs = await this.fetchQuestions(el.parentElement, config, ctx);
            if (freshQs) this.renderStartUI(el, freshQs, config, ctx);
            new obsidian.Notice("Quiz pool updated dynamically.");
        };
    }

    async toggleQuestionType(q, tagName, isAdding) {
        if (!this.settings.setTypeData[tagName]) this.settings.setTypeData[tagName] = [];
        const pool = this.settings.setTypeData[tagName];
        const qId = q.path + "::" + q.id;

        if (isAdding) {
            if (!pool.find(x => ((x.path || x.mdname) + "::" + (x.id || x.qText)) === qId)) {
                pool.push({ path: q.path, id: q.id }); 
            }
        } else {
            this.settings.setTypeData[tagName] = pool.filter(x => ((x.path || x.mdname) + "::" + (x.id || x.qText)) !== qId);
        }
        await this.saveData(this.settings);
    }

    // =====================================================================
    // 7. EXAM CONTROLLER (PERSISTENT & STRICT)
    // =====================================================================

    async renderQuizUI(el, session, ctx) {
        el.empty();
        
        const { questions, config } = session;
        const sessionKey = `${ctx.sourcePath}_${config.name}`;
        
        // Save session to memory
        this.activeSessions.set(sessionKey, session);

        // Update strict lock based on pause state
        const updateStrictLock = () => {
            if (config.strict && !session.isPaused) {
                this.lockedFilePath = ctx.sourcePath;
            } else {
                this.lockedFilePath = null;
            }
        };
        updateStrictLock();
        
        const loadingScreen = el.createDiv({ cls: "cq-loading-screen" });
        loadingScreen.innerHTML = `
            <div class="cq-spinner"></div>
            <h3>⏳ Preparing Exam...</h3>
            <p>Rendering markdown and analyzing assets...</p>
        `;

        const mainWrap = el.createDiv({ cls: "cq-quiz-main-wrap" });
        mainWrap.style.display = "none";
        
        // Pause Overlay (Glassmorphism & Double Click)
        const pauseOverlay = mainWrap.createDiv({ cls: "cq-paused-overlay" });
        pauseOverlay.innerHTML = `
            <div class="cq-pause-content">
                <h2>⏸️ Exam Paused</h2>
                <p>Timer and visibility are suspended.</p>
                <div class="cq-resume-hint">Double-click anywhere to resume</div>
            </div>`;
        if (session.isPaused) pauseOverlay.classList.add("active");

        const stickyHeader = mainWrap.createDiv({ cls: "cq-header-sticky" });
        const headerRow = stickyHeader.createDiv({ cls: "cq-header-row" });
        DOMUtils.safeText(headerRow, "h2", config.name);

        const headerActions = headerRow.createDiv({ cls: "cq-header-actions" });

        let timerDisplay = null;
        
        let pauseBtn;
        if (config.pauseButton) {
            pauseBtn = headerActions.createEl("button", { cls: "cq-secondary-btn", text: session.isPaused ? "▶️ Resume" : "⏸️ Pause" });
            
            const handlePauseToggle = () => {
                session.isPaused = !session.isPaused;
                pauseBtn.innerHTML = session.isPaused ? "▶️ Resume" : "⏸️ Pause";
                pauseOverlay.classList.toggle("active", session.isPaused);
                updateStrictLock();
            };

            pauseBtn.onclick = handlePauseToggle;
            
            // Double click on blur overlay to resume
            pauseOverlay.addEventListener('dblclick', () => {
                if (session.isPaused) handlePauseToggle();
            });
        }

        if (config.timer || config.duration > 0) {
            timerDisplay = headerActions.createDiv({ cls: "cq-timer", text: "00:00" });
        }

        const updateTimerDisplay = () => {
            if (!timerDisplay || !el.isConnected) return;
            const m = Math.floor(session.timeInSeconds / 60).toString().padStart(2, '0');
            const s = (session.timeInSeconds % 60).toString().padStart(2, '0');
            timerDisplay.textContent = config.duration > 0 ? `⏳ ${m}:${s}` : `⏱️ ${m}:${s}`;
            if (config.duration > 0 && session.timeInSeconds <= 60) {
                timerDisplay.style.color = "var(--text-error)";
                timerDisplay.style.borderColor = "var(--text-error)";
            }
        };

        if (config.timer) updateTimerDisplay();

        const scrollArea = mainWrap.createDiv({ cls: "cq-scroll-area" });
        const qContainer = scrollArea.createDiv({ cls: "cq-questions-wrapper" });

        for (let qIdx = 0; qIdx < questions.length; qIdx++) {
            const q = questions[qIdx];
            const originalPath = q.path || ctx.sourcePath;

            const qDiv = qContainer.createDiv({ cls: "cq-question-block" });
            const qHeader = qDiv.createDiv({ cls: "cq-q-header" });
            
            const qTitleWrap = qHeader.createDiv({ cls: "cq-q-title-wrap" });
            const qNumberWrap = qTitleWrap.createDiv({ cls: "cq-q-number", text: `${qIdx + 1}. ` });
            const qContentWrap = qTitleWrap.createDiv({ cls: "cq-q-content" });
            
            await DOMUtils.renderMarkdown(q.questionStr, qContentWrap, originalPath, this);
            
            const actionsWrap = qHeader.createDiv({ cls: "cq-q-actions" });
            this.createCopyButton(actionsWrap, q);

            if (config.allowTags) {
                const tagGroup = actionsWrap.createDiv({ cls: "cq-tag-group" });
                this.settings.customTags.forEach(tagName => {
                    const normalizedClass = tagName.toLowerCase().replace(/\s+/g, '-');
                    const btn = tagGroup.createEl("button", { text: tagName, cls: `cq-tag-btn t-${normalizedClass}` });
                    if (q.tags && q.tags.includes(tagName)) btn.classList.add('active');

                    btn.onclick = async () => {
                        const isNowActive = btn.classList.toggle('active');
                        if (!q.tags) q.tags = [];
                        if (isNowActive) {
                            if (!q.tags.includes(tagName)) q.tags.push(tagName);
                        } else {
                            q.tags = q.tags.filter(t => t !== tagName);
                        }
                        await this.toggleQuestionType(q, tagName, isNowActive);
                        new obsidian.Notice(`Question ${isNowActive ? 'added to' : 'removed from'} ${tagName}.`);
                    };
                });
            }

            const isMulti = q.options.filter(o => o.isCorrect).length > 1;
            const optionsWrap = qDiv.createDiv({ cls: "cq-options-wrap" });
            
            for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
                const opt = q.options[oIdx];
                const optBtn = optionsWrap.createDiv({ cls: "cq-option" });
                
                await DOMUtils.renderMarkdown(opt.text, optBtn, originalPath, this, "cq-markdown-clean");

                // Restore state if returning to an active exam
                if (q.selected && q.selected.includes(oIdx)) {
                    optBtn.classList.add('is-selected');
                }

                optBtn.onclick = () => {
                    if (isMulti) {
                        const idx = q.selected.indexOf(oIdx);
                        if (idx > -1) {
                            q.selected.splice(idx, 1);
                            optBtn.classList.remove('is-selected');
                        } else {
                            q.selected.push(oIdx);
                            optBtn.classList.add('is-selected');
                        }
                    } else {
                        optionsWrap.querySelectorAll('.cq-option').forEach(b => b.classList.remove('is-selected'));
                        q.selected = [oIdx];
                        optBtn.classList.add('is-selected');
                    }
                };
            }
        }

        const submitWrap = scrollArea.createDiv({ cls: "cq-submit-wrap" });
        const submitBtn = submitWrap.createEl("button", { cls: "cq-submit-btn", text: "✅ Submit Exam" });
        
        submitBtn.onclick = () => {
            if (confirm("Are you sure you want to submit?")) {
                if (session.interval) window.clearInterval(session.interval);
                const timeTaken = config.duration > 0 ? (config.duration - session.timeInSeconds) : session.timeInSeconds;
                
                // Clear session map and strict mode flag
                this.activeSessions.delete(sessionKey);
                this.lockedFilePath = null;
                
                this.processResults(el, questions, config, timeTaken, ctx);
            }
        };

        const images = mainWrap.querySelectorAll('img');
        if (images.length > 0) {
            loadingScreen.innerHTML = `
                <div class="cq-spinner"></div>
                <h3>🖼️ Fetching ${images.length} Image(s)...</h3>
                <p>Ensuring assets are visually prepared.</p>
            `;
            
            const loadPromises = Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve; 
                });
            });
            
            const timeoutFallback = new Promise(resolve => setTimeout(resolve, 10000));
            await Promise.race([Promise.all(loadPromises), timeoutFallback]);
        }

        loadingScreen.remove();
        mainWrap.style.display = "block";

        if (config.timer || config.duration > 0) {
            if (session.interval) window.clearInterval(session.interval);
            session.interval = window.setInterval(() => {
                // If DOM detaches (user clicked another note), freeze timer interval logic
                if (!el.isConnected) {
                    window.clearInterval(session.interval);
                    session.interval = null;
                    return;
                }
                
                if (session.isPaused) return; 

                if (config.duration > 0) {
                    session.timeInSeconds--;
                    if (session.timeInSeconds <= 0) {
                        window.clearInterval(session.interval);
                        this.activeSessions.delete(sessionKey);
                        this.lockedFilePath = null;
                        this.processResults(el, questions, config, config.duration, ctx);
                    }
                } else {
                    session.timeInSeconds++;
                }
                updateTimerDisplay();
            }, 1000);
        }
    }

    // =====================================================================
    // 8. GRADING ENGINE & HISTORY SAVING
    // =====================================================================

    async processResults(el, questions, config, timeTaken, ctx) {
        let correctCount = 0; let wrongCount = 0; let unattempted = 0;

        const qSnapshot = questions.map(q => ({
            questionStr: q.questionStr,
            note: q.note,
            selected: q.selected,
            options: q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })),
            rawOriginal: q,
            path: q.path 
        }));

        questions.forEach(q => {
            const qId = q.path + "::" + q.id;
            
            if (!this.settings.repetitionData[qId]) {
                this.settings.repetitionData[qId] = { correct: 0, total: 0, streak: 0, ease: 2.5, interval: 0, nextReview: Date.now() };
            }
            const rep = this.settings.repetitionData[qId];

            const correctIndices = q.options.map((o, i) => o.isCorrect ? i : -1).filter(i => i !== -1);
            let isCorrect = false;
            const attempted = q.selected.length > 0;

            if (correctIndices.length === 0) {
                isCorrect = true; 
            } else if (attempted) {
                isCorrect = correctIndices.length === q.selected.length && correctIndices.every(i => q.selected.includes(i));
            }

            if (!attempted && correctIndices.length > 0) {
                unattempted++;
                rep.streak = 0; rep.interval = 1; rep.ease = Math.max(1.3, rep.ease - 0.2);
            } else {
                rep.total++;
                if (isCorrect) {
                    correctCount++; rep.correct++; rep.streak++;
                    if (rep.streak === 1) rep.interval = 1; else if (rep.streak === 2) rep.interval = 6; else rep.interval = Math.round(rep.interval * rep.ease);
                    rep.ease = Math.max(1.3, rep.ease + 0.1);
                } else {
                    wrongCount++; rep.streak = 0; rep.interval = 1; rep.ease = Math.max(1.3, rep.ease - 0.2);
                }
            }
            rep.nextReview = Date.now() + (rep.interval * 86400000); 
        });

        const total = questions.length;
        const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        const answered = correctCount + wrongCount;
        
   //last added {skip},{totalQ} ------- update-id-1

        const variables = { 
            correct: correctCount, 
            wrong: wrongCount, 
            total: total, 
            totalQ: total,        // Added {totalQ}
            skip: unattempted,    // Added {skip}
            markPerQ: config.markPerQ || 1, 
            penalty: config.penalty || 0 
        };
        const finalScore = MathEngine.evaluate(config.formula, variables);
        
        const maxScoreVariables = { 
            correct: total, 
            wrong: 0, 
            total: total, 
            totalQ: total,        // Added {totalQ}
            skip: 0,              // Added {skip} (0 skips for a perfect score)
            markPerQ: config.markPerQ || 1, 
            penalty: 0 
        };
        const maxScore = MathEngine.evaluate(config.formula, maxScoreVariables);
	
        const hasPassed = finalScore >= config.passMark;

      // Inside processResults(el, questions, config, timeTaken, ctx)...
// Update the variables object and history entry to include totalSelected

const totalSelected = questions.filter(q => q.selected && q.selected.length > 0).length;

const historyEntry = {
    id: Date.now(),
    exam: config.name,
    date: new Date().toLocaleString(),
    totalQ: total, 
    answered: answered, 
    totalSelected: totalSelected, // Added this
    correct: correctCount, 
    wrong: wrongCount,
    accuracy: accuracy, 
    score: finalScore, 
    maxScore: maxScore,           // <-- ADDED FIXED LINE
    passMark: config.passMark,    // <-- ADDED FIXED LINE
    passed: hasPassed, 
    time: timeTaken,
    qData: qSnapshot
};
        
        this.settings.history.push(historyEntry);
        await this.saveData(this.settings);

        await this.renderResultViews(el, questions, config, timeTaken, finalScore, maxScore, accuracy, correctCount, wrongCount, unattempted, hasPassed, ctx);
    }

    async renderResultViews(el, questions, config, timeTaken, finalScore, maxScore, accuracy, correctCount, wrongCount, unattempted, hasPassed, ctx) {
        el.empty();
        
        const masterContainer = el.createDiv();
        const scoreView = masterContainer.createDiv({ cls: "cq-results" });
        const reviewView = masterContainer.createDiv({ cls: "cq-review-hidden" });

        const badgeCls = hasPassed ? "cq-badge-pass" : "cq-badge-fail";
        scoreView.createDiv({ cls: `cq-result-badge ${badgeCls}`, text: hasPassed ? "🎉 Passed" : "❌ Failed" });
        DOMUtils.safeText(scoreView, "h2", `Exam Completed: ${config.name}`);
        
        const grid = scoreView.createDiv({ cls: "cq-stats-grid" });
        this.createStatCard(grid, "Final Mark", `${finalScore} / ${maxScore}`, "accent");
        this.createStatCard(grid, "Target (Pass)", `${config.passMark}`);
        this.createStatCard(grid, "Accuracy", `${accuracy}%`);
        this.createStatCard(grid, "Time Taken", this.formatTime(timeTaken));
        const totalSelected = questions.filter(q => q.selected && q.selected.length > 0).length;
        this.createStatCard(grid, "Total Selected", `${totalSelected}/${questions.length}`, "info");
    
        this.createStatCard(grid, "Correct", correctCount, "success");
        this.createStatCard(grid, "Wrong", wrongCount, "danger");

        const actions = scoreView.createDiv({ cls: "cq-result-actions" });
        
        const reviewBtn = actions.createEl("button", { text: "🔍 Review Mistakes", cls: "cq-secondary-btn" });
        reviewBtn.onclick = () => { scoreView.style.display = "none"; reviewView.style.display = "block"; };

        const resetBtn = actions.createEl("button", { text: "🔄 Retake Exam", cls: "cq-submit-btn" });
        resetBtn.onclick = () => {
            questions.forEach(q => q.selected = []);
            const newSession = { questions: questions, config: config, timeInSeconds: config.duration > 0 ? config.duration : 0, isPaused: false, interval: null };
            this.renderQuizUI(el, newSession, ctx);
        };

        const stickyHeader = reviewView.createDiv({ cls: "cq-header-sticky" });
        const reviewHeader = stickyHeader.createDiv({ cls: "cq-header-row", attr: {style: "border:none; margin:0; padding:0;"} });
        DOMUtils.safeText(reviewHeader, "h2", "Exam Review");
        const backBtn = reviewHeader.createEl("button", { text: "⬅️ Back to Results", cls: "cq-secondary-btn" });
        backBtn.onclick = () => { reviewView.style.display = "none"; scoreView.style.display = "block"; };

        const reviewScrollArea = reviewView.createDiv({ cls: "cq-scroll-area" });
        await this.renderQuestionsReview(reviewScrollArea, questions, ctx, true);
    }

    async renderQuestionsReview(container, questions, ctx, allowCopy = false) {
        const qContainer = container.createDiv({ cls: "cq-questions-wrapper" });
        for (let qIdx = 0; qIdx < questions.length; qIdx++) {
            const q = questions[qIdx];
            const originalPath = q.path || ctx.sourcePath;
            const isAnswered = q.selected && q.selected.length > 0;
            const qDiv = qContainer.createDiv({ 
            cls: `cq-question-block ${isAnswered ? 'is-user-answered' : 'is-unanswered'}` 
        });
          const qHeader = qDiv.createDiv({ cls: "cq-q-header" });
            
            const titleWrap = qHeader.createDiv({ cls: "cq-q-title-wrap cq-review-q-title" });
            DOMUtils.safeText(titleWrap, "span", `${qIdx + 1}. `, "cq-q-number");
            await DOMUtils.renderMarkdown(q.questionStr, titleWrap.createDiv({ cls: "cq-q-content" }), originalPath, this);

            if (allowCopy) {
                const actionsWrap = qHeader.createDiv({ cls: "cq-q-actions" });
                this.createCopyButton(actionsWrap, q.rawOriginal || q);
            }

            const optionsWrap = qDiv.createDiv({ cls: "cq-options-wrap" });
            for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
                const opt = q.options[oIdx];
                const optEl = optionsWrap.createDiv({ cls: "cq-option cq-review-mode" });
                await DOMUtils.renderMarkdown(opt.text, optEl, originalPath, this, "cq-markdown-clean");

                const isSelected = q.selected && q.selected.includes(oIdx);

                if (opt.isCorrect) optEl.classList.add("is-correct-answer");
                if (isSelected && !opt.isCorrect) optEl.classList.add("is-wrong-answer");
                if (isSelected) optEl.style.fontWeight = "bold"; 
            }

            if (q.note && q.note.trim() !== "") {
                const noteWrap = qDiv.createDiv({ cls: "cq-review-note" });
                await DOMUtils.renderMarkdown(q.note, noteWrap, originalPath, this);
            }
        }
    }

    createStatCard(parent, label, value, type = "normal") {
        const card = parent.createDiv({ cls: `cq-stat-card ${type}` });
        DOMUtils.safeText(card, "span", label, "cq-label");
        DOMUtils.safeText(card, "span", String(value), "cq-value");
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    }

    // =====================================================================
    // 9. ADVANCED DASHBOARD
    // =====================================================================

    renderStatsDashboard(el, ctx) {
        el.empty();
        const header = el.createDiv({ cls: "cq-dashboard-header" });
        DOMUtils.safeText(header, "h2", "📊 Analytics Dashboard");

        const tabRow = el.createDiv({ cls: "cq-tab-row" });
        const tabOverview = tabRow.createEl("button", { text: "Overview", cls: "cq-tab-btn active" });
        const tabHistory = tabRow.createEl("button", { text: "Detailed History", cls: "cq-tab-btn" });
        
        const contentArea = el.createDiv({ cls: "cq-tab-content" });

        const switchTab = (tab) => {
            tabOverview.classList.remove("active");
            tabHistory.classList.remove("active");
            contentArea.empty();

            if (tab === "overview") {
                tabOverview.classList.add("active");
                if (this.settings.history.length === 0) {
                    DOMUtils.safeText(contentArea, "p", "No exam data found yet.", "cq-empty-state");
                    this.renderCategoryAccess(contentArea, switchTab);
                } else {
                    this.renderDashboardOverview(contentArea, switchTab);
                }
            } else if (tab === "history") {
                tabHistory.classList.add("active");
                if (this.settings.history.length === 0) {
                    DOMUtils.safeText(contentArea, "p", "No exam data found yet.", "cq-empty-state");
                } else {
                    this.renderDashboardHistory(contentArea, el, ctx);
                }
            } else if (tab === "saved") {
                this.renderDashboardCategorized(contentArea, switchTab, ctx);
            }
        };

        tabOverview.onclick = () => switchTab("overview");
        tabHistory.onclick = () => switchTab("history");
        
        switchTab("overview"); 
    }

    renderDashboardOverview(container, switchTabFn) {
        const history = this.settings.history;
        const totalExams = history.length;
        const passedExams = history.filter(h => h.passed).length;
        const failedExams = totalExams - passedExams;
        const avgAcc = totalExams > 0 ? Math.round(history.reduce((a, b) => a + b.accuracy, 0) / totalExams) : 0;
        
        const overview = container.createDiv({ cls: "cq-stats-grid" });
        this.createStatCard(overview, "Total Exams", totalExams);
        this.createStatCard(overview, "Passed", passedExams, "success");
        this.createStatCard(overview, "Failed", failedExams, "danger");
        this.createStatCard(overview, "Avg Accuracy", `${avgAcc}%`, "accent");

        this.renderCategoryAccess(container, switchTabFn);
    }

    renderCategoryAccess(container, switchTabFn) {
        const wrap = container.createDiv({ cls: "cq-dashboard-footer", attr: { style: "margin-top: 25px; border-top: 1px solid var(--background-modifier-border); padding-top: 20px; display: flex; justify-content: center;" } });
        const btn = wrap.createEl("button", { text: "📂 Manage Tags & View Saved Questions", cls: "cq-submit-btn" });
        btn.onclick = () => switchTabFn("saved");
    }

    renderDashboardCategorized(container, switchTabFn, ctx) {
        const top = container.createDiv({ cls: "cq-dashboard-toolbar" });
        const back = top.createEl("button", { text: "⬅ Back to Stats", cls: "cq-secondary-btn" });
        back.onclick = () => switchTabFn("overview");

        const tagManagerArea = container.createDiv({ cls: "cq-tag-manager-box" });
        tagManagerArea.createEl("h3", { text: "🏷️ Tag Manager" });
        const tagsWrapper = tagManagerArea.createDiv({ cls: "cq-tag-manage-list" });

        const renderTagManager = () => {
            tagsWrapper.empty();
            this.settings.customTags.forEach(tag => {
                const pill = tagsWrapper.createDiv({ cls: "cq-tag-pill-edit" });
                pill.createSpan({ text: tag, cls: "cq-tag-name" });
                const acts = pill.createDiv({ cls: "cq-tag-acts" });
                
                const renBtn = acts.createEl("button", { text: "✏️", title: "Rename" });
                renBtn.onclick = async () => {
                    const newName = prompt(`Rename tag '${tag}' to:`, tag);
                    if (newName && newName.trim() !== "" && newName !== tag) {
                        if (this.settings.customTags.includes(newName.trim())) {
                            new obsidian.Notice("Tag already exists!");
                            return;
                        }
                        const trimName = newName.trim();
                        const idx = this.settings.customTags.indexOf(tag);
                        this.settings.customTags[idx] = trimName;
                        this.settings.setTypeData[trimName] = this.settings.setTypeData[tag];
                        delete this.settings.setTypeData[tag];
                        await this.saveData(this.settings);
                        if (activeType === tag) activeType = trimName;
                        this.renderDashboardCategorized(container, switchTabFn, ctx);
                    }
                };

                const delBtn = acts.createEl("button", { text: "🗑️", title: "Delete" });
                delBtn.onclick = async () => {
                    if (confirm(`Are you sure you want to delete the tag '${tag}'? This will remove the label from all saved questions.`)) {
                        this.settings.customTags = this.settings.customTags.filter(t => t !== tag);
                        delete this.settings.setTypeData[tag];
                        await this.saveData(this.settings);
                        if (activeType === tag) activeType = this.settings.customTags[0] || "";
                        this.renderDashboardCategorized(container, switchTabFn, ctx);
                    }
                };
            });

            const addTagBtn = tagsWrapper.createEl("button", { text: "➕ Add Tag", cls: "cq-add-tag-btn" });
            addTagBtn.onclick = async () => {
                const newTag = prompt("Enter a new custom tag name:");
                if (newTag && newTag.trim() !== "") {
                    const tagStr = newTag.trim();
                    if (!this.settings.customTags.includes(tagStr)) {
                        this.settings.customTags.push(tagStr);
                        this.settings.setTypeData[tagStr] = []; 
                        await this.saveData(this.settings);
                        new obsidian.Notice(`New Tag '${tagStr}' added successfully.`);
                        this.renderDashboardCategorized(container, switchTabFn, ctx); 
                    } else {
                        new obsidian.Notice("Tag already exists.");
                    }
                }
            };
        };

        let activeType = this.settings.customTags.length > 0 ? this.settings.customTags[0] : null;
        
        renderTagManager();

        if (!activeType) {
            container.createDiv({ cls: "cq-empty-state", text: "No custom tags available. Add a tag above." });
            return;
        }

        const toolbar = container.createDiv({ cls: "cq-dashboard-toolbar" });
        const catButtons = toolbar.createDiv({ cls: "cq-filters" });

        const scrollArea = container.createDiv({ cls: "cq-scroll-area" });
        const typeContainer = scrollArea.createDiv({ cls: "cq-questions-wrapper" }); 

        const renderList = async () => {
            typeContainer.empty();
            if (!activeType) return;

            const config = Object.assign({}, DEFAULT_QUIZ_CONFIG, { setType: [activeType], filter: "all" });
            const poolQs = await this.fetchQuestions(typeContainer, config, ctx);

            if (!poolQs || poolQs.length === 0) {
                DOMUtils.safeText(typeContainer, "div", `📭 No questions saved under '${activeType}'.`, "cq-empty-state");
                return;
            }

            for (let idx = 0; idx < poolQs.length; idx++) {
                const q = poolQs[idx];
                const originalPath = q.path || ctx.sourcePath;
                
                const qDiv = typeContainer.createDiv({ cls: "cq-question-block" });
                
                // 1. QUESTION RENDERING (Top)
                const titleWrap = qDiv.createDiv({ cls: "cq-q-title-wrap cq-review-q-title" });
                DOMUtils.safeText(titleWrap, "span", `${idx + 1}. `, "cq-q-number");
                await DOMUtils.renderMarkdown(q.questionStr, titleWrap.createDiv({ cls: "cq-q-content" }), originalPath, this);
                
                // 2. SOURCE (Below Question)
                const sourceWrap = qDiv.createDiv({
                    cls: "cq-q-source-path",
                    text: q.path,
                    attr: { style: "font-size: 0.75em; color: var(--text-muted); margin-bottom: 10px; font-weight: normal;" }
                });
                
                // 3. ACTION ROW (Copy Button + Tags)
                const actionsRow = qDiv.createDiv({
                    cls: "cq-q-actions",
                    attr: { style: "display: flex; gap: 10px; align-items: center; margin-bottom: 15px;" }
                });
                
                // Copy Button
                this.createCopyButton(actionsRow, q);
                
                // Tags Logic (Kept exactly as original)
                const tagGroup = actionsRow.createDiv({ cls: "cq-tag-group" });
                this.settings.customTags.forEach(tagName => {
                    const normalizedClass = tagName.toLowerCase().replace(/\s+/g, '-');
                    const btn = tagGroup.createEl("button", { text: tagName, cls: `cq-tag-btn t-${normalizedClass}` });
                    if (q.tags && q.tags.includes(tagName)) btn.classList.add('active');
                    
                    btn.onclick = async () => {
                        const isNowActive = btn.classList.toggle('active');
                        await this.toggleQuestionType(q, tagName, isNowActive);
                        if (!isNowActive && tagName === activeType) renderList();
                    };
                });
                
                // 4. OPTIONS (Bottom)
                const optionsWrap = qDiv.createDiv({ cls: "cq-options-wrap" });
                for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
                    const opt = q.options[oIdx];
                    const optEl = optionsWrap.createDiv({ cls: "cq-option cq-review-mode" });
                    await DOMUtils.renderMarkdown(opt.text, optEl, originalPath, this, "cq-markdown-clean");
                    if (opt.isCorrect) optEl.classList.add("is-correct-answer");
                }
            }
        };

        this.settings.customTags.forEach(type => {
            const btn = catButtons.createEl("button", { text: `View ${type}`, cls: "cq-secondary-btn" });
            if (type === activeType) btn.style.borderColor = `var(--cq-accent)`;
            btn.onclick = () => { 
                activeType = type; 
                catButtons.querySelectorAll('button.cq-secondary-btn').forEach(b => b.style.borderColor = "");
                btn.style.borderColor = `var(--cq-accent)`;
                renderList(); 
            };
        });

        renderList();
    }

    renderDashboardHistory(container, mainEl, ctx) {
        let searchTerm = "";
        let statusFilter = "all";
        let sortOrder = "newest"; // NEW: Sort order filter

        const toolbar = container.createDiv({ cls: "cq-dashboard-toolbar" });
        const filters = toolbar.createDiv({ cls: "cq-filters" });
        const searchInput = filters.createEl("input", { type: "text", placeholder: "🔍 Search exam name...", cls: "cq-search-input" });
        
        // Status Filter
        const selectFilter = filters.createEl("select", { cls: "cq-select" });
        selectFilter.add(new Option("All Status", "all"));
        selectFilter.add(new Option("Passed Only", "pass"));
        selectFilter.add(new Option("Failed Only", "fail"));

        // NEW: Sort Filter
        const sortFilter = filters.createEl("select", { cls: "cq-select" });
        sortFilter.add(new Option("Newest First", "newest"));
        sortFilter.add(new Option("Oldest First", "oldest"));

        const actions = toolbar.createDiv({ cls: "cq-filters" });
        const clearBtn = actions.createEl("button", { text: "🗑️ Clear All", cls: "cq-del-all-btn" });

        clearBtn.onclick = async () => {
            if (confirm("Permanently delete ALL exam records?")) {
                this.settings.history = []; await this.saveData(this.settings);
                this.renderStatsDashboard(mainEl, ctx);
            }
        };

        const tableContainer = container.createDiv({ cls: "cq-table-responsive" });
        
        const renderTable = () => {
            tableContainer.empty();
            const table = tableContainer.createEl("table", { cls: "cq-stats-table" });
            const thead = table.createEl("thead").createEl("tr");
            ["Date", "Exam Name", "Status (Target)", "Score / Max", "Accuracy", "Action"].forEach(txt => DOMUtils.safeText(thead, "th", txt));
            const tbody = table.createEl("tbody");

            let filteredHistory = this.settings.history.slice().filter(entry => {
                const matchSearch = entry.exam.toLowerCase().includes(searchTerm);
                const matchFilter = statusFilter === "all" || (statusFilter === "pass" && entry.passed) || (statusFilter === "fail" && !entry.passed);
                return matchSearch && matchFilter;
            });

            // Apply Date Sorting
            if (sortOrder === "newest") {
                filteredHistory.reverse(); 
            }

            filteredHistory.forEach(entry => {
                const tr = tbody.createEl("tr");
                DOMUtils.safeText(tr, "td", entry.date.split(',')[0]);
                DOMUtils.safeText(tr, "td", entry.exam, "cq-exam-name");
                
                const statusTd = tr.createEl("td");
                const span = statusTd.createSpan({ cls: entry.passed ? "cq-status-pass" : "cq-status-fail", text: entry.passed ? "Pass" : "Fail" });
                statusTd.createSpan({ text: ` (Req: ${entry.passMark || 'N/A'})`, attr: { style: 'font-size: 0.85em; color: var(--cq-muted);' } });

                const maxScoreDisp = entry.maxScore !== undefined ? entry.maxScore : '?';
                DOMUtils.safeText(tr, "td", `${entry.score} / ${maxScoreDisp}`, "cq-bold");
                DOMUtils.safeText(tr, "td", `${entry.accuracy}%`);
                
                const tdAction = tr.createEl("td", { cls: "cq-actions-td" });
                
                if (entry.qData && entry.qData.length > 0) {
                    const viewBtn = tdAction.createEl("button", { text: "👁️", cls: "cq-icon-btn", title: "View Questions" });
                    viewBtn.onclick = async () => {
                        container.empty();
                        const top = container.createDiv({ cls: "cq-dashboard-toolbar" });
                        const bckBtn = top.createEl("button", { text: "⬅️ Back to Table", cls: "cq-secondary-btn" });
                        bckBtn.onclick = () => this.renderDashboardHistory(container, mainEl, ctx);
                        
                        container.createEl("h3", { text: `Archived Exam: ${entry.exam}` });
                        const reviewScrollArea = container.createDiv({ cls: "cq-scroll-area" });
                        await this.renderQuestionsReview(reviewScrollArea, entry.qData, ctx, false); 
                    };
                }

                const delBtn = tdAction.createEl("button", { text: "🗑️", cls: "cq-icon-btn cq-del-btn", title: "Delete" });
                delBtn.onclick = async () => {
                    this.settings.history = this.settings.history.filter(h => h.id !== entry.id);
                    await this.saveData(this.settings);
                    renderTable(); 
                };
            });
        };

        searchInput.oninput = (e) => { searchTerm = e.target.value.toLowerCase(); renderTable(); };
        selectFilter.onchange = (e) => { statusFilter = e.target.value; renderTable(); };
        sortFilter.onchange = (e) => { sortOrder = e.target.value; renderTable(); };

        renderTable();
    }

    // =====================================================================
    // 10. CSS STYLES 
    // =====================================================================

    injectStyles() {
        const styleId = "cq-plugin-styles";
        if (document.getElementById(styleId)) return;

        const styleEl = document.createElement("style");
        styleEl.id = styleId;
        styleEl.textContent = `
                    .cq-app-container { 
                --cq-accent: var(--interactive-accent);
                --cq-bg: var(--background-secondary);
                --cq-bg-alt: var(--background-primary);
                --cq-border: var(--divider-color);
                --cq-text: var(--text-normal);
                --cq-muted: var(--text-muted);
                --cq-elevation-1: 0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
                --cq-elevation-2: 0 8px 12px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04);
                --cq-radius: 12px;
                
                font-family: var(--font-text), sans-serif; 
                color: var(--cq-text);
                margin: 10px 0;
            }
            
            /* --- LOADING SCREEN CSS --- */
            .cq-loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; background: var(--cq-bg); border-radius: var(--cq-radius); box-shadow: var(--cq-elevation-1); border: 1px solid var(--cq-border); margin: 20px 0; }
            .cq-spinner { width: 45px; height: 45px; border: 4px solid rgba(var(--interactive-accent-rgb), 0.2); border-top-color: var(--cq-accent); border-radius: 50%; animation: cq-spin 1s linear infinite; margin-bottom: 20px; }
            @keyframes cq-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .cq-loading-screen h3 { margin: 0 0 10px 0; font-size: 1.5em; color: var(--cq-text); }
            .cq-loading-screen p { margin: 0; color: var(--cq-muted); font-size: 1.1em; }

            /* --- POLISHED PAUSE OVERLAY --- */
            .cq-quiz-main-wrap { position: relative; }
            .cq-paused-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(var(--background-primary-rgb), 0.6); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); z-index: 50; display: none; align-items: center; justify-content: center; text-align: center; border-radius: var(--cq-radius); cursor: pointer; transition: opacity 0.3s ease; }
            .cq-paused-overlay.active { display: flex; animation: cq-fade-in 0.3s forwards; }
            .cq-pause-content { padding: 40px; background: var(--cq-bg-alt); border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); border: 1px solid rgba(128,128,128,0.2); pointer-events: none; }
            .cq-pause-content h2 { font-size: 2.5em; margin: 0 0 10px 0; color: var(--cq-text); background: linear-gradient(90deg, var(--cq-accent), #8e44ad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .cq-pause-content p { font-size: 1.2em; color: var(--cq-muted); margin-bottom: 25px; }
            .cq-resume-hint { display: inline-block; padding: 10px 20px; background: rgba(var(--interactive-accent-rgb), 0.1); color: var(--cq-accent); border-radius: 30px; font-weight: bold; animation: cq-pulse 2s infinite; }
            
            @keyframes cq-pulse { 0% { opacity: 0.7; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1.02); } 100% { opacity: 0.7; transform: scale(0.98); } }
            @keyframes cq-fade-in { from { opacity: 0; } to { opacity: 1; } }

            /* --- SCROLL & BASIC COMPONENTS --- */
            .cq-scroll-area { max-height: 70vh; overflow-y: auto; padding-right: 12px; scroll-behavior: smooth; }
            .cq-scroll-area::-webkit-scrollbar { width: 8px; }
            .cq-scroll-area::-webkit-scrollbar-track { background: var(--cq-bg-alt); border-radius: 6px; }
            .cq-scroll-area::-webkit-scrollbar-thumb { background: var(--cq-muted); border-radius: 6px; opacity: 0.5; }
            .cq-scroll-area::-webkit-scrollbar-thumb:hover { background: var(--cq-accent); }
            
            .cq-error-box { background: rgba(255, 0, 0, 0.1); color: var(--text-error); padding: 15px; border-radius: var(--cq-radius); border: 1px solid var(--text-error); font-weight: bold; }
            .cq-empty-state { text-align: center; padding: 40px 20px; color: var(--cq-muted); font-style: italic; background: var(--cq-bg); border-radius: var(--cq-radius); box-shadow: var(--cq-elevation-1); margin-top: 15px;}
            
            .cq-start-wrap { background: linear-gradient(145deg, var(--cq-bg), var(--cq-bg-alt)); border: 1px solid var(--cq-border); padding: 40px; text-align: center; border-radius: 16px; box-shadow: var(--cq-elevation-2); }
            .cq-start-title { font-size: 2.2em; margin-bottom: 10px; font-weight: 800; background: linear-gradient(90deg, var(--cq-accent), #8e44ad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .cq-start-desc { font-size: 1.1em; color: var(--cq-muted); margin-bottom: 25px; }
            .cq-start-meta { display: flex; justify-content: center; gap: 20px; margin-bottom: 30px; font-weight: 500; }
            .cq-start-actions { display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; }
            .cq-btn-large { font-size: 1.2em !important; padding: 12px 30px !important; }

            .cq-header-sticky { position: sticky; top: 0; background: var(--cq-bg-alt); z-index: 10; padding: 15px 20px; border-radius: var(--cq-radius); box-shadow: var(--cq-elevation-1); border: 1px solid var(--cq-border); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .cq-header-row { display: flex; justify-content: space-between; align-items: center; width: 100%; }
            .cq-header-row h2 { margin: 0; font-size: 1.5em; font-weight: 700; }
            .cq-header-actions { display: flex; gap: 15px; align-items: center; }
            .cq-timer { font-family: monospace; font-size: 1.3em; font-weight: bold; color: var(--cq-accent); background: var(--cq-bg); padding: 8px 16px; border-radius: 8px; border: 1px solid var(--cq-border); box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
            
            .cq-questions-wrapper { display: flex; flex-direction: column; gap: 20px; padding-bottom: 20px; }
            .cq-question-block { background: var(--cq-bg); padding: 24px; border-radius: var(--cq-radius); border: 1px solid var(--cq-border); box-shadow: var(--cq-elevation-1); transition: transform 0.2s, box-shadow 0.2s; }
            .cq-question-block:hover { box-shadow: var(--cq-elevation-2); border-color: rgba(var(--interactive-accent-rgb), 0.3); }
            
            .cq-q-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 15px; font-size: 1.15em; font-weight: 600; flex-wrap: wrap; }
            .cq-q-title-wrap { display: flex; flex: 1; min-width: 60%; }
            .cq-q-number { font-weight: bold; margin-right: 5px; flex-shrink: 0;}
            .cq-q-content { flex-grow: 1; margin: 0; }
            .cq-q-content p { margin-top: 0; }
            
            .cq-q-content img, .cq-option img, .cq-review-note img { 
                max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; 
                display: block; box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            }
            /* Add these to styleEl.textContent */

.cq-q-header {
    display: flex;
    flex-direction: column; /* Stack title and source */
    gap: 5px;
}

.cq-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
}

.cq-q-source-path {
    opacity: 0.7;
    font-family: var(--font-monospace);
    padding-left: 25px; /* Aligns roughly under the start of the title text */
}
            .cq-review-q-title { display: flex; align-items: flex-start; font-weight: 600; font-size: 1.15em; }

            .cq-q-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; align-items: center; }
            .cq-copy-btn { font-size: 0.85em; padding: 6px 14px; background: var(--cq-bg-alt); color: var(--cq-text); border: 1px solid var(--cq-border); border-radius: 16px; cursor: pointer; transition: all 0.2s; font-weight: 600; }
            .cq-copy-btn:hover { background: var(--background-modifier-hover); transform: translateY(-1px); box-shadow: var(--cq-elevation-1); }
            .cq-copy-btn.copied { background: #2ecc71; color: white; border-color: #2ecc71; }
            
            /* --- TAG SYSTEM --- */
            .cq-tag-manager-box { background: var(--cq-bg-alt); border: 1px solid var(--cq-border); padding: 20px; border-radius: var(--cq-radius); margin-bottom: 20px; box-shadow: var(--cq-elevation-1); }
            .cq-tag-manager-box h3 { margin-top: 0; margin-bottom: 15px; font-size: 1.2em; }
            .cq-tag-manage-list { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
            .cq-tag-pill-edit { display: flex; align-items: center; background: var(--cq-bg); border: 1px solid var(--cq-border); padding: 5px 12px; border-radius: 20px; font-size: 0.9em; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .cq-tag-name { font-weight: 600; margin-right: 10px; color: var(--cq-text); }
            .cq-tag-acts { display: flex; gap: 4px; }
            .cq-tag-acts button { background: none; border: none; padding: 4px; font-size: 1.1em; cursor: pointer; border-radius: 50%; opacity: 0.6; transition: all 0.2s; }
            .cq-tag-acts button:hover { opacity: 1; background: var(--background-modifier-hover); }
            .cq-add-tag-btn { background: var(--cq-accent); color: white; border: none; padding: 6px 14px; border-radius: 20px; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: 0.2s; box-shadow: 0 2px 6px rgba(var(--interactive-accent-rgb), 0.3); }
            .cq-add-tag-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }

            .cq-tag-group { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
            .cq-tag-btn { background: var(--cq-bg-alt); border: 1px solid var(--cq-border); font-size: 0.8em; padding: 6px 12px; border-radius: 16px; cursor: pointer; color: var(--cq-muted); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); font-weight: 600; }
            .cq-tag-btn:hover { filter: brightness(1.1); transform: scale(1.05); }
            .cq-tag-btn.active { background: var(--cq-accent); color: white; border-color: var(--cq-accent); box-shadow: 0 2px 8px rgba(var(--interactive-accent-rgb), 0.4); }
            
            .cq-options-wrap { display: flex; flex-direction: column; gap: 12px; }
            .cq-option { display: block; width: 100%; padding: 16px 20px; text-align: left; background: var(--cq-bg-alt); border: 1px solid var(--cq-border); border-radius: var(--cq-radius); cursor: pointer; transition: all 0.2s ease-out; font-size: 1em; color: var(--cq-text); box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
            .cq-option:hover { background: rgba(var(--interactive-accent-rgb), 0.05); border-color: var(--cq-accent); transform: translateX(4px); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .cq-option.is-selected { background: linear-gradient(90deg, rgba(var(--interactive-accent-rgb), 0.15), rgba(var(--interactive-accent-rgb), 0.02)); border-color: var(--cq-accent); box-shadow: inset 4px 0 0 var(--cq-accent), var(--cq-elevation-1); font-weight: 600; transform: translateX(6px); }
            
            .cq-markdown-clean p { margin: 0; }
            
            .cq-review-hidden { display: none; }
            .cq-review-mode { cursor: default; pointer-events: none; }
            .cq-review-note { margin-top: 15px; padding: 15px; background: rgba(var(--interactive-accent-rgb), 0.1); border-left: 4px solid var(--cq-accent); border-radius: 4px; font-size: 0.95em; }
            
            .is-correct-answer { background:#2ecc71;border-color: #2ecc71 !important; box-shadow: inset 4px 0 0 #2ecc71 !important; color: white; }
            .is-wrong-answer { background:#e74c3c ; border-color: #e74c3c !important; box-shadow: inset 4px 0 0 #e74c3c !important; color: white; }
            
            .cq-submit-wrap { display: flex; justify-content: flex-end; margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--cq-border); }
            .cq-submit-btn { background: linear-gradient(135deg, var(--cq-accent), #8e44ad); color: white; padding: 12px 28px; border-radius: var(--cq-radius); font-weight: 600; cursor: pointer; border: none; font-size: 1.05em; transition: all 0.2s ease; box-shadow: 0 4px 10px rgba(var(--interactive-accent-rgb), 0.3); }
            .cq-submit-btn:hover { opacity: 0.95; transform: translateY(-2px); box-shadow: 0 6px 14px rgba(var(--interactive-accent-rgb), 0.4); }
            .cq-secondary-btn { background: var(--cq-bg-alt); border: 1px solid var(--cq-border); color: var(--cq-text); padding: 10px 20px; border-radius: var(--cq-radius); cursor: pointer; transition: all 0.2s; font-weight: 600; box-shadow: var(--cq-elevation-1); }
            .cq-secondary-btn:hover { background: var(--background-modifier-hover); box-shadow: var(--cq-elevation-2); transform: translateY(-1px); }
            
            .cq-results { text-align: center; padding: 40px 20px; background: var(--cq-bg); border-radius: 16px; border: 1px solid var(--cq-border); box-shadow: var(--cq-elevation-2); }
            .cq-result-actions { display: flex; justify-content: center; gap: 15px; margin-top: 30px; flex-wrap: wrap; }
            .cq-result-badge { display: inline-block; padding: 10px 24px; border-radius: 30px; font-weight: 800; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1.5px; }
            .cq-badge-pass { background: rgba(46, 204, 113, 0.2); color: #27ae60; box-shadow: 0 0 20px rgba(46, 204, 113, 0.2); }
            .cq-badge-fail { background: rgba(231, 76, 60, 0.2); color: #c0392b; box-shadow: 0 0 20px rgba(231, 76, 60, 0.2); }
            
            .cq-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 25px 0; }
            .cq-stat-card { background: var(--cq-bg-alt); padding: 25px 20px; border-radius: var(--cq-radius); border: 1px solid var(--cq-border); display: flex; flex-direction: column; align-items: center; box-shadow: var(--cq-elevation-1); transition: transform 0.2s; }
            .cq-stat-card:hover { transform: translateY(-3px); box-shadow: var(--cq-elevation-2); }
            .cq-stat-card.accent { border-color: var(--cq-accent); box-shadow: 0 4px 12px rgba(var(--interactive-accent-rgb), 0.15); }
            .cq-stat-card.success .cq-value { color: #2ecc71; }
            .cq-stat-card.danger .cq-value { color: #e74c3c; }
            .cq-label { font-size: 0.85em; color: var(--cq-muted); text-transform: uppercase; margin-bottom: 10px; font-weight: 700; letter-spacing: 0.5px; text-align: center; }
            .cq-value { font-size: 2em; font-weight: 800; text-align: center; }
            
            .cq-tab-row { display: flex; gap: 10px; border-bottom: 2px solid var(--cq-border); margin-bottom: 20px; }
            .cq-tab-btn { background: none; border: none; padding: 14px 28px; font-size: 1.05em; font-weight: 600; color: var(--cq-muted); cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -2px; transition: all 0.2s; border-radius: 8px 8px 0 0; }
            .cq-tab-btn:hover { color: var(--cq-text); background: rgba(var(--interactive-accent-rgb), 0.05); }
            .cq-tab-btn.active { color: var(--cq-accent); border-bottom-color: var(--cq-accent); background: linear-gradient(0deg, rgba(var(--interactive-accent-rgb), 0.1), transparent); }
            
            .cq-dashboard-toolbar { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 15px; margin-bottom: 20px; background: var(--cq-bg); padding: 16px; border-radius: var(--cq-radius); border: 1px solid var(--cq-border); box-shadow: var(--cq-elevation-1); }
            .cq-filters { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
            .cq-search-input, .cq-select { background: var(--cq-bg-alt); border: 1px solid var(--cq-border); padding: 10px 14px; border-radius: 8px; font-size: 0.95em; color: var(--cq-text); outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
            .cq-search-input:focus, .cq-select:focus { border-color: var(--cq-accent); box-shadow: 0 0 0 3px rgba(var(--interactive-accent-rgb), 0.2); }
            
            .cq-table-responsive { overflow-x: auto; border: 1px solid var(--cq-border); border-radius: var(--cq-radius); box-shadow: var(--cq-elevation-1); }
            .cq-stats-table { width: 100%; border-collapse: collapse; font-size: 0.95em; background: var(--cq-bg-alt); margin: 0; }
            .cq-stats-table th, .cq-stats-table td { padding: 16px 20px; border-bottom: 1px solid var(--cq-border); text-align: left; }
            .cq-stats-table th { background: var(--background-secondary); font-weight: 700; color: var(--cq-muted); text-transform: uppercase; font-size: 0.85em; letter-spacing: 0.5px; position: sticky; top: 0; z-index: 5; }
            .cq-stats-table tr:hover td { background: rgba(var(--interactive-accent-rgb), 0.03); }
            
            .cq-actions-td { display: flex; gap: 8px; }
            .cq-icon-btn { background: var(--cq-bg); border: 1px solid var(--cq-border); border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
            .cq-icon-btn:hover { background: var(--background-modifier-hover); transform: translateY(-1px); box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .cq-del-btn:hover { background: rgba(231,76,60,0.1); border-color: rgba(231,76,60,0.3); color: #e74c3c; }
            .cq-del-all-btn { background: transparent; border: 1px solid var(--text-error); color: var(--text-error); padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
            .cq-del-all-btn:hover { background: var(--text-error); color: white; box-shadow: 0 4px 10px rgba(231,76,60,0.3); }
            
            .cq-status-pass { background: rgba(46, 204, 113, 0.15); color: #27ae60; padding: 6px 14px; border-radius: 20px; font-size: 0.85em; font-weight: 700; }
            .cq-status-fail { background: rgba(231, 76, 60, 0.15); color: #c0392b; padding: 6px 14px; border-radius: 20px; font-size: 0.85em; font-weight: 700; }


/* Add these lines inside the backticks of styleEl.textContent */

.cq-stat-card.info { border-color: #3498db; }
.cq-stat-card.info .cq-value { color: #3498db; }

/* Highlight for questions the user interacted with */
.cq-question-block.is-user-answered {
    background:#ADD6FF ;/*var(--background-primary-alt)*/
    border-left: 5px solid #296CAE;
    box-shadow: var(--cq-elevation-2);
}

/* Optional: Faded look for skipped questions in review */
.cq-question-block.is-unanswered {
    opacity: 0.8;
    border: 2px solid #E4C716;
}

/* Ensure the background is distinct in the dashboard too */
.cq-review-mode.is-user-answered {
    background-color: rgba(var(--interactive-accent-rgb), 0.03);
}
        
        `;
        document.head.appendChild(styleEl);
    }
}

// =====================================================================
// 11. OBSIDIAN SETTINGS TAB
// =====================================================================

class CQuestionSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'CQuestion Engine Settings (v4.2.0)' });

        new obsidian.Setting(containerEl)
            .setName('Debug Mode')
            .setDesc('Enable detailed console logging.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableDebug)
                .onChange(async (value) => {
                    this.plugin.settings.enableDebug = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        containerEl.createEl('br');
        
        const dangerZone = containerEl.createDiv({ cls: 'cq-error-box' });
        dangerZone.createEl('h3', { text: 'Danger Zone', attr: {style: 'margin-top: 0; color: inherit;'} });
        
        new obsidian.Setting(dangerZone)
            .setName('Clear Entire Database')
            .setDesc('Wipes all exam history globally from Obsidian vault.')
            .addButton(btn => btn
                .setButtonText('Wipe Data')
                .setWarning()
                .onClick(async () => {
                    if (confirm("WARNING: This will permanently delete all CQuestion exam records. Proceed?")) {
                        this.plugin.settings.history = [];
                        await this.plugin.saveData(this.plugin.settings);
                        new obsidian.Notice('CQuestion Database wiped successfully.');
                    }
                }));
    }
}

module.exports = CQuestionPlugin;