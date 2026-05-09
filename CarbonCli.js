#!/usr/bin/env node
const fs = require('fs').promises;

// --- IMPORT OR PASTE YOUR CORE LOGIC HERE ---
/**
 * CarbonFormat - Production Grade Interchange Utility
 */
const CarbonFormat = (function() {
  'use strict';
  return {
    parse(input) {
      if (typeof input !== 'string') throw new Error('Input must be a string');
      const lines = input.split(/\r?\n/);
      const root = {};
      const stack = [{ ref: root, path: [], indent: -1 }];
      
      for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//')) continue;
        const currentIndent = line.search(/\S/);
        while (stack.length > 1 && currentIndent <= stack[stack.length - 1].indent) {
          stack.pop();
        }
        const parent = stack[stack.length - 1];
        if (trimmed.startsWith(':')) {
          const key = trimmed.slice(1).trim();
          if (key === '*null') continue;
          parent.ref[key] = parent.ref[key] || {};
          stack.push({
            ref: parent.ref[key],
            path: [...parent.path, key],
            indent: currentIndent
          });
        }
        else if (trimmed.startsWith('-')) {
          const fileName = trimmed.slice(1).trim();
          if (fileName === '*null') continue;
          if (!parent.ref.files) parent.ref.files = [];
          const pathStr = parent.path.join('/');
          parent.ref.files.push({
            name: fileName,
            path: pathStr,
            filePath: pathStr ? `${pathStr}/${fileName}` : fileName
          });
        }
      }
      return root;
    },
    stringify(obj, indentSize = 2) {
      let output = "";
      const process = (node, depth) => {
        const indent = " ".repeat(depth * indentSize);
        for (const key in node) {
          if (key === 'files') {
            node.files.forEach(file => {
              output += `${indent}- ${file.name}\n`;
            });
          } else {
            output += `${indent}:${key}\n`;
            const childKeys = Object.keys(node[key]);
            if (childKeys.length === 0) {
              output += `${" ".repeat((depth + 1) * indentSize)}- *null\n`;
            } else {
              process(node[key], depth + 1);
            }
          }
        }
      };
      process(obj, 0);
      return output.trim();
    }
  };
})();

async function assembleCarbonProject() {
  try {
    console.log('Reading Carbon files...');
    
    // 1. Read files concurrently for efficiency
    const [buildRaw, packageRaw, mainRaw] = await Promise.all([
      fs.readFile('Carbon.build', 'utf8'),
      fs.readFile('Carbon.package', 'utf8'),
      fs.readFile('Carbon.main', 'utf8')
    ]);
    
    // 2. Parse content using CarbonFormat and build the JSON object
    const compiledData = {
      Build: CarbonFormat.parse(buildRaw),
      Package: CarbonFormat.parse(packageRaw),
      Main: CarbonFormat.parse(mainRaw)
    };
    
    // 3. Output the result
    const jsonOutput = JSON.stringify(compiledData, null, 2);
    console.log('--- Compiled JSON Output ---');
    console.log(jsonOutput);
    
    // 4. Save to a file
    await fs.writeFile('combined.json', jsonOutput, 'utf8');
    console.log('\nSuccess: "combined.json" has been created.');
    
  } catch (err) {
    console.error('Failed to assemble project:', err.message);
  }
}

const fsSync = require('fs'); // Added for synchronous Carbon fetch operations

if (typeof window === 'undefined') {
    global.window = {};
    global.document = {
        querySelector: () => null,
        createElement: () => ({})
    };
    global.navigator = { userAgent: 'node' };
}

let errorLog = "";

/**
 * Helper to extract file objects from the nested Carbon JSON structure
 */
/**
 * Recursively extracts all "files" arrays from a given object branch
 */
function getFilesFromPath(obj, dotPath) {
    const parts = dotPath.split('.');
    let current = obj;
    
    // 1. Navigate to the starting point (e.g., Build.Engine.Prebuilt)
    for (const part of parts) {
        if (current && current[part]) {
            current = current[part];
        } else {
            return [];
        }
    }
    
    const allFiles = [];
    
    // 2. Recursive function to find every "files" array downstream
    function collect(node) {
        if (!node || typeof node !== 'object') return;
        
        if (Array.isArray(node.files)) {
            allFiles.push(...node.files);
        }
        
        for (const key in node) {
            if (key !== 'files') {
                collect(node[key]);
            }
        }
    }
    
    collect(current);
    return allFiles;
}
/**
 * Reads a list of file objects and returns their concatenated content.
 */
