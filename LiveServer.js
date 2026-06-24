#!/usr/bin/env node
const http = require('http');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// ==========================================
// 1. CARBON FORMAT PARSER
// ==========================================
const CarbonFormat = {
    parse(input) {
        if (typeof input !== 'string') return {};
        const lines = input.split(/\r?\n/);
        const root = {};
        const stack = [{ ref: root, path: [], indent: -1 }];
        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//')) continue;
            const currentIndent = line.search(/\S/);
            while (stack.length > 1 && currentIndent <= stack[stack.length - 1].indent) stack.pop();
            const parent = stack[stack.length - 1];
            if (trimmed.startsWith(':')) {
                const key = trimmed.slice(1).trim();
                if (key === '*null') continue;
                parent.ref[key] = parent.ref[key] || {};
                stack.push({ ref: parent.ref[key], path: [...parent.path, key], indent: currentIndent });
            } else if (trimmed.startsWith('-')) {
                const fileName = trimmed.slice(1).trim();
                if (fileName === '*null') continue;
                if (!parent.ref.files) parent.ref.files = [];
                const pathStr = parent.path.join('/');
                parent.ref.files.push({ name: fileName, path: pathStr, filePath: pathStr ? `${pathStr}/${fileName}` : fileName });
            }
        }
        return root;
    }
};

// ==========================================
// 2. VIRTUAL BUILD HELPERS
// ==========================================
function getFilesFromPath(obj, dotPath) {
    const parts = dotPath.split('.');
    let current = obj;
    for (const part of parts) {
        if (current && current[part]) current = current[part];
        else return [];
    }
    const allFiles = [];
    function collect(node) {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node.files)) allFiles.push(...node.files);
        for (const key in node) {
            if (key !== 'files') collect(node[key]);
        }
    }
    collect(current);
    return allFiles;
}

async function bundleFiles(fileList, type) {
    let bundle = '';
    const validExtensions = type === 'css' ? ['.css'] : ['.js', '.jsx'];
    for (const file of fileList) {
        const isCorrectType = validExtensions.some(ext => file.filePath.endsWith(ext));
        if (!isCorrectType) continue;
        try {
            const content = await fs.readFile(file.filePath, 'utf8');
            bundle += type === 'css' ? `\n/* Source: ${file.filePath} */\n${content}\n` : `\n// Source: ${file.filePath}\n${content}\n`;
        } catch (err) {
            console.error(`[Warning] Missing file during live build: ${file.filePath}`);
        }
    }
    return bundle;
}

/* ==========================================================================
   LITHIUM CARBON ENGINE v3.2 (Synchronous Edition - Node Patched)
   ========================================================================== */

const CarbonConfig = {
    root: './',
    debug: true,
    timeout: 8000,
    ext: '.jsx'
};

const CarbonStore = {
    user: { loggedIn: false, name: 'Guest' },
    theme: 'light',
    appVersion: '3.2.0',
    data: {}
};

class ResourceManager {
    constructor() {
        this.cache = new Map();
    }

    // Patched to perform synchronous file reading in Node.js
    fetch(url) {
        if (this.cache.has(url)) {
            if (CarbonConfig.debug) console.log(`[Cache] Hit: ${url}`);
            return this.cache.get(url);
        }

        try {
            if (fsSync.existsSync(url)) {
                const content = fsSync.readFileSync(url, 'utf8');
                this.cache.set(url, content);
                return content;
            }
            return ""; 
        } catch (err) {
            throw new Error(`Resource Load Error: ${url} (${err.message})`);
        }
    }
}

class CarbonCompiler {
    constructor(resourceManager) {
        this.resources = resourceManager;
        this.regex = /<\?CarbonJS([\s\S]*?)\?>/g;
    }

    compile(template, sourceUrl = 'memory') {
        if (!template) return "";
        return template.replace(this.regex, (match, code) => {
            return this.executeSandboxed(code, sourceUrl);
        });
    }

