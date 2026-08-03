/**
 * Фоновая музыка на всех страницах.
 * - loop: трек зациклен
 * - позиция сохраняется в sessionStorage, чтобы при переходе
 *   между страницами воспроизведение продолжалось, а не начиналось сначала
 * Ключи:
 *   localStorage  moi_avatar_music_muted  ("1" = выключена)
 *   sessionStorage moi_avatar_music_time  (секунды)
 */
(function () {
    "use strict";

    var MUTE_KEY = "moi_avatar_music_muted";
    var TIME_KEY = "moi_avatar_music_time";
    var audio = document.getElementById("bgMusic");
    var btn = document.getElementById("musicToggle");
    if (!audio || !btn) return;

    audio.loop = true;
    audio.volume = 0.35;

    var unlocked = false;
    var timeRestored = false;

    function isMuted() {
        return localStorage.getItem(MUTE_KEY) === "1";
    }

    function setMuted(muted) {
        localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
        btn.classList.toggle("is-muted", muted);
        btn.setAttribute("aria-label", muted ? "Включить музыку" : "Выключить музыку");
        btn.title = muted ? "Включить музыку" : "Выключить музыку";
        btn.setAttribute("aria-pressed", muted ? "true" : "false");
    }

    function saveTime() {
        try {
            if (!isNaN(audio.currentTime)) {
                sessionStorage.setItem(TIME_KEY, String(audio.currentTime));
            }
        } catch (_) { /* ignore */ }
    }

    function restoreTime() {
        if (timeRestored) return;
        var raw = sessionStorage.getItem(TIME_KEY);
        var saved = raw ? parseFloat(raw) : 0;
        if (isNaN(saved) || saved <= 0) {
            timeRestored = true;
            return;
        }
        try {
            // Не выходим за длительность трека (если она уже известна)
            if (audio.duration && isFinite(audio.duration) && saved >= audio.duration) {
                saved = saved % audio.duration;
            }
            audio.currentTime = saved;
            timeRestored = true;
        } catch (_) {
            // currentTime ещё нельзя выставить — повторим на loadedmetadata
        }
    }

    function tryPlay() {
        if (isMuted()) {
            audio.pause();
            return;
        }
        restoreTime();
        var playPromise = audio.play();
        if (playPromise && typeof playPromise.then === "function") {
            playPromise.then(function () {
                unlocked = true;
            }).catch(function () {
                // Автовоспроизведение заблокировано браузером — ждём жест пользователя
            });
        }
    }

    function unlockAndPlay() {
        if (isMuted()) return;
        tryPlay();
    }

    // Восстанавливаем позицию, как только метаданные готовы
    audio.addEventListener("loadedmetadata", restoreTime);
    if (audio.readyState >= 1) {
        restoreTime();
    }

    // Периодически и при уходе со страницы сохраняем позицию
    setInterval(function () {
        if (!audio.paused) saveTime();
    }, 500);

    window.addEventListener("pagehide", saveTime);
    window.addEventListener("beforeunload", saveTime);
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") saveTime();
    });

    // Состояние кнопки при загрузке
    setMuted(isMuted());

    if (!isMuted()) {
        tryPlay();
        ["pointerdown", "keydown", "touchstart"].forEach(function (evt) {
            document.addEventListener(evt, unlockAndPlay, { once: true, passive: true });
        });
    }

    btn.addEventListener("click", function () {
        var nextMuted = !isMuted();
        setMuted(nextMuted);
        if (nextMuted) {
            saveTime();
            audio.pause();
        } else {
            tryPlay();
        }
    });
})();
