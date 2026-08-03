/**
 * Общее переключение светлой/тёмной темы для всех страниц.
 * Ключ localStorage: moi_avatar_theme
 */
(function () {
    "use strict";

    var THEME_KEY = "moi_avatar_theme";
    var root = document.documentElement;
    var themeToggle = document.getElementById("themeToggle");
    if (!themeToggle) return;

    function applyTheme(theme) {
        var next = theme === "dark" ? "dark" : "light";
        root.setAttribute("data-theme", next);
        localStorage.setItem(THEME_KEY, next);
        themeToggle.setAttribute(
            "aria-label",
            next === "dark" ? "Включить светлую тему" : "Включить тёмную тему"
        );
        themeToggle.title = next === "dark" ? "Светлая тема" : "Тёмная тема";
        document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } }));
    }

    var savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "dark" || savedTheme === "light") {
        applyTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        applyTheme("dark");
    } else {
        applyTheme("light");
    }

    themeToggle.addEventListener("click", function () {
        var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
        applyTheme(current === "dark" ? "light" : "dark");
    });
})();
