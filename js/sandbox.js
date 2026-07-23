let pyodide = null;
let editor = null;

const DEFAULT_PYTHON_CODE = `# Isolated WebAssembly Python Sandbox
import sys
import math

def run_telemetry_demo():
    print("🚀 Initializing isolated Pyodide WASM heap...")
    
    # Compute primes inside WASM memory
    primes = [x for x in range(2, 30) if all(x % d != 0 for d in range(2, int(math.sqrt(x)) + 1))]
    
    print(f"✅ Prime Numbers Computed: {primes}")
    print(f"ℹ️ Engine Architecture: Python {sys.version.split()[0]} on WebAssembly")

run_telemetry_demo()`;

// Initialize Monaco Editor
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });

require(['vs/editor/editor.main'], function () {
  editor = monaco.editor.create(document.getElementById('monaco-editor-container'), {
    value: DEFAULT_PYTHON_CODE,
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

// Initialize Pyodide WASM Engine safely
async function initPyodideSandbox() {
  const statusDot = document.getElementById("status-dot");
  const engineStatus = document.getElementById("engine-status");
  const runBtn = document.getElementById("run-btn");
  const runBtnText = document.getElementById("run-btn-text");

  // Check if running on file:// protocol
  if (window.location.protocol === 'file:') {
    statusDot.className = "w-2.5 h-2.5 rounded-full bg-rose-500";
    engineStatus.textContent = "Run on Live Server";
    engineStatus.className = "text-rose-400 font-medium";
    
    const consoleOutput = document.getElementById("console-output");
    consoleOutput.innerHTML = `<div class="text-rose-400 p-2 bg-rose-950/40 border border-rose-800/80 rounded">
      [Engine Error]: Pyodide WebAssembly cannot load via file:// protocol.<br>
      Please open this project using VS Code "Live Server" extension or host on GitHub Pages.
    </div>`;
    return;
  }

  try {
    pyodide = await loadPyodide();

    statusDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]";
    engineStatus.textContent = "WASM Engine Ready";
    engineStatus.className = "text-emerald-400 font-medium";

    runBtn.disabled = false;
    runBtn.className = "btn-glow text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center space-x-2 cursor-pointer";
    runBtnText.textContent = "Run In Sandbox";

  } catch (error) {
    statusDot.className = "w-2.5 h-2.5 rounded-full bg-rose-500";
    engineStatus.textContent = "Engine Failed";
    engineStatus.className = "text-rose-400";
    console.error("Pyodide Load Error:", error);
  }
}

async function executeSandboxCode() {
  if (!pyodide || !editor) return;

  const consoleOutput = document.getElementById("console-output");
  const executionTime = document.getElementById("execution-time");
  const userCode = editor.getValue();

  consoleOutput.innerHTML = "";
  const startTime = performance.now();

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

    await pyodide.runPythonAsync(userCode);
    
    const endTime = performance.now();
    executionTime.textContent = `Latency: ${(endTime - startTime).toFixed(2)}ms`;

  } catch (err) {
    const errLine = document.createElement("div");
    errLine.className = "text-rose-400 border-l-2 border-rose-500 pl-2.5 py-1 font-mono text-xs bg-rose-950/30 rounded-r";
    errLine.textContent = `[Runtime Error]: ${err.message}`;
    consoleOutput.appendChild(errLine);
  }
}

function resetEditorCode() {
  if (editor) {
    editor.setValue(DEFAULT_PYTHON_CODE);
  }
}

initPyodideSandbox();