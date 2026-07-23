document.addEventListener("DOMContentLoaded", () => {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.from("header", {
    y: -20,
    opacity: 0,
    duration: 0.5
  })
  .from("#editor-card", {
    y: 20,
    opacity: 0,
    duration: 0.6
  }, "-=0.2")
  .from("#console-card", {
    y: 20,
    opacity: 0,
    duration: 0.6
  }, "-=0.4");
});

function clearConsole() {
  const consoleOutput = document.getElementById("console-output");
  gsap.to(consoleOutput.children, {
    opacity: 0,
    y: -5,
    duration: 0.2,
    onComplete: () => {
      consoleOutput.innerHTML = '<div class="text-slate-600">// Output cleared.</div>';
    }
  });
}

let isDarkMode = true;

function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle("light-mode", !isDarkMode);

  if (typeof monaco !== 'undefined' && monaco.editor) {
    monaco.editor.setTheme(isDarkMode ? 'vs-dark' : 'vs');
  }

  const themeIcon = document.getElementById("theme-icon");
  if (themeIcon) {
    themeIcon.setAttribute("data-lucide", isDarkMode ? "sun" : "moon");
    lucide.createIcons();
  }
}
