# ⚡ PySandbox.WASM

> A high-performance, multi-language code execution sandbox and telemetry lab powered by WebAssembly (Pyodide), Monaco Editor, and Cloud Compiler APIs.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)
![WebAssembly](https://img.shields.io/badge/WebAssembly-WASM-654FF0?logo=webassembly)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css)
![GSAP](https://img.shields.io/badge/GSAP-Animations-88CE02?logo=greensock)

---

## 🌟 Overview

**PySandbox.WASM** is a browser-native development environment and execution lab designed to run code safely inside isolated client memory boundaries. By leveraging **Pyodide (WebAssembly)**, scripts in Python execute directly within the browser heap without relying on remote backend servers. 

The application also features live client-side execution for **JavaScript** and **HTML5/CSS**, alongside hybrid integration with cloud compiler APIs to execute compiled system languages such as **C, C++, Java, Rust, and Go**.

---

## ✨ Key Features

* 🚀 **Client-Side WASM Execution:** Executes Python 3.11 scripts instantly using Pyodide WebAssembly with zero cold-start latency.
* 💻 **Monaco Editor Integration:** Embedded VS Code editing experience with full syntax highlighting, automatic line numbers, and intelligent auto-indentation.
* 🌐 **Multi-Language Support:**
  * **Client-Side:** Python (Pyodide WASM), JavaScript (ES6 Engine), HTML5 / CSS (Live DOM Frame).
  * **Cloud-Compiled:** C, C++, Java (OpenJDK), Rust, Go.
* 📊 **Real-Time Output & Telemetry:** Monitors execution latency in milliseconds and streams `stdout`/`stderr` line-by-line using GSAP animations.
* 🌗 **Dynamic Theme Engine:** Instant toggling between dark (`vs-dark`) and light (`vs`) glassmorphic UI modes.
* 🛡️ **Memory Isolation Boundary:** Ensures browser stability by running client-side scripts in isolated execution scopes.

---

## 🏗️ System Architecture

```text
               ┌──────────────────────────────────────────────┐
               │         Client Interface (Monaco / Tailwind) │
               └──────────────────────┬───────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
              ▼                                               ▼
  [ Client-Side WASM / JS Engine ]                 [ Cloud Compiler API ]
  • Pyodide WASM (Python 3.11)                     • C / C++ (GCC)
  • Browser JS Context                             • Java (OpenJDK)
  • Isolated iFrame (HTML5)                        • Rust / Go