    executeSandboxed(userCode, sourceUrl) {
        let _buffer = "";

        const writeIt = (content) => {
            if (content === null || content === undefined) return;
            const str = typeof content === 'object' ? JSON.stringify(content) : String(content);
            _buffer += str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        };

        const writeUi = (html) => {
            if (html === null || html === undefined) return;
            _buffer += String(html);
        };

        const include = (filename) => {
            try {
                const content = this.resources.fetch(filename);
                return this.compile(content, filename);
            } catch (e) {
                return `<div class="carbon-error-box">Include Failed: ${filename}</div>`;
            }
        };

        const tools = {
            date: () => new Date().toLocaleDateString(),
            upper: (str) => String(str).toUpperCase(),
            uuid: () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'uuid-fallback'
        };

        try {
            const fn = new Function(
                'writeIt', 'writeUi', 'include', 'store', 'tools',
                `"use strict";\n${userCode}`
            );
            fn(writeIt, writeUi, include, CarbonStore, tools);
            return _buffer;
        } catch (err) {
            console.error(`[Carbon Runtime Error] ${sourceUrl}:`, err);
            return `<div class="carbon-error-box">Runtime Exception: ${err.message}</div>`;
        }
    }
}

const Carbon = (() => {
    const _registry = new Map();
    let _active = null;
    let _isTransitioning = false;
    
    return {
        PageView: (cfg) => {
            const selector = `pageview[Name="${cfg.Name}"], pageview[name="${cfg.Name}"]`;
            const el = document.querySelector(selector);
            if (!el) return console.warn(`Carbon: PageView "${cfg.Name}" not found in DOM.`);
            
            _registry.set(cfg.Name, { ...cfg, el });
            if (cfg.Initial) Carbon.openPageView(cfg.Name);
        },
        openPageView: (name) => {
            if (_isTransitioning || _active === name) return;
            const next = _registry.get(name);
            if (!next) return console.error(`Carbon: Page "${name}" is not registered.`);
            
            _isTransitioning = true;
            if (_active) {
                const current = _registry.get(_active);
                current.el.setAttribute('active', 'false');
                if (current.OnPageExit) current.OnPageExit();
            }
            
            next.el.setAttribute('active', 'true');
            _active = name;
            if (next.OnScript) next.OnScript();
            
            setTimeout(() => {
                _isTransitioning = false;
                if (next.OnPageFinished) next.OnPageFinished();
            }, 140);
        }
    };
})();

let _lastGeneratedRaw = "";

/**
 * Returns the raw compiled HTML synchronously. 
 */
function getGeneratedRaw(text) {
    if (text === undefined || text === null) {
        return _lastGeneratedRaw;
    }

    const resourceManager = new ResourceManager();
    const carbonCompiler = new CarbonCompiler(resourceManager);
    
    const processedText = carbonCompiler.compile(text);
    return runLithiumEngine([processedText], { CarbonStore });
}

/**
 * Core Lithium Parsing Engine
 */
