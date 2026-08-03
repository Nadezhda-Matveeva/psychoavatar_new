/**
 * Очистка краёв аватара avatar-excellent.webm:
 * убирает светлый ореол в тёмной теме и сохраняет исходные пропорции кадра.
 * Не меняет историю и логику оценки — только отображение видео.
 */
(function (global) {
    "use strict";

    var attached = typeof WeakSet !== "undefined" ? new WeakSet() : null;

    function ensureWrap(video) {
        if (!video || video.tagName !== "VIDEO") return null;

        var existing = video.closest(".avatar-matte");
        if (existing) {
            video.classList.add("avatar-matte__source");
            if (!existing.querySelector(".avatar-matte__canvas")) {
                var c = document.createElement("canvas");
                c.className = "avatar-matte__canvas";
                c.setAttribute("aria-hidden", "true");
                existing.appendChild(c);
            }
            return existing;
        }

        var parent = video.parentNode;
        if (!parent) return null;

        var wrap = document.createElement("div");
        wrap.className = "avatar-matte";
        wrap.setAttribute("data-avatar-matte", "");

        parent.insertBefore(wrap, video);
        wrap.appendChild(video);

        video.classList.add("avatar-matte__source");

        var canvas = document.createElement("canvas");
        canvas.className = "avatar-matte__canvas";
        canvas.setAttribute("aria-hidden", "true");
        wrap.appendChild(canvas);

        return wrap;
    }

    function isFixedSquareSlot(wrap) {
        // В чек-листе и сетке состояний слот квадратный; пропорции кадра — через contain
        return !!(wrap.closest("#avatarContainer") || wrap.closest(".state"));
    }

    function syncAspect(wrap, video) {
        if (!wrap || !video || !video.videoWidth || !video.videoHeight) return;
        if (isFixedSquareSlot(wrap)) {
            wrap.style.aspectRatio = "";
            return;
        }
        // Hero и свободные места — исходные пропорции ролика
        wrap.style.aspectRatio = video.videoWidth + " / " + video.videoHeight;
    }

    function alphaAt(data, w, h, x, y) {
        if (x < 0 || y < 0 || x >= w || y >= h) return 0;
        return data[(y * w + x) * 4 + 3];
    }

    function isBoundary(data, w, h, x, y) {
        // Пиксель на краю силуэта, если рядом есть «дыра» / край кадра
        for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                if (alphaAt(data, w, h, x + dx, y + dy) < 40) return true;
            }
        }
        return false;
    }

    function cleanImageData(imageData, w, h) {
        var d = imageData.data;
        var copy = new Uint8ClampedArray(d);
        var i, x, y, r, g, b, a, maxc, minc, sat, lum, ur, ug, ub, k, na, edge;

        for (y = 0; y < h; y++) {
            for (x = 0; x < w; x++) {
                i = (y * w + x) * 4;
                a = copy[i + 3];
                if (a === 0) continue;

                r = copy[i];
                g = copy[i + 1];
                b = copy[i + 2];
                edge = isBoundary(copy, w, h, x, y);

                maxc = r > g ? (r > b ? r : b) : (g > b ? g : b);
                minc = r < g ? (r < b ? r : b) : (g < b ? g : b);
                sat = maxc === 0 ? 0 : (maxc - minc) / maxc;
                lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

                // Восстановление цвета из premultiplied — ловим «белый» fringe
                if (a < 255 && a > 0) {
                    ur = (r * 255) / a;
                    ug = (g * 255) / a;
                    ub = (b * 255) / a;
                    if (ur >= 188 && ug >= 188 && ub >= 188) {
                        d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
                        continue;
                    }
                }

                // Светлый ореол (белый / серый)
                if (lum >= 185 && sat <= 0.24) {
                    d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
                    continue;
                }

                // На границе силуэта — агрессивнее убираем светлую кайму
                if (edge) {
                    if (lum >= 145 && sat <= 0.38) {
                        d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
                        continue;
                    }
                    if (lum >= 160) {
                        d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
                        continue;
                    }
                    if (a < 230 && lum > 120) {
                        k = Math.min(1, (lum - 120) / 80);
                        na = Math.round(a * (1 - k));
                        if (na < 70) {
                            d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
                            continue;
                        }
                        d[i + 3] = na;
                    }
                } else if (a < 252 && lum > 170 && sat < 0.28) {
                    k = Math.min(1, (lum - 170) / 70);
                    na = Math.round(a * (1 - k * 0.95));
                    if (na < 48) {
                        d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
                        continue;
                    }
                    d[i + 3] = na;
                }

                if (d[i + 3] < 60) {
                    d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
                }
            }
        }

        // Два прохода эрозии — снимают оставшийся тонкий белый контур
        erodeAlpha(d, w, h);
        erodeAlpha(d, w, h);
        hardenAlpha(d);
    }

    function erodeAlpha(d, w, h) {
        var copy = new Uint8ClampedArray(d);
        var x, y, idx, minA, dx, dy, nx, ny, nidx;

        for (y = 0; y < h; y++) {
            for (x = 0; x < w; x++) {
                idx = (y * w + x) * 4;
                if (copy[idx + 3] === 0) continue;

                minA = copy[idx + 3];
                for (dy = -1; dy <= 1; dy++) {
                    for (dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        nx = x + dx;
                        ny = y + dy;
                        if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
                            minA = 0;
                            break;
                        }
                        nidx = (ny * w + nx) * 4 + 3;
                        if (copy[nidx] < minA) minA = copy[nidx];
                    }
                    if (minA === 0) break;
                }

                if (minA < 50) {
                    d[idx] = d[idx + 1] = d[idx + 2] = d[idx + 3] = 0;
                } else if (minA < d[idx + 3]) {
                    d[idx + 3] = minA;
                }
            }
        }
    }

    function hardenAlpha(d) {
        var idx, a;
        for (idx = 3; idx < d.length; idx += 4) {
            a = d[idx];
            if (a === 0) continue;
            if (a < 110) {
                d[idx - 3] = d[idx - 2] = d[idx - 1] = d[idx] = 0;
            } else {
                d[idx] = 255;
            }
        }
    }

    function drawContained(ctx, video, tw, th) {
        var vw = video.videoWidth;
        var vh = video.videoHeight;
        if (!vw || !vh) return;

        ctx.clearRect(0, 0, tw, th);

        // Как object-fit: contain — без искажения пропорций
        var scale = Math.min(tw / vw, th / vh);
        var dw = Math.max(1, Math.round(vw * scale));
        var dh = Math.max(1, Math.round(vh * scale));
        var ox = Math.round((tw - dw) / 2);
        var oy = Math.round((th - dh) / 2);
        ctx.drawImage(video, ox, oy, dw, dh);
    }

    function attach(video) {
        if (!video || video.tagName !== "VIDEO") return null;

        var wrap = ensureWrap(video);
        if (!wrap) return null;

        if (attached && attached.has(video) && wrap._avatarMatteStop) {
            syncAspect(wrap, video);
            return wrap;
        }

        if (typeof wrap._avatarMatteStop === "function") {
            wrap._avatarMatteStop();
        }

        var canvas = wrap.querySelector(".avatar-matte__canvas");
        if (!canvas) return wrap;

        var ctx = canvas.getContext("2d", { willReadFrequently: true });
        var rafId = 0;
        var alive = true;

        function paint() {
            if (!alive || !document.contains(video)) {
                stop();
                return;
            }

            syncAspect(wrap, video);

            var cssW = wrap.clientWidth;
            var cssH = wrap.clientHeight;

            // Пока обёртка ещё без высоты — берём ширину и считаем по кадру
            if ((!cssH || cssH < 2) && video.videoWidth && video.videoHeight && cssW) {
                cssH = cssW * (video.videoHeight / video.videoWidth);
            }

            if (!cssW) {
                cssW = video.clientWidth || video.width || 120;
            }
            if (!cssH) {
                cssH = video.clientHeight || video.height || cssW;
            }

            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            var tw = Math.max(1, Math.round(cssW * dpr));
            var th = Math.max(1, Math.round(cssH * dpr));

            if (canvas.width !== tw || canvas.height !== th) {
                canvas.width = tw;
                canvas.height = th;
            }

            if (video.readyState >= 2 && video.videoWidth) {
                drawContained(ctx, video, tw, th);
                try {
                    var frame = ctx.getImageData(0, 0, tw, th);
                    cleanImageData(frame, tw, th);
                    ctx.putImageData(frame, 0, 0);
                } catch (_) {
                    /* ignore */
                }
            }

            rafId = requestAnimationFrame(paint);
        }

        function stop() {
            alive = false;
            if (rafId) cancelAnimationFrame(rafId);
            rafId = 0;
            if (attached) attached.delete(video);
            if (wrap._avatarMatteStop === stop) {
                wrap._avatarMatteStop = null;
            }
        }

        function onMeta() {
            syncAspect(wrap, video);
        }

        video.addEventListener("loadedmetadata", onMeta);
        video.addEventListener("emptied", stop, { once: true });
        if (video.videoWidth) syncAspect(wrap, video);

        if (attached) attached.add(video);
        wrap._avatarMatteStop = stop;
        rafId = requestAnimationFrame(paint);

        return wrap;
    }

    function enhanceAll(root) {
        var scope = root || document;
        var nodes = scope.querySelectorAll(
            'video[src*="avatar-excellent"], video[data-avatar-video]'
        );
        for (var i = 0; i < nodes.length; i++) {
            attach(nodes[i]);
        }
    }

    function wrapOrGet(video) {
        return attach(video);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            enhanceAll(document);
        });
    } else {
        enhanceAll(document);
    }

    global.AvatarMatte = {
        attach: attach,
        enhanceAll: enhanceAll,
        wrap: wrapOrGet
    };
})(window);