async function bundleFiles(fileList, type) {
    let bundle = '';
    // Define which extensions belong to which type
    const validExtensions = type === 'css' ? ['.css'] : ['.js', '.jsx'];
    
    for (const file of fileList) {
        // FIX: Check if the file actually matches the type
        const isCorrectType = validExtensions.some(ext => file.filePath.endsWith(ext));
        
        if (!isCorrectType) continue; // Skip if it's the wrong file type
        
        try {
            const content = await fs.readFile(file.filePath, 'utf8');
            if (type === 'css') {
                bundle += `\n/* Source: ${file.filePath} */\n${content}\n`;
            } else {
                bundle += `\n// Source: ${file.filePath}\n${content}\n`;
            }
        } catch (err) {
            errorLog += `----\nFileName: ${file.name}\nPath: ${file.filePath}\n----\n`;
            console.error(`Missing: ${file.filePath}`);
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
                    const parts = line.split(':');
                    if (parts.length < 2) return '';
                    const key = parts[0].trim().replace(/([A-Z])/g, "-$1").toLowerCase();
                    const val = parts[1].trim().replace(/['"]/g, '');
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
// BUILD EXECUTOR 
// ==========================================

async function buildHTML() {
  try {
    let data;
    try {
        data = JSON.parse(await fs.readFile('combined.json', 'utf8'));
    } catch (e) {
        console.warn("Notice: 'combined.json' not found. Using safe fallbacks.");
        data = {}; 
    }
    
    console.log('Building Carbon Project...');
    
const sections = {
    // Existing core files
    engineStyle: await bundleFiles(getFilesFromPath(data, 'Build.Engine.Style'), 'css'),
    engineCore: await bundleFiles(getFilesFromPath(data, 'Build.Engine.Core'), 'js'),
    engineThemes: await bundleFiles(getFilesFromPath(data, 'Build.Engine.Themes'), 'js'),
    
    // NEW: Collect all Prebuilt scripts and styles recursively
    prebuiltStyle: await bundleFiles(getFilesFromPath(data, 'Build.Engine.Prebuilt'), 'css'),
    prebuiltScript: await bundleFiles(getFilesFromPath(data, 'Build.Engine.Prebuilt'), 'js'),
    
    // Packages (Now works even with nested keys like "b")
    packageStyle: await bundleFiles(getFilesFromPath(data, 'Package.Package.Style'), 'css'),
    packageScript: await bundleFiles(getFilesFromPath(data, 'Package.Package.Script'), 'js'),
    
    // Main App files
    mainPre: await bundleFiles(getFilesFromPath(data, 'Main.Main.PreScript'), 'js'),
    mainThemes: await bundleFiles(getFilesFromPath(data, 'Main.Main.Themes'), 'js'),
    mainStyle: await bundleFiles(getFilesFromPath(data, 'Main.Main.Style'), 'css'),
    mainViews: await bundleFiles(getFilesFromPath(data, 'Main.Main.Views'), 'js'),
    mainScript: await bundleFiles(getFilesFromPath(data, 'Main.Main.Script'), 'js'),
    mainPost: await bundleFiles(getFilesFromPath(data, 'Main.Main.PostScript'), 'js'),
    mainTopScript: await bundleFiles(getFilesFromPath(data, 'Main.Main.TopScript'), 'js'),
    mainBottomScript: await bundleFiles(getFilesFromPath(data, 'Main.Main.BottomScript'), 'js'),


    
};
    // Correctly process raw view templates dynamically inside BuildHtml.
    // If sections.mainViews contains a valid "Main" component, it will safely compile to HTML.
    const compiledViews = getGeneratedRaw(sections.mainViews);

const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Carbon Framework</title>
    <!--All Style-->
    <style>${sections.engineStyle}</style>
    <script>${sections.engineThemes}</script>
    <style>${sections.prebuiltStyle}</style>
    <style>${sections.packageStyle}</style>
    <script>${sections.mainThemes}</script>
    <style>${sections.mainStyle}</style>
</head>
<body>
    <script>${sections.mainTopScript}</script>
    
    <!--All Script-->
    <script>${sections.engineCore}</script>
    <script>${sections.prebuiltScript}</script> 
    <script>${sections.packageScript}</script>
    <script>${sections.mainPre}</script>
    <div>
       
            ${compiledViews}
        
    </div>
    <!--adding post script--->
    <script>${sections.mainPost}</script>
    <script>${sections.mainScript}</script>
    <script>${sections.mainBottomScript}</script>
    
</body>
</html>`;
    
    await fs.writeFile('index.html', htmlTemplate, 'utf8');
    console.log('Build complete: index.html generated.');
    
    if (errorLog) {
      await fs.writeFile('error.txt', errorLog, 'utf8');
      console.log('Errors detected. Details saved to error.txt');
    } else {
      try { await fs.unlink('error.txt'); } catch (e) {}
      console.log('No errors found. All files loaded successfully.');
    }
    
  } catch (err) {
    console.error('Critical Build Failure:', err.message);
  }
}


const path = require('path');
const { execSync } = require('child_process');

/** Master Wrapper for build process */
async function buildProject() {
    await assembleCarbonProject();
    await buildHTML();
}

async function getProjectBundle(data, type) {
    const isJs = type === 'js';
    const label = isJs ? 'Javascript' : 'CSS';
    
    console.log(`📦 Creating combined ${label} bundle...`);
    
    // Strict Order: Engine -> Prebuilt -> Packages -> Main
    const sequence = isJs ? [
        getFilesFromPath(data, 'Main.Main.TopScript'),
        
        getFilesFromPath(data, 'Build.Engine.Core'),
        getFilesFromPath(data, 'Build.Engine.Prebuilt'),
        getFilesFromPath(data, 'Build.Engine.Themes'),
        getFilesFromPath(data, 'Package.Package.Script'),
        getFilesFromPath(data, 'Main.Main.Themes'),
        getFilesFromPath(data, 'Main.Main.PreScript'),
        getFilesFromPath(data, 'Main.Main.Script'),
        getFilesFromPath(data, 'Main.Main.PostScript'),
        getFilesFromPath(data, 'Main.Main.BottomScript')
    ] : [
        getFilesFromPath(data, 'Build.Engine.Style'),
        getFilesFromPath(data, 'Build.Engine.Prebuilt'),
        getFilesFromPath(data, 'Package.Package.Style'),
        getFilesFromPath(data, 'Main.Main.Style')
    ];
    
    let finalBundle = `/* Carbon Generated ${label} Bundle - ${new Date().toLocaleString()} */\n`;
    
    for (const list of sequence) {
        if (list.length > 0) {
            finalBundle += await bundleFiles(list, type);
        }
    }
    
    return finalBundle;
}

/**
 * Recursively scans a directory and builds an object structure 
 * formatted for CarbonFormat.stringify.
 */
async function buildObjectFromDir(dirPath) {
    const result = {};
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (entry.isDirectory()) {
            // Recursively process subfolders
            result[entry.name] = await buildObjectFromDir(path.join(dirPath, entry.name));
        } else {
            // Collect files
            files.push({ name: entry.name });
        }
    }

    // Attach files array to the current folder level if files exist
    if (files.length > 0) {
        result.files = files;
    }

    return result;
}

/**
 * Merges physical directory changes into an existing Carbon structure.
 * This ensures manual serial/ordering is preserved.
 */
function mergeDirectoryIntoObject(existingObj, physicalData) {
    const result = { ...existingObj };

    // --- 1. HANDLE FILES (The "Serial" Logic) ---
    const physicalFiles = physicalData.files || [];
    const existingFiles = result.files || [];

    // Filter existing files: Keep only those that still exist physically
    const keptFiles = existingFiles.filter(ef => 
        physicalFiles.some(pf => pf.name === ef.name)
    );

    // Find brand new files in the folder
    const newFiles = physicalFiles.filter(pf => 
        !existingFiles.some(ef => ef.name === pf.name)
    );

    // RESULT: Existing order is preserved, new files go to the bottom
    result.files = [...keptFiles, ...newFiles];
    
    // Cleanup if no files exist
    if (result.files.length === 0) delete result.files;

    // --- 2. HANDLE SUB-KEYS (Directories) ---
    const allKeys = new Set([
        ...Object.keys(result).filter(k => k !== 'files'),
        ...Object.keys(physicalData).filter(k => k !== 'files')
    ]);

    for (const key of allKeys) {
        if (!physicalData[key]) {
            // Folder was physically deleted
            delete result[key];
        } else {
            // Recurse and merge subfolder data
            result[key] = mergeDirectoryIntoObject(result[key] || {}, physicalData[key]);
        }
    }

    return result;
}

/**
 * Updated Master Sync function
 */
async function syncProjectFiles() {
    console.log("🔄 Syncing changes (Preserving manual file order)...");

    const roots = [
        { dir: 'Package', file: 'Carbon.package', rootKey: 'Package' },
        { dir: 'Engine', file: 'Carbon.build', rootKey: 'Engine' },
        { dir: 'Main', file: 'Carbon.main', rootKey: 'Main' }
    ];

    for (const { dir, file, rootKey } of roots) {
        try {
            if (fsSync.existsSync(dir)) {
                // 1. Scan the actual folder
                const physicalState = await buildObjectFromDir(dir);
                
                // 2. Read the existing Carbon file
                let currentConfig = {};
                if (fsSync.existsSync(file)) {
                    const raw = await fs.readFile(file, 'utf8');
                    currentConfig = CarbonFormat.parse(raw);
                }

                // 3. Merge physical changes into the config
                const mergedContent = mergeDirectoryIntoObject(
                    currentConfig[rootKey] || {}, 
                    physicalState
                );

                const finalOutput = { [rootKey]: mergedContent };
                
                // 4. Save back to file
                const formattedString = CarbonFormat.stringify(finalOutput);
                await fs.writeFile(file, formattedString, 'utf8');
                
                console.log(`✅ ${file} updated successfully.`);
            }
        } catch (err) {
            console.error(`❌ Failed to sync ${file}: ${err.message}`);
        }
    }
    console.log("🚀 Sync process complete.");
}

/* ==========================================================================
   ENCRYPTION UTILITY
   ========================================================================== */
/* ==========================================================================
   OUTPUT ORGANIZER & 256-BIT ENCRYPTION UTILITY
   ========================================================================== */
async function organizeAndEncryptOutputs(args, encKey) {
    const crypto = require('crypto');
    const path = require('path');
    const fsP = require('fs').promises;
    const fsSync = require('fs');
    
    // 1. Create the new structured target directories
    const dirs = [
        'generated',
        'generated/lib/cni',
        'generated/lib/cnui',
        'generated/Resources'
    ];
    for (const d of dirs) {
        await fsP.mkdir(d, { recursive: true });
    }
    
    // Helper: AES-256-CBC Encryption
    function encryptData256(data, keyString) {
        const key = crypto.createHash('sha256').update(keyString).digest();
        const iv = crypto.randomBytes(16); // 16-byte Initialization Vector
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }
    
    const movedFiles = [];
    
    // 2. Extract and process individual JS/CSS files from combined.json
    if (fsSync.existsSync('combined.json')) {
        try {
            const combinedData = JSON.parse(await fsP.readFile('combined.json', 'utf8'));
            const allFiles = [];
            
            // Recursively find all 'files' arrays in the JSON
            function extractFiles(node) {
                if (!node || typeof node !== 'object') return;
                if (Array.isArray(node.files)) {
                    allFiles.push(...node.files);
                }
                for (const key in node) {
                    if (key !== 'files') extractFiles(node[key]);
                }
            }
            extractFiles(combinedData);
            
            // Iterate through every extracted file
            for (const file of allFiles) {
                if (!file.filePath || !fsSync.existsSync(file.filePath)) continue;
                
                const ext = path.extname(file.filePath).toLowerCase();
                const baseName = path.basename(file.filePath, ext); // Name without extension
                let destPath = null;
                
                // Route .js files to cni and .css files to cnui
                if (ext === '.js' || ext === '.jsx') {
                    destPath = path.join('generated/lib/cni', `lib${baseName}.cso`);
                } else if (ext === '.css') {
                    destPath = path.join('generated/lib/cnui', `lib${baseName}.dso`);
                }
                
                if (destPath) {
                    const data = await fsP.readFile(file.filePath, 'utf8');
                    
                    // Encrypt if a key was provided, otherwise just copy the plain code over
                    const payload = encKey ? encryptData256(data, encKey) : data;
                    
                    await fsP.writeFile(destPath, payload, 'utf8');
                    movedFiles.push(destPath);
                    console.log(`📦 Processed ${encKey ? '(Encrypted)' : '(Copied)'}: ${file.filePath} -> ${destPath}`);
                }
            }
        } catch (err) {
            console.error(`⚠️ Failed to parse combined.json for file extraction: ${err.message}`);
        }
    } else {
        console.warn("⚠️ combined.json not found! Skipping individual file extraction.");
    }
    
    // 3. Process base project outputs (index.html, combined.json itself)
    const coreMap = {
        'index.html': 'generated/index.main.cpk',
        'combined.json': 'generated/base.bundle.cf',
        'bundle.js':'generated/lib/libindex.cni',
        'bundle.css':'generated/lib/libindex.cnui',
    };
    
    for (const [src, dest] of Object.entries(coreMap)) {
        if (fsSync.existsSync(src)) {
            let data = await fsP.readFile(src, 'utf8');
            if (encKey) {
                data = encryptData256(data, encKey);
                console.log(`🔒 Encrypted & Sealed core file: ${dest}`);
            } else {
                console.log(`📦 Packaged core file: ${src} -> ${dest}`);
            }
            await fsP.writeFile(dest, data, 'utf8');
            movedFiles.push(dest);
        }
    }
    
    // 4. Copy 'Resources' directory into generated/Resources/
    if (fsSync.existsSync('Resources')) {
        try {
            await fsP.cp('Resources', 'generated/Resources', { recursive: true });
            console.log(`📁 Copied resources: Resources/ -> generated/Resources/`);
        } catch (e) {
            console.warn(`⚠️ Notice: 'Resources' folder skipped or failed to copy.`);
        }
    }
}
/* ==========================================================================
   UPDATED CLI ROUTING
   ========================================================================== */
async function runCli() {
    const args = process.argv.slice(2);
    const encIndex = args.indexOf('--enc');
            let encKey = null;
            if (encIndex !== -1 && args.length > encIndex + 1) {
            encKey = args[encIndex + 1];
        }
    
    if (args.length === 0 || args.includes('--help')) {
        console.log(`
⚡ LITHIUM CARBON CLI v3.2
Build Commands:
  --carbon-framework --build        Assembles and builds full project
  --build-json                      Generates combined.json only
  --build-css                       Generates a combined "bundle.css"
  --build-js                        Generates a combined "bundle.js"

Sync Commands:
  --sync                            Scans physical folders and updates Carbon.package, Carbon.build, Carbon.main

Encryption:
  --enc <key>                       Encrypt build 
  Ex: --enc MyEncKey
  
Package Commands:
  --install --package --js <name>   Installs a JS package
  --install --package --css <name>  Installs a CSS package
  --remove  --package --js <name>   Removes a JS package
  --remove  --package --css <name>  Removes a CSS package

Viewer Commands:
  --show-package                    Show Carbon.package content
  --show-build                      Show Carbon.build content
  --show-main                       Show Carbon.main content
        `);
        return;
    }
    
    try {
        // --- SYNC COMMAND ---
        if (args.includes('--sync')) {
            await syncProjectFiles();
        }
        
        // --- BUNDLE COMMANDS ---
        else if (args.includes('--build-css')) {
            await assembleCarbonProject();
            const data = JSON.parse(await fs.readFile('combined.json', 'utf8'));
            const cssBundle = await getProjectBundle(data, 'css');
            await fs.writeFile('bundle.css', cssBundle, 'utf8');
            console.log('✅ Success: "bundle.css" created.');
        }
        else if (args.includes('--build-js')) {
            await assembleCarbonProject();
            const data = JSON.parse(await fs.readFile('combined.json', 'utf8'));
            const jsBundle = await getProjectBundle(data, 'js');
            await fs.writeFile('bundle.js', jsBundle, 'utf8');
            console.log('✅ Success: "bundle.js" created.');
        }
        
        // --- VIEWER COMMANDS ---
        else if (args.includes('--show-package')) {
            const content = await fs.readFile('Carbon.package', 'utf8').catch(() => "File not found.");
            console.log(`\n📄 [Carbon.package]\n${content}`);
        }
        else if (args.includes('--show-build')) {
            const content = await fs.readFile('Carbon.build', 'utf8').catch(() => "File not found.");
            console.log(`\n📄 [Carbon.build]\n${content}`);
        }
        else if (args.includes('--show-main')) {
            const content = await fs.readFile('Carbon.main', 'utf8').catch(() => "File not found.");
            console.log(`\n📄 [Carbon.main]\n${content}`);
        }
        
        // --- EXISTING LOGIC ROUTES ---
        else if (args.includes('--carbon-framework') && args.includes('--build')) {
            await buildProject();
        }
        else if (args.includes('--package')) {
            const action = args.includes('--install') ? '--install' : (args.includes('--remove') ? '--remove' : null);
            const type = args.includes('--js') ? '--js' : (args.includes('--css') ? '--css' : null);
            const pkgName = args[args.indexOf(type) + 1];
            
            if (action && type && pkgName) {
                await managePackage(action, type, pkgName);
                console.log("\n🔄 Auto-updating build...");
                await buildProject();
            } else {
                console.error("❌ Syntax Error: Must specify [--install|--remove], [--js|--css] and a package name.");
            }
        } else {
            console.error("❌ Unknown command. Run --help for available options.");
        }
        
        if (encKey) {
console.log(`\n⚙️ Finalizing build structure...`);
await organizeAndEncryptOutputs(args, encKey);
            
        }

    } catch (err) {
        console.error(`\n🔥 FATAL CRASH:`, err);
        process.exit(1);
    }
}

runCli();