function runLithiumEngine(processedResponses, baseState) {
    const state = { ...(typeof window !== 'undefined' ? window : {}), ...baseState };   
    const components = {};
    const functions = {};
    const styles = {};

    let fallbackHtml = "";

    // 1. PARSING ENGINE
    processedResponses.forEach(cleanText => {
        fallbackHtml += cleanText + "\n";
        
        // Patched Regex: Avoid stripping "://" URLs while removing comments
        const code = cleanText
            .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') 
            .replace(/(?<!:)\/\/.*/g, '');

        // A. STATE VARIABLES
        const stateRegex = /var\s+(\w+)\s*=\s*(\{[\s\S]*?\}|\[[\s\S]*?\]|[^;\n]+);?/g;
        let sMatch;
        while ((sMatch = stateRegex.exec(code)) !== null) {
            const varName = sMatch[1];
            const varValue = sMatch[2];
            try { state[varName] = new Function(`return ${varValue}`)(); } 
            catch (e) { state[varName] = varValue.trim().replace(/^['"]|['"]$/g, ''); }
        }

        // B. STYLE OBJECTS
        const styleBlockRegex = /var\s+(\w+)\s*=\s*\{([\s\S]*?)\n\}/g;
        let styleMatch;
        while ((styleMatch = styleBlockRegex.exec(code)) !== null) {
            const styleName = styleMatch[1];
            styles[styleName] = styles[styleName] || {};
            
            const cssContent = styleMatch[2];
            const propRegex = /(\w+)\s*:\s*\{([\s\S]*?)\}/g;
            let propMatch;
            while ((propMatch = propRegex.exec(cssContent)) !== null) {
                const className = propMatch[1];
                const rules = propMatch[2];
                const cssString = rules.split(',').map(line => {
                    // Split only on the FIRST colon so values like var(--x) or url(a:b) survive intact
                    const colonIdx = line.indexOf(':');
                    if (colonIdx === -1) return '';
                    const key = line.slice(0, colonIdx).trim().replace(/([A-Z])/g, "-$1").toLowerCase();
                    const val = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
                    return `${key}: ${val};`;
                }).join(' ');
                styles[styleName][className] = cssString.trim();
            }
        }

        // C. STATIC COMPONENTS (Hardened Regex to support missing newlines/semicolons)
        const compRegex = /var\s+(\w+)\s*=\s*\(\s*([\s\S]*?)\s*\)(?:\s*;|\n|$)/g;
        let cMatch;
        while ((cMatch = compRegex.exec(code)) !== null) {
            components[cMatch[1]] = cMatch[2].trim();
        }

        // D. FUNCTION COMPONENTS
        const funcRegex = /function\s+(\w+)\s*\(([\w\s,]*)\)\s*\{\s*return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*\}/g;
        let fMatch;
        while ((fMatch = funcRegex.exec(code)) !== null) {
            functions[fMatch[1]] = { 
                params: fMatch[2].trim(),
                body: fMatch[3].trim()
            };
        }
    });

    // 2. ENTRY POINT DETERMINATION
    let html = components['Main'] || components['HomeUi'];
    
    // SAFETY OVERRIDE: If no component entry point is found, return the raw code 
    // to prevent the framework from destructively parsing standard JS as Lithium.
    if (!html) {
        return fallbackHtml.trim();
    }
    
    // 3. RECURSIVE RENDERER
    const usedIds = new Map();
    let iterations = 0;
    const MAX_DEPTH = 25;

    const resolvePath = (path, dataSource) => {
        if (!path) return undefined;
        const keys = path.split(/[\.\[\]]+/).filter(k => k !== "");
        let res = dataSource;
        for (const key of keys) {
            if (res === undefined || res === null) return undefined;
            res = res[key];
        }
        return res;
    };

    while (iterations < MAX_DEPTH) {
        let changed = false;

        // PHASE 1: Functional Components
        const funcTagRegex = /<(\w+)\s+config=\{\{([\s\S]*?)\}\}\s*\/>/g;
        html = html.replace(funcTagRegex, (match, funcName, configBody) => {
            if (!functions[funcName]) return match;
            changed = true;
            
            const funcDef = functions[funcName];
            let props = {};

            try {
                const evaluator = new Function(...Object.keys(state), `return {${configBody}}`);
                props = evaluator(...Object.values(state));
            } catch (e) { console.warn(`Lithium: Config error in <${funcName} />`, e); }

            let rendered = funcDef.body;
            if (funcDef.params) {
                const paramRegex = new RegExp(`\\{${funcDef.params}(\\.[\\w\\[\\]\\.]*)?\\}`, 'g');
                rendered = rendered.replace(paramRegex, (m, pathSuffix) => {
                    const val = pathSuffix ? resolvePath(pathSuffix.substring(1), props) : props;
                    return (val !== undefined && val !== null) ? val : "";
                });
            }
            return rendered;
        });

        // PHASE 2: Static Components
        for (const [name, content] of Object.entries(components)) {
            const tag = new RegExp(`<${name}\\s*\\/>`, 'g');
            if (tag.test(html)) {
                html = html.replace(tag, content);
                changed = true;
            }
        }

        // PHASE 3: Data Injection
        html = html.replace(/<\$([\w\.\[\]]+)\s*\/>/g, (m, path) => {
            const res = resolvePath(path, state);
            if (res !== undefined) { changed = true; return res; }
            changed = true; // Prevent infinite loop on dead tags
            return "";
        });

        // PHASE 4: Expressions
        // First, protect string-literal style attributes (e.g. style="var(--x)") by temporarily
        // encoding them so the expression phase cannot corrupt their values.
        const styleStringPlaceholders = [];
        html = html.replace(/style="([^"]*)"/g, (m, val) => {
            const idx = styleStringPlaceholders.length;
            styleStringPlaceholders.push(val);
            return `style="__STYLE_LITERAL_${idx}__"`;
        });

        html = html.replace(/\{([^{}]+)\}/g, (m, expr) => {
            const trimExpr = expr.trim();
            if (trimExpr.includes('.map') || (trimExpr.includes('.') && styles[trimExpr.split('.')[0]])) return m;
            
            const simpleRes = resolvePath(trimExpr, state);
            if (simpleRes !== undefined) { changed = true; return simpleRes; }
            
            try {
                if (/^[a-zA-Z0-9_\.\s\+\-\*\/]+$/.test(trimExpr)) {
                    const evalRes = new Function(...Object.keys(state), `return (${trimExpr})`)(...Object.values(state));
                    if (evalRes !== undefined) { changed = true; return evalRes; }
                }
            } catch (e) { }
            
            return m;
        });

        // Restore protected style="..." string literals
        html = html.replace(/style="__STYLE_LITERAL_(\d+)__"/g, (m, idx) => {
            return `style="${styleStringPlaceholders[parseInt(idx)]}"`;
        });

        // Resolve style="${varName}" — convert a nested style object to inline CSS string.
        // Example: var mainStyle = { color: 'red', fontSize: '14px' }
        // Usage in JSX: style="${mainStyle}" → style="color: red; font-size: 14px;"
        html = html.replace(/style="\$\{(\w+)\}"/g, (m, varName) => {
            const val = state[varName];
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                const cssStr = Object.entries(val).map(([k, v]) => {
                    const cssKey = k.replace(/([A-Z])/g, '-$1').toLowerCase();
                    return `${cssKey}: ${v};`;
                }).join(' ');
                changed = true;
                return `style="${cssStr}"`;
            }
            return m;
        });

        // PHASE 5: Style Injection
        html = html.replace(/style=\{\s*(\w+)\.(\w+)\s*\}/g, (m, obj, key) => {
            if (styles[obj] && styles[obj][key]) {
                changed = true;
                return `style="${styles[obj][key]}"`;
            }
            return `style=""`;
        });

        if (!changed) break;
        iterations++;
    }

    // 4. FINAL DOM PROCESSING
    html = html.replace(/id=["'](.*?)["']/g, (match, id) => {
        let count = (usedIds.get(id) || 0) + 1;
        usedIds.set(id, count);
        return count > 1 ? `id="${id}-${count}"` : `id="${id}"`;
    });

    return html.trim();
}

