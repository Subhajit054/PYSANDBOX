let pyodide = null;
let editor = null;
let currentLanguage = 'python';

// Judge0 Language IDs
const JUDGE0_LANG_IDS = {
  c: 50,      // C (GCC 9.2.0)
  cpp: 54,    // C++ (GCC 9.2.0)
  java: 62,   // Java (OpenJDK 13.0.1)
  rust: 73,   // Rust (1.40.0)
  go: 60      // Go (1.13.5)
};

const TEMPLATES = {
  python: `# Python 3.11 (Pyodide WASM)\nimport math\n\ndef demo():\n    print("Hello from Python WASM!")\n    print("Square root of 16:", math.sqrt(16))\n\ndemo()`,
  
  javascript: `// JavaScript (Browser Runtime)\nconsole.log("Hello from JavaScript!");\n\nconst nums = [1, 2, 3, 4];\nconsole.log("Doubled:", nums.map(n => n * 2));`,
  
  html: `<!-- Live HTML Preview -->\n<div style="font-family: sans-serif; text-align: center; padding: 30px; color: #10b981; background: #0f172a; border-radius: 10px;">\n  <h2>Live HTML Output</h2>\n  <button onclick="alert('Working!')" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Test Click</button>\n</div>`,
  
  c: `// C Language\n#include <stdio.h>\n\nint main() {\n    printf("Hello from C Sandbox!\\n");\n    return 0;\n}`,
  
  cpp: `// C++ Language\n#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++ Sandbox!" << std::endl;\n    return 0;\n}`,
  
  java: `// Java Language\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java Sandbox!");\n    }\n}`,
  
  rust: `// Rust Language\nfn main() {\n    println!("Hello from Rust Sandbox!");\n}`,
  
  go: `// Go Language\npackage main\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Go Sandbox!")\n}`
};

// Initialize Monaco Editor
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

// Initialize Pyodide WASM Engine
async function initPyodideSandbox() {
  const statusDot = document.getElementById("status-dot");
  const engineStatus = document.getElementById("engine-status");
  const runBtn = document.getElementById("run-btn");
  const runBtnText = document.getElementById("run-btn-text");

  try {
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
    statusDot.className = "w-2.5 h-2.5 rounded-full bg-amber-500";
    engineStatus.textContent = "API Mode Active";
    engineStatus.className = "text-amber-400 font-medium";
    
    runBtn.disabled = false;
    runBtn.className = "btn-glow text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center space-x-2 cursor-pointer";
    runBtnText.textContent = "Run Code";
  }
}

// Handle Language Switching
function changeLanguage(lang) {
  currentLanguage = lang;
  if (!editor) return;

  const telemetryEngine = document.getElementById("telemetry-engine");

  const monacoLanguageMap = {
    python: 'python',
    javascript: 'javascript',
    html: 'html',
    c: 'c',
    cpp: 'cpp',
    java: 'java',
    rust: 'rust',
    go: 'go'
  };

  monaco.editor.setModelLanguage(editor.getModel(), monacoLanguageMap[lang] || 'plaintext');

  if (TEMPLATES[lang]) {
    editor.setValue(TEMPLATES[lang]);
  }

  if (telemetryEngine) {
    if (['python', 'javascript', 'html'].includes(lang)) {
      telemetryEngine.textContent = "browser-wasm/dom";
    } else {
      telemetryEngine.textContent = "judge0-cloud-api";
    }
  }
}

// Execute Code
async function executeSandboxCode() {
  if (!editor) return;

  const consoleOutput = document.getElementById("console-output");
  const executionTime = document.getElementById("execution-time");
  const code = editor.getValue();

  consoleOutput.innerHTML = "";
  const startTime = performance.now();

  if (currentLanguage === 'python') {
    if (!pyodide) {
      appendLog("[Error]: Pyodide WASM engine is not ready.", "text-rose-400");
      return;
    }
    try {
      pyodide.setStdout({
        batched: (text) => appendLog(text, "text-emerald-400")
      });
      await pyodide.runPythonAsync(code);
      executionTime.textContent = `Latency: ${(performance.now() - startTime).toFixed(2)}ms`;
    } catch (err) {
      appendLog(`[Python Error]: ${err.message}`, "text-rose-400");
    }
  } 
  else if (currentLanguage === 'javascript') {
    try {
      const customConsole = {
        log: (...args) => appendLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" "), "text-emerald-400")
      };
      const runFn = new Function('console', code);
      runFn(customConsole);
      executionTime.textContent = `Latency: ${(performance.now() - startTime).toFixed(2)}ms`;
    } catch (err) {
      appendLog(`[JS Error]: ${err.message}`, "text-rose-400");
    }
  } 
  else if (currentLanguage === 'html') {
    const iframe = document.createElement("iframe");
    iframe.className = "w-full h-full border-0 rounded-lg bg-white";
    iframe.srcdoc = code;
    consoleOutput.appendChild(iframe);
    executionTime.textContent = `Latency: ${(performance.now() - startTime).toFixed(2)}ms`;
  } 
  else {
    appendLog(`[Cloud Compiler]: Executing ${currentLanguage.toUpperCase()} code...`, "text-amber-400");
    
    try {
      const res = await fetch("https://ce.judge0.com/submissions?wait=true", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          language_id: JUDGE0_LANG_IDS[currentLanguage],
          source_code: code
        })
      });

      const data = await res.json();
      consoleOutput.innerHTML = "";

      if (data.stdout) appendLog(data.stdout, "text-emerald-400");
      if (data.stderr) appendLog(data.stderr, "text-rose-400");
      if (data.compile_output) appendLog(data.compile_output, "text-rose-400");

      executionTime.textContent = `Latency: ${(performance.now() - startTime).toFixed(2)}ms`;

    } catch (err) {
      appendLog(`[API Error]: Cloud execution failed. ${err.message}`, "text-rose-400");
    }
  }
}

function appendLog(text, colorClass) {
  const consoleOutput = document.getElementById("console-output");
  const logLine = document.createElement("div");
  logLine.className = `${colorClass} border-l-2 border-slate-700 pl-2.5 py-0.5 font-mono text-xs whitespace-pre-wrap`;
  logLine.textContent = text;
  consoleOutput.appendChild(logLine);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function resetEditorCode() {
  if (editor) {
    editor.setValue(TEMPLATES[currentLanguage] || '');
  }
}

initPyodideSandbox();
