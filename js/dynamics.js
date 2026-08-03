(function () {
    "use strict";

    // ============================================================
    // Параметры и сферы (согласованы с check.js)
    // ============================================================

    const PARAMS = [
        { id: "sleep_duration", sphere: "sleep", shortName: "Длительность сна" },
        { id: "sleep_quality", sphere: "sleep", shortName: "Качество сна" },
        { id: "sleep_time", sphere: "sleep", shortName: "Время засыпания" },
        { id: "water", sphere: "nutrition", shortName: "Вода" },
        { id: "nutrition_regularity", sphere: "nutrition", shortName: "Регулярность питания" },
        { id: "nutrition_quality", sphere: "nutrition", shortName: "Качество питания" },
        { id: "activity", sphere: "body", shortName: "Уровень активности" },
        { id: "body_feeling", sphere: "body", shortName: "Ощущение тела" },
        { id: "stress", sphere: "stress", shortName: "Уровень стресса" },
        { id: "emotion", sphere: "stress", shortName: "Ведущая эмоция дня" },
        { id: "disrupting_event", sphere: "stress", shortName: "Событие, выбившее из колеи" },
        { id: "time_for_self", sphere: "recovery", shortName: "Время для себя" },
        { id: "recovery_form", sphere: "recovery", shortName: "Форма восстановления" },
        { id: "live_communication", sphere: "support", shortName: "Живое общение" },
        { id: "support_feeling", sphere: "support", shortName: "Чувство поддержки" }
    ];

    const SPHERES = [
        { id: "sleep", name: "Сон" },
        { id: "nutrition", name: "Питание" },
        { id: "body", name: "Тело" },
        { id: "stress", name: "Стресс" },
        { id: "recovery", name: "Восстановление" },
        { id: "support", name: "Поддержка" }
    ];

    const WEEKDAYS_NOM = ["воскресеньям", "понедельникам", "вторникам", "средам", "четвергам", "пятницам", "субботам"];

    const WINDOW_SIZE = 30;

    // ============================================================
    // История (тот же ключ localStorage, что и в чек-листе)
    // ============================================================

    function loadHistory() {
        try {
            const raw = localStorage.getItem("moi_avatar_history");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (_) { /* ignore */ }
        return [];
    }

    function sortAsc(history) {
        return history.slice().sort(function (a, b) {
            return String(a.date).localeCompare(String(b.date));
        });
    }

    function getLastN(history, n) {
        return sortAsc(history).slice(-n);
    }

    function getCssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    function formatDateLabel(iso) {
        const parts = String(iso).split("-");
        if (parts.length < 3) return iso;
        return parts[2] + "." + parts[1];
    }

    function clamp(n, min, max) {
        return Math.max(min, Math.min(max, n));
    }

    // ============================================================
    // Расчёты
    // ============================================================

    function getMaxPossible(answers) {
        if (!answers) return 80;
        let max = 0;
        for (let i = 0; i < PARAMS.length; i++) {
            const val = answers[PARAMS[i].id];
            if (val === null || val === undefined || val === "na") continue;
            max += 4;
        }
        return max || 1;
    }

    function getScaledScore(entry) {
        if (!entry) return 0;
        if (entry.answers) {
            const max = getMaxPossible(entry.answers);
            return (entry.score / max) * 80;
        }
        // Старые записи без answers: score уже близок к шкале файла
        return Number(entry.score) || 0;
    }

    function getLevelKind(scaled) {
        if (scaled >= 70) return "excellent";
        if (scaled >= 55) return "good";
        if (scaled >= 40) return "medium";
        return "critical";
    }

    function avg(nums) {
        if (!nums.length) return 0;
        return nums.reduce(function (a, b) { return a + b; }, 0) / nums.length;
    }

    function detectTrend(scores) {
        if (scores.length < 2) {
            return { label: "стабильный", kind: "stable" };
        }
        let ups = 0;
        let downs = 0;
        for (let i = 1; i < scores.length; i++) {
            if (scores[i] > scores[i - 1]) ups++;
            else if (scores[i] < scores[i - 1]) downs++;
        }
        if (ups > 0 && downs > 0) return { label: "вариабельный", kind: "variable" };
        if (ups > 0 && downs === 0) return { label: "растёт", kind: "up" };
        if (downs > 0 && ups === 0) return { label: "снижается", kind: "down" };
        return { label: "стабильный", kind: "stable" };
    }

    function computeSphereAverages(history) {
        const sums = {};
        const counts = {};
        SPHERES.forEach(function (s) {
            sums[s.id] = 0;
            counts[s.id] = 0;
        });

        history.forEach(function (entry) {
            if (!entry.answers) return;
            PARAMS.forEach(function (p) {
                const val = entry.answers[p.id];
                if (typeof val !== "number") return;
                sums[p.sphere] += val;
                counts[p.sphere] += 1;
            });
        });

        return SPHERES.map(function (s) {
            const mean = counts[s.id] ? sums[s.id] / counts[s.id] : 0;
            return {
                id: s.id,
                name: s.name,
                average: mean,
                percent: (mean / 4) * 100,
                samples: counts[s.id]
            };
        });
    }

    function computeWeakFlags(windowEntries) {
        let daysWithWeak = 0;
        let mediumDays = 0;
        let criticalDays = 0;
        const weakBySphere = {};
        SPHERES.forEach(function (s) { weakBySphere[s.id] = 0; });

        windowEntries.forEach(function (entry) {
            const scaled = getScaledScore(entry);
            const kind = getLevelKind(scaled);
            if (kind === "medium") mediumDays++;
            if (kind === "critical") criticalDays++;

            let dayWeak = false;
            if (entry.answers) {
                PARAMS.forEach(function (p) {
                    const val = entry.answers[p.id];
                    if (typeof val === "number" && val <= 2) {
                        dayWeak = true;
                        weakBySphere[p.sphere] += 1;
                    }
                });
            } else if (kind === "medium" || kind === "critical") {
                dayWeak = true;
            }
            if (dayWeak) daysWithWeak++;
        });

        const sphereWeak = SPHERES.map(function (s) {
            return { id: s.id, name: s.name, count: weakBySphere[s.id] };
        }).sort(function (a, b) { return b.count - a.count; });

        return {
            total: windowEntries.length,
            daysWithWeak: daysWithWeak,
            mediumDays: mediumDays,
            criticalDays: criticalDays,
            sphereWeak: sphereWeak
        };
    }

    function computeParamAverages(windowEntries) {
        const sums = {};
        const counts = {};
        PARAMS.forEach(function (p) {
            sums[p.id] = 0;
            counts[p.id] = 0;
        });

        windowEntries.forEach(function (entry) {
            if (!entry.answers) return;
            PARAMS.forEach(function (p) {
                const val = entry.answers[p.id];
                if (typeof val !== "number") return;
                sums[p.id] += val;
                counts[p.id] += 1;
            });
        });

        return PARAMS.map(function (p) {
            const mean = counts[p.id] ? sums[p.id] / counts[p.id] : null;
            return {
                id: p.id,
                shortName: p.shortName,
                sphere: p.sphere,
                average: mean,
                samples: counts[p.id]
            };
        }).filter(function (p) {
            return p.average !== null && p.average <= 2;
        }).sort(function (a, b) {
            return a.average - b.average;
        });
    }

    function buildInsights(allHistory, windowEntries, sphereAvgs, flags) {
        const insights = [];
        if (!windowEntries.length) return insights;

        const scores = windowEntries.map(getScaledScore);
        const trend = detectTrend(scores);

        // 1. Самая уязвимая сфера
        const withData = sphereAvgs.filter(function (s) { return s.samples > 0; });
        if (withData.length) {
            const weakest = withData.slice().sort(function (a, b) {
                return a.average - b.average;
            })[0];

            let detail = "";
            if (weakest.id === "sleep") {
                let lowSleep = 0;
                let sleepDays = 0;
                windowEntries.forEach(function (e) {
                    if (!e.answers || typeof e.answers.sleep_duration !== "number") return;
                    sleepDays++;
                    if (e.answers.sleep_duration <= 2) lowSleep++;
                });
                if (sleepDays > 0) {
                    const pct = Math.round((lowSleep / sleepDays) * 100);
                    detail = " В " + pct + "% дней вы спали меньше 7 часов.";
                }
            } else {
                const weakRow = flags.sphereWeak.find(function (s) { return s.id === weakest.id; });
                if (weakRow && flags.sphereWeak[0] && flags.sphereWeak[0].id === weakest.id && weakRow.count > 0) {
                    detail = " Именно здесь чаще всего встречаются оценки 1–2.";
                }
            }

            insights.push({
                soft: false,
                text: "В этом периоде ваша самая уязвимая сфера — " + weakest.name +
                    " (средняя оценка " + weakest.average.toFixed(1) + " из 4)." + detail
            });
        }

        // 2. Лучшие дни недели
        const byWeekday = [0, 0, 0, 0, 0, 0, 0];
        const byWeekdayCount = [0, 0, 0, 0, 0, 0, 0];
        windowEntries.forEach(function (e) {
            const d = new Date(e.date + "T12:00:00");
            if (isNaN(d.getTime())) return;
            const wd = d.getDay();
            byWeekday[wd] += getScaledScore(e);
            byWeekdayCount[wd] += 1;
        });

        let bestWd = -1;
        let bestAvg = -1;
        let secondWd = -1;
        let secondAvg = -1;
        for (let i = 0; i < 7; i++) {
            if (byWeekdayCount[i] < 2) continue;
            const a = byWeekday[i] / byWeekdayCount[i];
            if (a > bestAvg) {
                secondWd = bestWd;
                secondAvg = bestAvg;
                bestWd = i;
                bestAvg = a;
            } else if (a > secondAvg) {
                secondWd = i;
                secondAvg = a;
            }
        }

        if (bestWd >= 0) {
            let text = "Ваше состояние выше по " + WEEKDAYS_NOM[bestWd];
            if (secondWd >= 0 && Math.abs(bestAvg - secondAvg) < 4) {
                text += " и " + WEEKDAYS_NOM[secondWd];
            }
            text += " — возможно, в эти дни проще сохранить режим.";
            insights.push({ soft: true, text: text });
        }

        // 3. Тренд
        if (scores.length >= 3) {
            if (trend.kind === "up") {
                insights.push({
                    soft: true,
                    text: "За последние оценки состояние улучшается. Продолжайте замечать, что именно помогает восстановиться."
                });
            } else if (trend.kind === "down") {
                insights.push({
                    soft: false,
                    text: "За последние оценки состояние снижается. Имеет смысл мягко усилить сон, паузы и поддержку."
                });
            } else if (trend.kind === "variable") {
                insights.push({
                    soft: true,
                    text: "Состояние колеблется от дня к дню. Это нормально — полезно отмечать, после чего вам становится легче."
                });
            } else {
                insights.push({
                    soft: true,
                    text: "Состояние в целом стабильно. Регулярные небольшие ритуалы заботы помогут удерживать этот уровень."
                });
            }
        }

        // 4. Красные флаги / слабые дни
        if (flags.total >= 3) {
            const weakPct = Math.round((flags.daysWithWeak / flags.total) * 100);
            const hardDays = flags.mediumDays + flags.criticalDays;
            const hardPct = Math.round((hardDays / flags.total) * 100);
            if (weakPct >= 40 || hardPct >= 30) {
                insights.push({
                    soft: false,
                    text: "В " + weakPct + "% дней периода встречались оценки 1–2, а в " +
                        hardPct + "% дней итог был средним или критическим. Это сигнал присмотреться к режиму."
                });
            } else if (weakPct <= 20 && hardPct <= 15) {
                insights.push({
                    soft: true,
                    text: "Слабых дней немного: оценки 1–2 были лишь в " + weakPct +
                        "% записей. Вы держите хороший базовый фон."
                });
            }
        }

        // 5. Сильная сфера
        if (withData.length >= 2) {
            const strongest = withData.slice().sort(function (a, b) {
                return b.average - a.average;
            })[0];
            if (strongest.average >= 3) {
                insights.push({
                    soft: true,
                    text: "Ваша опора — сфера «" + strongest.name + "» (в среднем " +
                        strongest.average.toFixed(1) + " из 4). Можно опираться на неё в более тяжёлые дни."
                });
            }
        }

        return insights.slice(0, 5);
    }

    // ============================================================
    // Рисование графиков (canvas)
    // ============================================================

    function fitCanvas(canvas, cssWidth, cssHeight) {
        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = cssWidth + "px";
        canvas.style.height = cssHeight + "px";
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return ctx;
    }

    function drawTrendChart(canvas, entries) {
        const parent = canvas.parentElement;
        const cssWidth = Math.max(280, parent ? parent.clientWidth - 16 : 680);
        const cssHeight = cssWidth < 480 ? 220 : 260;
        const ctx = fitCanvas(canvas, cssWidth, cssHeight);

        const pad = { top: 18, right: 16, bottom: 36, left: 36 };
        const w = cssWidth - pad.left - pad.right;
        const h = cssHeight - pad.top - pad.bottom;

        ctx.clearRect(0, 0, cssWidth, cssHeight);

        const scores = entries.map(getScaledScore);
        const maxY = 80;
        const minY = 0;

        // Сетка
        const grid = getCssVar("--bar-track") || "#d5e0da";
        const muted = getCssVar("--text-soft") || "#95a39b";
        const line = getCssVar("--accent-deep") || "#8fa89c";
        const fill = getCssVar("--surface-sage") || "#dfeae4";
        const peach = getCssVar("--peach-deep") || "#e9a28c";

        ctx.strokeStyle = grid;
        ctx.lineWidth = 1;
        ctx.font = "11px Montserrat, sans-serif";
        ctx.fillStyle = muted;

        [0, 40, 55, 70, 80].forEach(function (mark) {
            const y = pad.top + h - ((mark - minY) / (maxY - minY)) * h;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + w, y);
            ctx.stroke();
            ctx.fillText(String(mark), 6, y + 4);
        });

        if (scores.length === 0) {
            ctx.fillStyle = muted;
            ctx.font = "14px Source Sans 3, sans-serif";
            ctx.fillText("Недостаточно данных", pad.left + 12, pad.top + h / 2);
            return;
        }

        function xAt(i) {
            if (scores.length === 1) return pad.left + w / 2;
            return pad.left + (i / (scores.length - 1)) * w;
        }

        function yAt(v) {
            return pad.top + h - ((clamp(v, minY, maxY) - minY) / (maxY - minY)) * h;
        }

        // Заливка
        ctx.beginPath();
        ctx.moveTo(xAt(0), pad.top + h);
        scores.forEach(function (s, i) {
            ctx.lineTo(xAt(i), yAt(s));
        });
        ctx.lineTo(xAt(scores.length - 1), pad.top + h);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.globalAlpha = 0.65;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Линия
        ctx.beginPath();
        scores.forEach(function (s, i) {
            const x = xAt(i);
            const y = yAt(s);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = line;
        ctx.lineWidth = 2.4;
        ctx.lineJoin = "round";
        ctx.stroke();

        // Точки
        scores.forEach(function (s, i) {
            const x = xAt(i);
            const y = yAt(s);
            const kind = getLevelKind(s);
            ctx.beginPath();
            ctx.arc(x, y, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = (kind === "critical" || kind === "medium") ? peach : line;
            ctx.fill();
        });

        // Подписи дат (редко)
        ctx.fillStyle = muted;
        ctx.font = "10px Montserrat, sans-serif";
        const step = scores.length > 16 ? Math.ceil(scores.length / 8) : Math.max(1, Math.ceil(scores.length / 10));
        entries.forEach(function (e, i) {
            if (i % step !== 0 && i !== entries.length - 1) return;
            const label = formatDateLabel(e.date);
            const x = xAt(i);
            ctx.fillText(label, x - 12, cssHeight - 12);
        });
    }

    function drawRadarChart(canvas, sphereAvgs) {
        const size = 300;
        const ctx = fitCanvas(canvas, size, size);
        const cx = size / 2;
        const cy = size / 2 + 4;
        const radius = 105;

        ctx.clearRect(0, 0, size, size);

        const grid = getCssVar("--bar-track") || "#d5e0da";
        const line = getCssVar("--accent-deep") || "#8fa89c";
        const fill = getCssVar("--accent") || "#bccdc5";
        const text = getCssVar("--text-muted") || "#6e7c74";
        const peach = getCssVar("--peach-deep") || "#e9a28c";

        const n = SPHERES.length;
        const angleStep = (Math.PI * 2) / n;
        const start = -Math.PI / 2;

        function point(i, ratio) {
            const a = start + i * angleStep;
            return {
                x: cx + Math.cos(a) * radius * ratio,
                y: cy + Math.sin(a) * radius * ratio
            };
        }

        // Кольца
        [0.25, 0.5, 0.75, 1].forEach(function (r) {
            ctx.beginPath();
            for (let i = 0; i < n; i++) {
                const p = point(i, r);
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.closePath();
            ctx.strokeStyle = grid;
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // Оси
        for (let i = 0; i < n; i++) {
            const p = point(i, 1);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = grid;
            ctx.stroke();
        }

        // Данные
        const ratios = sphereAvgs.map(function (s) {
            return s.samples ? clamp(s.average / 4, 0, 1) : 0;
        });

        ctx.beginPath();
        ratios.forEach(function (r, i) {
            const p = point(i, r);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.globalAlpha = 0.45;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = line;
        ctx.lineWidth = 2;
        ctx.stroke();

        ratios.forEach(function (r, i) {
            const p = point(i, r);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = r < 0.55 ? peach : line;
            ctx.fill();
        });

        // Подписи
        ctx.fillStyle = text;
        ctx.font = "600 11px Montserrat, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        SPHERES.forEach(function (s, i) {
            const p = point(i, 1.22);
            ctx.fillText(s.name, p.x, p.y);
        });
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
    }

    // ============================================================
    // Рендер UI
    // ============================================================

    function renderTrendStats(entries) {
        const box = document.getElementById("trendStats");
        if (!box) return;
        const scores = entries.map(getScaledScore);
        const trend = detectTrend(scores);
        const average = avg(scores);
        const min = scores.length ? Math.min.apply(null, scores) : 0;
        const max = scores.length ? Math.max.apply(null, scores) : 0;

        let trendClass = "";
        if (trend.kind === "up") trendClass = "is-up";
        else if (trend.kind === "down") trendClass = "is-down";
        else if (trend.kind === "variable") trendClass = "is-warn";

        box.innerHTML =
            '<div class="stat-chip"><div class="stat-chip__label">Среднее</div><div class="stat-chip__value">' +
            average.toFixed(1) +
            '</div></div>' +
            '<div class="stat-chip"><div class="stat-chip__label">Минимум</div><div class="stat-chip__value">' +
            min.toFixed(0) +
            '</div></div>' +
            '<div class="stat-chip"><div class="stat-chip__label">Максимум</div><div class="stat-chip__value">' +
            max.toFixed(0) +
            '</div></div>' +
            '<div class="stat-chip"><div class="stat-chip__label">Тренд</div><div class="stat-chip__value ' +
            trendClass + '">' + trend.label + "</div></div>";
    }

    function renderSphereLegend(sphereAvgs) {
        const list = document.getElementById("sphereLegend");
        if (!list) return;
        const sorted = sphereAvgs.slice().sort(function (a, b) { return a.average - b.average; });
        const weakestId = sorted[0] && sorted[0].samples ? sorted[0].id : null;

        list.innerHTML = sphereAvgs.map(function (s) {
            const weak = s.id === weakestId && s.samples > 0;
            const val = s.samples
                ? s.average.toFixed(1) + " / 4"
                : "нет данных";
            return (
                "<li>" +
                '<span class="sphere-legend__name">' +
                '<span class="sphere-legend__dot' + (weak ? " is-weak" : "") + '"></span>' +
                s.name +
                "</span>" +
                '<span class="sphere-legend__value">' + val + "</span>" +
                "</li>"
            );
        }).join("");
    }

    function renderFlags(flags) {
        const meta = document.getElementById("flagsMeta");
        const stats = document.getElementById("flagStats");
        const breakdown = document.getElementById("flagBreakdown");
        if (!stats || !breakdown) return;

        if (meta) {
            meta.textContent = "За " + flags.total + " последн" +
                (flags.total === 1 ? "юю оценку" : flags.total < 5 ? "ие оценки" : "их оценок");
        }

        stats.innerHTML =
            '<div class="flag-card flag-card--alert">' +
            '<div class="flag-card__value">' + flags.daysWithWeak + "</div>" +
            '<div class="flag-card__label">дней с оценками 1–2</div>' +
            "</div>" +
            '<div class="flag-card">' +
            '<div class="flag-card__value">' + flags.criticalDays + "</div>" +
            '<div class="flag-card__label">критических итогов</div>' +
            "</div>" +
            '<div class="flag-card">' +
            '<div class="flag-card__value">' + flags.mediumDays + "</div>" +
            '<div class="flag-card__label">средних итогов</div>' +
            "</div>" +
            '<div class="flag-card">' +
            '<div class="flag-card__value">' + (flags.mediumDays + flags.criticalDays) + "</div>" +
            '<div class="flag-card__label">средних + критических</div>' +
            "</div>";

        const maxWeak = Math.max.apply(null, flags.sphereWeak.map(function (s) { return s.count; }).concat([1]));
        const rows = flags.sphereWeak.filter(function (s) { return s.count > 0; });

        if (!rows.length) {
            breakdown.innerHTML = '<p class="flag-empty">За период почти нет слабых оценок 1–2 — отличный знак.</p>';
            return;
        }

        breakdown.innerHTML = rows.map(function (s) {
            const pct = Math.round((s.count / maxWeak) * 100);
            return (
                '<div class="flag-row">' +
                "<span>" + s.name + "</span>" +
                '<div class="flag-row__bar"><div class="flag-row__fill" style="width:' + pct + '%"></div></div>' +
                '<span class="flag-row__count">' + s.count + "</span>" +
                "</div>"
            );
        }).join("");
    }

    function renderInsights(insights) {
        const list = document.getElementById("insightsList");
        if (!list) return;
        if (!insights.length) {
            list.innerHTML = '<li class="insight-item insight-item--soft"><span class="insight-item__mark">·</span><span>Пока мало данных для выводов. Продолжайте заполнять чек-лист.</span></li>';
            return;
        }
        list.innerHTML = insights.map(function (item, i) {
            return (
                '<li class="insight-item' + (item.soft ? " insight-item--soft" : "") + '">' +
                '<span class="insight-item__mark">' + (i + 1) + "</span>" +
                "<span>" + item.text + "</span>" +
                "</li>"
            );
        }).join("");
    }

    // ============================================================
    // PDF
    // ============================================================

    function buildPdfMarkup(windowEntries, weakParams, flags) {
        const scores = windowEntries.map(getScaledScore);
        const average = avg(scores);
        const min = scores.length ? Math.min.apply(null, scores) : 0;
        const max = scores.length ? Math.max.apply(null, scores) : 0;
        const trend = detectTrend(scores);

        const from = windowEntries.length ? formatDateLabel(windowEntries[0].date) : "—";
        const to = windowEntries.length ? formatDateLabel(windowEntries[windowEntries.length - 1].date) : "—";

        const chartCanvas = document.getElementById("trendChart");
        const chartDataUrl = chartCanvas ? chartCanvas.toDataURL("image/png") : "";

        let paramsHtml;
        if (!weakParams.length) {
            paramsHtml = '<p class="pdf-report__empty">За период нет параметров со средней оценкой 1–2. Так держать.</p>';
        } else {
            paramsHtml = '<ul class="pdf-report__list">' + weakParams.map(function (p) {
                const sphere = SPHERES.find(function (s) { return s.id === p.sphere; });
                return (
                    "<li><strong>" + p.shortName + "</strong> — среднее " +
                    p.average.toFixed(1) + " из 4" +
                    (sphere ? " · сфера «" + sphere.name + "»" : "") +
                    " · на основе " + p.samples + " оценок</li>"
                );
            }).join("") + "</ul>";
        }

        return (
            '<div class="pdf-report__title">Мой Аватар — отчёт за месяц</div>' +
            '<div class="pdf-report__subtitle">Период: ' + from + " — " + to +
            " · " + windowEntries.length + " заполненных оценок · сформировано локально</div>" +
            '<div class="pdf-report__block-title">Динамика общего состояния</div>' +
            '<div class="pdf-report__chart">' +
            (chartDataUrl ? '<img src="' + chartDataUrl + '" alt="График состояния" />' : "") +
            "</div>" +
            '<div class="pdf-report__stats">' +
            '<div class="pdf-report__stat"><strong>' + average.toFixed(1) + "</strong><span>средний балл</span></div>" +
            '<div class="pdf-report__stat"><strong>' + min.toFixed(0) + "</strong><span>минимум</span></div>" +
            '<div class="pdf-report__stat"><strong>' + max.toFixed(0) + "</strong><span>максимум</span></div>" +
            '<div class="pdf-report__stat"><strong>' + trend.label + "</strong><span>тренд</span></div>" +
            "</div>" +
            '<div class="pdf-report__block-title">Красные флаги периода</div>' +
            '<div class="pdf-report__stats">' +
            '<div class="pdf-report__stat"><strong>' + flags.daysWithWeak + "</strong><span>дней с оценками 1–2</span></div>" +
            '<div class="pdf-report__stat"><strong>' + flags.mediumDays + "</strong><span>средних итогов</span></div>" +
            '<div class="pdf-report__stat"><strong>' + flags.criticalDays + "</strong><span>критических итогов</span></div>" +
            '<div class="pdf-report__stat"><strong>' + (flags.mediumDays + flags.criticalDays) + "</strong><span>средних + критических</span></div>" +
            "</div>" +
            '<div class="pdf-report__block-title">Параметры со средней оценкой 1–2</div>' +
            paramsHtml +
            '<div class="pdf-report__footer">Документ создан в приложении «Мой Аватар». Чек-лист не предназначен для самодиагностики — при стойком ухудшении самочувствия обратитесь к специалисту.</div>'
        );
    }

    async function exportPdf(windowEntries, weakParams, flags) {
        const note = document.getElementById("exportNote");
        const btn = document.getElementById("exportPdfBtn");
        if (!windowEntries.length) {
            if (note) {
                note.hidden = false;
                note.classList.add("is-error");
                note.textContent = "Недостаточно данных для отчёта.";
            }
            return;
        }

        const jsPdfNs = window.jspdf;
        if (!jsPdfNs || !jsPdfNs.jsPDF || typeof html2canvas !== "function") {
            if (note) {
                note.hidden = false;
                note.classList.add("is-error");
                note.textContent = "Не удалось загрузить модуль PDF. Обновите страницу и попробуйте снова.";
            }
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.textContent = "Готовим PDF…";
        }
        if (note) {
            note.hidden = false;
            note.classList.remove("is-error");
            note.textContent = "Собираем отчёт…";
        }

        try {
            const report = document.getElementById("pdfReport");
            report.innerHTML = buildPdfMarkup(windowEntries, weakParams, flags);

            const canvas = await html2canvas(report, {
                scale: 2,
                backgroundColor: "#f7f4ef",
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL("image/jpeg", 0.95);
            const pdf = new jsPdfNs.jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = margin;

            pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
            heightLeft -= (pageHeight - margin * 2);

            while (heightLeft > 0) {
                position = margin - (imgHeight - heightLeft);
                pdf.addPage();
                pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
                heightLeft -= (pageHeight - margin * 2);
            }

            const stamp = new Date();
            const y = stamp.getFullYear();
            const m = String(stamp.getMonth() + 1).padStart(2, "0");
            const d = String(stamp.getDate()).padStart(2, "0");
            pdf.save("moi-avatar-otchet-" + y + "-" + m + "-" + d + ".pdf");

            if (note) {
                note.classList.remove("is-error");
                note.textContent = "Отчёт скачан. Файл сохранён локально на вашем устройстве.";
            }
        } catch (err) {
            console.error(err);
            if (note) {
                note.classList.add("is-error");
                note.textContent = "Не удалось сформировать PDF. Попробуйте ещё раз.";
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = "Скачать отчёт за месяц";
            }
            const report = document.getElementById("pdfReport");
            if (report) report.innerHTML = "";
        }
    }

    // ============================================================
    // Инициализация
    // ============================================================

    let cachedWindow = [];
    let cachedWeakParams = [];
    let cachedFlags = null;

    function renderAll() {
        const history = loadHistory();
        const emptyState = document.getElementById("emptyState");
        const content = document.getElementById("dynamicsContent");

        if (!history.length) {
            if (emptyState) emptyState.hidden = false;
            if (content) content.hidden = true;
            return;
        }

        if (emptyState) emptyState.hidden = true;
        if (content) content.hidden = false;

        const windowEntries = getLastN(history, WINDOW_SIZE);
        const sphereAvgs = computeSphereAverages(history);
        const flags = computeWeakFlags(windowEntries);
        const weakParams = computeParamAverages(windowEntries);
        const insights = buildInsights(history, windowEntries, sphereAvgs, flags);

        cachedWindow = windowEntries;
        cachedWeakParams = weakParams;
        cachedFlags = flags;

        const trendMeta = document.getElementById("trendMeta");
        if (trendMeta) {
            const from = formatDateLabel(windowEntries[0].date);
            const to = formatDateLabel(windowEntries[windowEntries.length - 1].date);
            trendMeta.textContent = "Последние " + windowEntries.length + " оценок · " + from + " — " + to;
        }

        drawTrendChart(document.getElementById("trendChart"), windowEntries);
        drawRadarChart(document.getElementById("radarChart"), sphereAvgs);
        renderTrendStats(windowEntries);
        renderSphereLegend(sphereAvgs);
        renderFlags(flags);
        renderInsights(insights);
    }

    document.getElementById("exportPdfBtn").addEventListener("click", function () {
        exportPdf(cachedWindow, cachedWeakParams, cachedFlags || computeWeakFlags(cachedWindow));
    });

    document.addEventListener("themechange", function () {
        if (cachedWindow.length) {
            drawTrendChart(document.getElementById("trendChart"), cachedWindow);
            drawRadarChart(document.getElementById("radarChart"), computeSphereAverages(loadHistory()));
        }
    });

    let resizeTimer = null;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (cachedWindow.length) {
                drawTrendChart(document.getElementById("trendChart"), cachedWindow);
                drawRadarChart(document.getElementById("radarChart"), computeSphereAverages(loadHistory()));
            }
        }, 160);
    });

    renderAll();
})();