/**
 * Standard Framework Renderer (Synchronous)
 */
function renderFramework(fileUrls, targetSelector) {
    console.time("Lithium-Carbon Render");
    try {
        const resourceManager = new ResourceManager();
        const carbonCompiler = new CarbonCompiler(resourceManager);

        const urls = Array.isArray(fileUrls) ? fileUrls : [fileUrls];
        const rawResponses = urls.map(url => resourceManager.fetch(url));
        const processedResponses = rawResponses.map(raw => carbonCompiler.compile(raw));
        const finalHtml = runLithiumEngine(processedResponses, { CarbonStore });
        
        _lastGeneratedRaw = finalHtml;

        const target = document.querySelector(targetSelector);
        if (target) {
            target.innerHTML = finalHtml;
            if (typeof window.InitApp === 'function') window.InitApp();
        }
        console.timeEnd("Lithium-Carbon Render");
    } catch (err) {
        console.error("Engine Critical Failure:", err);
    }
}

function LithiumCompiler({ File, Id }) {
    renderFramework(File, "#" + (Id || 'app'));
}

// ==========================================
// 3. IN-MEMORY HTML GENERATOR
// ==========================================
async function generateLiveHtml() {
    try {
        // Read the current state of the Carbon files
        const [buildRaw, packageRaw, mainRaw] = await Promise.all([
            fs.readFile('Carbon.build', 'utf8').catch(() => ""),
            fs.readFile('Carbon.package', 'utf8').catch(() => ""),
            fs.readFile('Carbon.main', 'utf8').catch(() => "")
        ]);

        const data = {
            Build: CarbonFormat.parse(buildRaw),
            Package: CarbonFormat.parse(packageRaw),
            Main: CarbonFormat.parse(mainRaw)
        };

        // Bundle resources virtually (no files written)
        const engineStyle = await bundleFiles(getFilesFromPath(data, 'Build.Engine.Style'), 'css');
        const engineCore = await bundleFiles(getFilesFromPath(data, 'Build.Engine.Core'), 'js');
        const engineThemes = await bundleFiles(getFilesFromPath(data, 'Build.Engine.Themes'), 'js');
        const prebuiltStyle = await bundleFiles(getFilesFromPath(data, 'Build.Engine.Prebuilt'), 'css');
        const prebuiltScript = await bundleFiles(getFilesFromPath(data, 'Build.Engine.Prebuilt'), 'js');
        const packageStyle = await bundleFiles(getFilesFromPath(data, 'Package.Package.Style'), 'css');
        const packageScript = await bundleFiles(getFilesFromPath(data, 'Package.Package.Script'), 'js');
        const mainPre = await bundleFiles(getFilesFromPath(data, 'Main.Main.PreScript'), 'js');
        const mainThemes = await bundleFiles(getFilesFromPath(data, 'Main.Main.Themes'), 'js');
        const mainStyle = await bundleFiles(getFilesFromPath(data, 'Main.Main.Style'), 'css');
        const mainScript = await bundleFiles(getFilesFromPath(data, 'Main.Main.Script'), 'js');
        const mainPostScript = await bundleFiles(getFilesFromPath(data, 'Main.Main.PostScript'), 'js');
        const TopScript = await bundleFiles(getFilesFromPath(data, 'Main.Main.TopScript'), 'js');
        const BottomScript = await bundleFiles(getFilesFromPath(data, 'Main.Main.BottomScript'), 'js');

        // We leave mainViews raw here; your frontend engine will parse it, 
        // OR if you use SSR (Server Side Rendering) you can run it through your Lithium parser here.
        const mainViews = await bundleFiles(getFilesFromPath(data, 'Main.Main.Views'), 'js');
        const compiledViews = getGeneratedRaw(mainViews);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Carbon Live Preview</title>
    <style>${engineStyle}</style>
    <script>${engineThemes}</script>
    <style>${prebuiltStyle}</style>
    <style>${packageStyle}</style>
    <script>${mainThemes}</script>
    <style>${mainStyle}</style>
</head>
<body>

    <script>${TopScript}</script>
    <script>${engineCore}</script>
    
    <script>${prebuiltScript}</script> 
    <script>${packageScript}</script>
    <script>${mainPre}</script>
    
    <div>
       
            ${compiledViews}
        
    </div>
    <!--post script-->
    <script>
        ${mainPostScript}
    </script>
    <script>${mainScript}</script>
    <script>${BottomScript}</script>
    <script>eruda.int()</script>
    <script>
        const evtSource = new EventSource("/live-reload");
        evtSource.onmessage = () => {
            console.log("⚡ Change detected. Reloading...");
            location.reload();
        };
        evtSource.onerror = () => console.warn("Live Server disconnected. Retrying...");
    </script>
    
</body>
</html>`;
    } catch (err) {
        return `<h1>Build Error</h1><pre>${err.stack}</pre>`;
    }
}

// ==========================================
// 4. LIVE PREVIEW SERVER & WATCHER
// ==========================================
async function startLiveServer(port = 3000) {
    let clients = [];
    const broadcastReload = () => {
        clients.forEach(res => res.write("data: reload\n\n"));
    };

    const server = http.createServer(async (req, res) => {
        // A. Handle Server-Sent Events connection
        if (req.url === '/live-reload') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            clients.push(res);
            req.on('close', () => {
                clients = clients.filter(client => client !== res);
            });
            return;
        }

        // B. Serve Dynamic HTML Virtual Build
        if (req.url === '/' || req.url === '/index.html') {
            console.log("🛠️  Generating Virtual Build for browser...");
            const html = await generateLiveHtml();
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
            return;
        }

        // C. Serve physical assets (images, external raw files if needed)
        const filePath = path.join(process.cwd(), req.url);
        try {
            const data = await fs.readFile(filePath);
            const ext = path.extname(filePath);
            const mimes = { '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg' };
            res.writeHead(200, { 'Content-Type': mimes[ext] || 'text/plain' });
            res.end(data);
        } catch (e) {
            res.writeHead(404);
            res.end("Not Found");
        }
    });

    // D. Directory Watcher
    const watchPaths = ['Engine', 'Package', 'Main', 'Carbon.build', 'Carbon.package', 'Carbon.main'];
    
    // Prevent multiple rapid reloads (debounce)
    let reloadTimeout = null; 
    
    watchPaths.forEach(p => {
        if (fsSync.existsSync(p)) {
            fs.watch(p, { recursive: true }, async (event, filename) => {
                if (filename) {
                    clearTimeout(reloadTimeout);
                    reloadTimeout = setTimeout(() => {
                        console.log(`\n✨ Change detected: ${filename}. Signaling browser...`);
                        broadcastReload(); 
                    }, 150); // 150ms debounce keeps Android CPU usage low
                }
            });
        }
    });

    server.listen(port, () => {
        console.log(`=========================================`);
        console.log(`🚀 CARBON LIVE SERVER RUNNING`);
        console.log(`🔗 Open in browser: http://localhost:${port}`);
        console.log(`📂 Watching file system for changes...`);
        console.log(`=========================================`);
    });
}

// Start the server
startLiveServer(3000);