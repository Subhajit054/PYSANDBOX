let pyodide = null;
let editor = null;
let currentLanguage = 'python';

const TEMPLATES = {
  python: `# Isolated Python 3.11 WASM Runtime
import math

def calculate_primes(limit):
    print("🚀 Initializing Pyodide execution engine...")
    primes = [x for x in range(2, limit) if all(x % d != 0 for d in range(2, int(math.sqrt(x)) + 1))]
    print(f"✅ Primes up to {limit}: {primes}")

calculate_primes(25)`,

  javascript: `// Client-Side ES6 JavaScript Context
console.log("⚡ Executing JavaScript in browser runtime...");

const items = [10, 20, 30, 40];
const mapped = items.map(n => n * 2);

console.log("Original Array:", items);
console.log("Transformed Array:", mapped);`,

  html: `<!-- Live Interactive HTML/CSS Preview -->
<div style="font-family: sans-serif; text-align: center; padding: 40px; color: #10b981; background: #0f172a; border-radius: 12px;">
  <h2 style="margin-bottom: 12px;">WebAssembly Interactive Sandbox</h2>
  <p style="color: #94a3b8; font-size: 14px;">Edit HTML and click run to preview directly!</p>
  <button onclick="alert('Sandbox Interactive Event Fired!')" style="background: linear-gradient(135deg, #2563eb, #0d9488); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 12px;">
    Click Event Test
  </button>
</div>`
};

// 1. Initialize Monaco Editor
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });

require(['vs/editor/editor.main'], function () {
  editor = monaco.editor.create(document.getElementById('monaco-editor-container'), {
    value: TEMPLATES.python,
    language: 'python',
    theme: 'vs-dark',
    automaticLayout: true,
    fontSize: 13,
    fontFamily: 'JetBrains Mono',
    minimap: { enabled: false },
    padding: { top: 16, bottom: 16 },
    lineHeight: 22,
    roundedSelection: true,
    scrollBeyondLastLine: false
  });
});

// 2. Initialize Pyodide WASM with Reliable CDN Fallbacks for GitHub Pages
async function initPyodideSandbox() {
  const statusDot = document.getElementById("status-dot");
  const engineStatus = document.getElementById("engine-status");
  const runBtn = document.getElementById("run-btn");
  const runBtnText = document.getElementById("run-btn-text");

  try {
    // Explicit CDN indexURL prevents CORS/404 fetch failures on GitHub Pages
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
    });

    statusDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]";
    engineStatus.textContent = "Engine Ready";
    engineStatus.className = "text-emerald-400 font-medium";

    runBtn.disabled = false;
    runBtn.className = "btn-glow text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center space-x-2 cursor-pointer";
    runBtnText.textContent = "Run In Sandbox";

  } catch (error) {
    statusDot.className = "w-2.5 h-2.5 rounded-full bg-rose-500";
    engineStatus.textContent = "Engine Error";
    engineStatus.className = "text-rose-400 font-medium";
    
    // JS/HTML still work even if Pyodide CDN times out
    runBtn.disabled = false;
    runBtn.className = "btn-glow text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center space-x-2 cursor-pointer";
    runBtnText.textContent = "Run (JS/HTML)";
    
    console.warn("Pyodide WASM Load Error:", error);
  }
}

// 3. Handle Language Switching
function changeLanguage(lang) {
  currentLanguage = lang;
  if (!editor) return;

  const telemetryEngine = document.getElementById("telemetry-engine");

  if (lang === 'python') {
    monaco.editor.setModelLanguage(editor.getModel(), 'python');
    editor.setValue(TEMPLATES.python);
    if (telemetryEngine) telemetryEngine.textContent = "pyodide-v0.25.0";
  } else if (lang === 'javascript') {
    monaco.editor.setModelLanguage(editor.getModel(), 'javascript');
    editor.setValue(TEMPLATES.javascript);
    if (telemetryEngine) telemetryEngine.textContent = "v8-browser-engine";
  } else if (lang === 'html') {
    monaco.editor.setModelLanguage(editor.getModel(), 'html');
    editor.setValue(TEMPLATES.html);
    if (telemetryEngine) telemetryEngine.textContent = "dom-parser-preview";
  }
}

// 4. Multi-Language Execution Handler
async function executeSandboxCode() {
  if (!editor) return;

  const consoleOutput = document.getElementById("console-output");
  const executionTime = document.getElementById("execution-time");
  const code = editor.getValue();

  consoleOutput.innerHTML = "";
  const startTime = performance.now();

  if (currentLanguage === 'python') {
    if (!pyodide) {
      consoleOutput.innerHTML = `<div class="text-rose-400 font-mono text-xs">[Engine Error]: Python WASM engine is still loading or failed to connect to CDN. Try JavaScript or HTML mode.</div>`;
      return;
    }

    try {
      pyodide.setStdout({
        batched: (text) => {
          const logLine = document.createElement("div");
          logLine.className = "text-emerald-400 border-l-2 border-emerald-500/80 pl-2.5 py-0.5 opacity-0 font-mono text-xs";
          logLine.textContent = `> ${text}`;
          consoleOutput.appendChild(logLine);

          gsap.to(logLine, { opacity: 1, x: 4, duration: 0.2 });
          consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }
      });

      await pyodide.runPythonAsync(code);
      const endTime = performance.now();
      executionTime.textContent = `Latency: ${(endTime - startTime).toFixed(2)}ms`;

    } catch (err) {
      const errLine = document.createElement("div");
      errLine.className = "text-rose-400 border-l-2 border-rose-500 pl-2.5 py-1 font-mono text-xs bg-rose-950/30 rounded-r";
      errLine.textContent = `[Python Error]: ${err.message}`;
      consoleOutput.appendChild(errLine);
    }
  } 
  else if (currentLanguage === 'javascript') {
    try {
      const customConsole = {
        log: (...args) => {
          const line = document.createElement("div");
          line.className = "text-emerald-400 border-l-2 border-emerald-500 pl-2.5 py-0.5 font-mono text-xs";
          line.textContent = `> ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" ")}`;
          consoleOutput.appendChild(line);
        }
      };
      
      const runFn = new Function('console', code);
      runFn(customConsole);

      const endTime = performance.now();
      executionTime.textContent = `Latency: ${(endTime - startTime).toFixed(2)}ms`;
    } catch (err) {
      consoleOutput.innerHTML = `<div class="text-rose-400 font-mono text-xs">[JS Error]: ${err.message}</div>`;
    }
  } 
  else if (currentLanguage === 'html') {
    const iframe = document.createElement("iframe");
    iframe.className = "w-full h-full border-0 rounded-lg bg-transparent";
    iframe.srcdoc = code;
    consoleOutput.appendChild(iframe);

    const endTime = performance.now();
    executionTime.textContent = `Latency: ${(endTime - startTime).toFixed(2)}ms`;
  }
}

function resetEditorCode() {
  if (editor) {
    editor.setValue(TEMPLATES[currentLanguage]);
  }
}

initPyodideSandbox();
