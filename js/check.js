(function() {
        "use strict";

        // ============================================================
        // 1. ПАРАМЕТРЫ ЧЕК-ЛИСТА (оценка по шкале 1–4 из файла)
        // 1 — критическое, 2 — ниже нормы, 3 — удовлетворительно, 4 — оптимально
        // ============================================================
        const QUESTIONS = [
            {
                id: 'sleep_duration',
                group: 'Сон',
                shortName: 'Длительность сна',
                text: 'Длительность сна',
                options: [
                    { label: '< 5 часов', value: 1 },
                    { label: '5–6 часов', value: 2 },
                    { label: '7–8 часов', value: 4 },
                    { label: '> 8 часов', value: 3 }
                ]
            },
            {
                id: 'sleep_quality',
                group: 'Сон',
                shortName: 'Качество сна',
                text: 'Качество сна',
                options: [
                    { label: 'Плохо (просыпался(ась), кошмары)', value: 1 },
                    { label: 'Удовлетворительно (спал(а), но неглубоко)', value: 2 },
                    { label: 'Хорошо (глубокий, восстановительный)', value: 4 }
                ]
            },
            {
                id: 'sleep_time',
                group: 'Сон',
                shortName: 'Время засыпания',
                text: 'Время засыпания',
                options: [
                    { label: 'После 1:00', value: 1 },
                    { label: '23:00–1:00', value: 2 },
                    { label: '22:00–23:00', value: 4 }
                ]
            },
            {
                id: 'water',
                group: 'Питание и водный баланс',
                shortName: 'Вода',
                text: 'Вода (чистая, без учёта чая/кофе)',
                options: [
                    { label: '< 1 л', value: 1 },
                    { label: '1–1,5 л', value: 2 },
                    { label: '1,5–2 л', value: 3 },
                    { label: '> 2 л', value: 4 }
                ]
            },
            {
                id: 'nutrition_regularity',
                group: 'Питание и водный баланс',
                shortName: 'Регулярность питания',
                text: 'Регулярность питания',
                options: [
                    { label: 'Нерегулярно (перекусы на бегу / не по режиму)', value: 1 },
                    { label: 'Умеренно (3 раза + 1–2 перекуса)', value: 2 },
                    { label: 'Регулярно (3 раза + полезные перекусы)', value: 4 }
                ]
            },
            {
                id: 'nutrition_quality',
                group: 'Питание и водный баланс',
                shortName: 'Качество питания',
                text: 'Качество питания',
                options: [
                    { label: 'Фастфуд, рафинированные продукты', value: 1 },
                    { label: 'Смешанное (есть овощи/белок, но много сладкого)', value: 2 },
                    { label: 'Сбалансированное (белок + клетчатка + сложные углеводы)', value: 4 }
                ]
            },
            {
                id: 'activity',
                group: 'Напряжение в теле',
                shortName: 'Уровень активности',
                text: 'Уровень активности',
                options: [
                    { label: 'Сидячий день (менее 30 мин ходьбы)', value: 1 },
                    { label: 'Минимальный (прогулка 30–60 мин)', value: 2 },
                    { label: 'Умеренный (ходьба + зарядка/лёгкая активность)', value: 3 },
                    { label: 'Высокий (спорт, бег, активные тренировки)', value: 4 }
                ]
            },
            {
                id: 'body_feeling',
                group: 'Напряжение в теле',
                shortName: 'Ощущение тела',
                text: 'Ощущение тела',
                options: [
                    { label: 'Напряжение, зажатость, боль и др. неприятные ощущения', value: 1 },
                    { label: 'Нормально (не чувствую)', value: 2 },
                    { label: 'Лёгкость, комфорт, приятная усталость', value: 4 }
                ]
            },
            {
                id: 'stress',
                group: 'Стресс',
                shortName: 'Уровень стресса',
                text: 'Уровень стресса (субъективная оценка, шкала 1–10)',
                options: [
                    { label: '8–10 (на пределе)', value: 1 },
                    { label: '6–7 (выше среднего)', value: 2 },
                    { label: '4–5 (средний)', value: 3 },
                    { label: '2–3 (низкий)', value: 4 },
                    { label: '1 (почти нет)', value: 4 }
                ]
            },
            {
                id: 'emotion',
                group: 'Стресс',
                shortName: 'Ведущая эмоция дня',
                text: 'Ведущая эмоция дня',
                options: [
                    { label: 'Тревога, страх, злость, раздражение', value: 1 },
                    { label: 'Пустота, апатия', value: 2 },
                    { label: 'Спокойствие, принятие', value: 3 },
                    { label: 'Радость, благодарность', value: 4 }
                ]
            },
            {
                id: 'disrupting_event',
                group: 'Стресс',
                shortName: 'Событие, выбившее из колеи',
                text: 'Событие, выбившее из колеи',
                options: [
                    { label: 'Было сильное (сильно задело)', value: 1 },
                    { label: 'Было, но справился(ась)', value: 2 },
                    { label: 'Не было', value: 4 }
                ]
            },
            {
                id: 'time_for_self',
                group: 'Время для себя',
                shortName: 'Время для себя',
                text: 'Время для себя (без обязательств)',
                options: [
                    { label: 'Нет, совсем', value: 1 },
                    { label: '10–15 минут (перерыв)', value: 2 },
                    { label: '30–60 минут (осознанная пауза)', value: 3 },
                    { label: '> 1 часа (полноценное восстановление)', value: 4 }
                ]
            },
            {
                id: 'recovery_form',
                group: 'Время для себя',
                shortName: 'Форма восстановления',
                text: 'Форма восстановления',
                options: [
                    { label: 'Ничего, просто терпел(а)', value: 1 },
                    { label: 'Пассивное (скроллинг, сериалы, зависание в сети)', value: 2 },
                    { label: 'Активное (прогулка, дыхание, медитация, ванна, спорт)', value: 4 }
                ]
            },
            {
                id: 'live_communication',
                group: 'Поддержка',
                shortName: 'Живое общение',
                text: 'Живое общение (не чаты)',
                options: [
                    { label: 'Нет, я был(а) один(а)', value: 1 },
                    { label: 'Короткое, по делу', value: 2 },
                    { label: 'Длительное (более 1 часа) приятное общение', value: 3 },
                    { label: 'Глубокий разговор с близким человеком', value: 4 }
                ]
            },
            {
                id: 'support_feeling',
                group: 'Поддержка',
                shortName: 'Чувство поддержки',
                text: 'Чувство поддержки',
                options: [
                    { label: 'Нет, чувствовал(а) себя одиноко', value: 1 },
                    { label: 'Немного, но в основном сама/сам', value: 2 },
                    { label: 'Да, меня поддержали', value: 4 }
                ]
            },
            {
                id: 'cycle_day',
                group: 'Дополнительно',
                shortName: 'День цикла',
                text: 'День цикла (если применимо)',
                optional: true,
                options: [
                    { label: '1–5 (менструация)', value: 2 },
                    { label: '6–14 (фолликулярная фаза)', value: 4 },
                    { label: '15–28 (лютеиновая фаза)', value: 3 },
                    { label: 'Не применимо / менопауза', value: 'na' }
                ]
            }
        ];

        // Рекомендации при оценках 1–2 в группе параметров (из файла)
        const GROUP_TIPS = {
            'Сон': 'Отказаться от кофе после 15:00, проветрить комнату, лечь на 30 мин раньше.',
            'Стресс': 'Сделать дыхательную практику (вдох на 4, задержка на 2, выдох на 6) — 5–10 циклов.',
            'Напряжение в теле': 'Акупрессура точки «Хэ-Гу» (между большим и указательным пальцем) — 2–3 минуты.',
            'Время для себя': 'Выделить 15 минут «неприкасаемого времени» без телефона и дел.',
            'Поддержка': 'Позвонить близкому человеку без повода. А ещё лучше встретиться, поговорить по душам за чашечкой чая или кофе.'
        };

        // ============================================================
        // 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (история в localStorage)
        // ============================================================

        function getTodayStr() {
            const d = new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }

        function getRecordId() {
            return 'entry_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        }

        function loadHistory() {
            try {
                const raw = localStorage.getItem('moi_avatar_history');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) return parsed;
                }
            } catch (_) { /* ignore */ }
            return [];
        }

        function saveHistory(history) {
            localStorage.setItem('moi_avatar_history', JSON.stringify(history));
        }

        function saveTodayResult(score, level, recommendation, answers) {
            const history = loadHistory();
            const today = getTodayStr();
            const filtered = history.filter(entry => entry.date !== today);
            const newEntry = {
                id: getRecordId(),
                date: today,
                score: score,
                level: level,
                recommendation: recommendation,
                answers: answers || null
            };
            filtered.push(newEntry);
            // Храним в хронологическом порядке: от ранних дат к поздним
            filtered.sort((a, b) => a.date.localeCompare(b.date));
            saveHistory(filtered);
            return filtered;
        }

        function clearAllHistory() {
            localStorage.removeItem('moi_avatar_history');
            return [];
        }

        // Последние до 7 записей в хронологическом порядке (слева — раньше, справа — позже)
        function getLast7Chronological(history) {
            const sorted = history.slice().sort((a, b) => a.date.localeCompare(b.date));
            return sorted.slice(-7);
        }

        // Тренд по крайним 7 дням: рост / спад / вариабельность / стабильность
        function detectTrend(scores) {
            if (scores.length < 2) {
                return { label: 'стабильный ➡️', kind: 'stable' };
            }

            let ups = 0;
            let downs = 0;
            for (let i = 1; i < scores.length; i++) {
                if (scores[i] > scores[i - 1]) ups++;
                else if (scores[i] < scores[i - 1]) downs++;
            }

            if (ups > 0 && downs > 0) {
                return { label: 'вариабельный ↕️', kind: 'variable' };
            }
            if (ups > 0 && downs === 0) {
                return { label: 'улучшается 📈', kind: 'up' };
            }
            if (downs > 0 && ups === 0) {
                return { label: 'ухудшается 📉', kind: 'down' };
            }
            return { label: 'стабильный ➡️', kind: 'stable' };
        }

        // Проверка: dateOlder на календарный день раньше dateNewer
        function isPrevCalendarDay(dateOlder, dateNewer) {
            const a = new Date(dateOlder + 'T12:00:00');
            const b = new Date(dateNewer + 'T12:00:00');
            return Math.round((b - a) / 86400000) === 1;
        }

        // Сколько календарных дней подряд с конца истории выполняется условие
        function countTrailingStreak(sortedAsc, predicate) {
            let streak = 0;
            for (let i = sortedAsc.length - 1; i >= 0; i--) {
                const entry = sortedAsc[i];
                if (!entry.answers || !predicate(entry.answers)) break;
                if (i < sortedAsc.length - 1) {
                    const newer = sortedAsc[i + 1];
                    if (!isPrevCalendarDay(entry.date, newer.date)) break;
                }
                streak++;
            }
            return streak;
        }

        // Цвета столбцов истории берём из CSS-переменных (подстраиваются под тему)
        function getCssVar(name) {
            return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        }

        // ============================================================
        // 3. ОСНОВНАЯ ЛОГИКА РАСЧЁТА И АВАТАРА
        // Шкала итога из файла (ориентир max≈80): 70–80 / 55–69 / 40–54 / <40
        // ============================================================

        function getMaxPossible(answers) {
            let max = 0;
            for (const q of QUESTIONS) {
                const val = answers[q.id];
                if (val === null || val === undefined || val === 'na') continue;
                max += 4;
            }
            return max || 1;
        }

        function getTotalScore(answers) {
            let total = 0;
            for (const q of QUESTIONS) {
                const val = answers[q.id];
                if (typeof val === 'number') total += val;
            }
            return total;
        }

        // Приводим сумму к шкале файла (эталон 80) по фактическому максимуму
        function getScaledScore(score, maxPossible) {
            return (score / maxPossible) * 80;
        }

        function getAvatarState(score, maxPossible) {
            const scaled = getScaledScore(score, maxPossible || 80);
            if (scaled >= 70) return 'excellent';
            if (scaled >= 55) return 'good';
            if (scaled >= 40) return 'medium';
            return 'low';
        }

        function getLowParams(answers) {
            return QUESTIONS.filter(q => {
                const val = answers[q.id];
                return typeof val === 'number' && val <= 2;
            });
        }

        function getActiveGroupTips(answers) {
            const tips = [];
            const seen = {};
            for (const q of QUESTIONS) {
                const val = answers[q.id];
                if (typeof val !== 'number' || val > 2) continue;
                const tip = GROUP_TIPS[q.group];
                if (tip && !seen[q.group]) {
                    seen[q.group] = true;
                    tips.push({ group: q.group, tip: tip });
                }
            }
            return tips;
        }

        function calculateResult(answers) {
            const score = getTotalScore(answers);
            const maxPossible = getMaxPossible(answers);
            const scaled = getScaledScore(score, maxPossible);
            const state = getAvatarState(score, maxPossible);
            const lowParams = getLowParams(answers);

            let level, recommendation;
            if (state === 'excellent') {
                level = 'Отлично 🌸';
                recommendation = 'Вы в ресурсе. Поддерживайте режим.';
            } else if (state === 'good') {
                level = 'Хорошо 🌿';
                if (lowParams.length) {
                    recommendation = 'Есть небольшие зоны роста. Обратите внимание на параметры с оценкой 1–2: '
                        + lowParams.map(p => p.shortName).join(', ') + '.';
                } else {
                    recommendation = 'Есть небольшие зоны роста. Продолжайте поддерживать баланс.';
                }
            } else if (state === 'medium') {
                level = 'Средний 🌱';
                recommendation = 'Риск выгорания. Требуется коррекция режима и отдых.';
            } else {
                level = 'Критический ❤️‍🩹';
                recommendation = 'Высокий риск психосоматики. Срочно нужна пауза и восстановление.';
            }

            return {
                score: score,
                maxPossible: maxPossible,
                scaled: scaled,
                level: level,
                recommendation: recommendation,
                state: state,
                groupTips: getActiveGroupTips(answers)
            };
        }

        // Красные флаги по серии дней (из файла)
        function collectRedFlags(history) {
            const sorted = history.slice().sort((a, b) => a.date.localeCompare(b.date));
            const flags = [];

            // Сон < 6 ч (оценка ≤2) + плохое качество (1) более 3 дней подряд
            const sleepStreak = countTrailingStreak(sorted, a =>
                typeof a.sleep_duration === 'number' && a.sleep_duration <= 2
                && a.sleep_quality === 1
            );
            if (sleepStreak > 3) {
                flags.push('Мне важно наладить сон! Чувствую себя разбитым…');
            }

            // Вода < 1 л + нерегулярное питание более 2 дней
            const foodStreak = countTrailingStreak(sorted, a =>
                a.water === 1 && a.nutrition_regularity === 1
            );
            if (foodStreak > 2) {
                flags.push('Мне важно наладить питание! Неприятные ощущения в животе…');
            }

            // Нет движения + напряжение в теле более 3 дней
            const bodyStreak = countTrailingStreak(sorted, a =>
                a.activity === 1 && a.body_feeling === 1
            );
            if (bodyStreak > 3) {
                flags.push('Мне важно наладить физическую активность! Неприятные ощущения в теле…');
            }

            // Стресс > 7 (оценка 1) + негативная эмоция (1–2) более 2 дней подряд
            const stressStreak = countTrailingStreak(sorted, a =>
                a.stress === 1 && typeof a.emotion === 'number' && a.emotion <= 2
            );
            if (stressStreak > 2) {
                flags.push('Мне важно использовать техники борьбы со стрессом и наладить свое эмоциональное состояние! Это начинает плохо сказываться на мне…');
            }

            // Нет времени для себя и/или слабая форма восстановления более 3 дней
            const selfStreak = countTrailingStreak(sorted, a =>
                a.time_for_self === 1
                || (typeof a.recovery_form === 'number' && a.recovery_form <= 2)
            );
            if (selfStreak > 3) {
                flags.push('Мне важно восстановиться и уделить время себе! Иначе это негативно отразится на моем здоровье…');
            }

            // Нет живого общения + одиночество более 3 дней
            const supportStreak = countTrailingStreak(sorted, a =>
                a.live_communication === 1 && a.support_feeling === 1
            );
            if (supportStreak > 3) {
                flags.push('Мне важно поговорить по душам с кем-то...Мне так одиноко…');
            }

            return flags;
        }

        function renderRedFlags(history) {
            const box = document.getElementById('avatarFlags');
            if (!box) return;
            const flags = collectRedFlags(history);
            if (!flags.length) {
                box.innerHTML = '';
                return;
            }
            box.innerHTML = flags.map(function(msg) {
                return '<div class="avatar-flag">' + msg + '</div>';
            }).join('');
        }

        // Обновление картинки аватара с короткой анимацией смены
        function updateAvatar(score, maxPossible) {
            const avatarImage = document.getElementById('avatarImage');
            if (!avatarImage) return;

            const state = getAvatarState(score, maxPossible);
            const nextSrc = `images/avatar-${state}.png`;
            const stateLabels = {
                excellent: 'отличное состояние',
                good: 'хорошее состояние',
                medium: 'среднее состояние',
                low: 'критическое состояние'
            };

            // Если картинка уже та же — только лёгкий акцент без перезагрузки
            if (avatarImage.getAttribute('src') === nextSrc) {
                avatarImage.classList.remove('is-appeared');
                void avatarImage.offsetWidth;
                avatarImage.classList.add('is-appeared');
                return;
            }

            avatarImage.classList.remove('is-appeared');
            avatarImage.classList.add('is-changing');

            window.setTimeout(function() {
                avatarImage.src = nextSrc;
                avatarImage.alt = 'Аватар: ' + stateLabels[state];
                avatarImage.classList.remove('is-changing');
                void avatarImage.offsetWidth;
                avatarImage.classList.add('is-appeared');
            }, 220);
        }

        // ============================================================
        // 4. РЕНДЕРИНГ ИНТЕРФЕЙСА
        // ============================================================

        const container = document.getElementById('questionsContainer');
        const resultCard = document.getElementById('resultCard');
        const resultLevel = document.getElementById('resultLevel');
        const resultScore = document.getElementById('resultScore');
        const resultRecommendation = document.getElementById('resultRecommendation');
        const resultTips = document.getElementById('resultTips');
        const historyContainer = document.getElementById('historyContainer');
        const reportCard = document.getElementById('reportCard');
        const reportContent = document.getElementById('reportContent');

        function renderQuestions() {
            let html = '';
            let lastGroup = null;
            QUESTIONS.forEach((q, index) => {
                if (q.group !== lastGroup) {
                    html += `<div class="group-title">${q.group}</div>`;
                    lastGroup = q.group;
                }
                const num = index + 1;
                html += `<div class="question-block" data-qid="${q.id}">
                            <div class="question-text">
                                <span class="q-num">${num}</span>
                                <span>${q.text}</span>
                            </div>
                            <div class="options">`;
                q.options.forEach((opt, optIndex) => {
                    const valueKey = String(opt.value);
                    // Уникальный id даже если оценки совпадают (например, стресс 2–3 и 1 → обе 4)
                    const inputId = `${q.id}_${optIndex}_${valueKey}`;
                    html += `<label for="${inputId}">
                                <input type="radio" name="${q.id}" id="${inputId}" value="${valueKey}" />
                                <span>${opt.label}</span>
                            </label>`;
                });
                html += `</div></div>`;
            });
            container.innerHTML = html;
        }

        function getAnswers() {
            const answers = {};
            let allAnswered = true;
            for (const q of QUESTIONS) {
                const selected = document.querySelector(`input[name="${q.id}"]:checked`);
                if (selected) {
                    const raw = selected.value;
                    answers[q.id] = (raw === 'na') ? null : parseFloat(raw);
                } else {
                    allAnswered = false;
                    answers[q.id] = undefined;
                }
            }
            return { answers, allAnswered };
        }

        function renderGroupTips(tips) {
            if (!resultTips) return;
            if (!tips || !tips.length) {
                resultTips.classList.remove('visible');
                resultTips.innerHTML = '';
                return;
            }
            let html = '<strong>Что можно сделать по зонам внимания:</strong><ul>';
            tips.forEach(function(item) {
                html += `<li><strong>${item.group}:</strong> ${item.tip}</li>`;
            });
            html += '</ul>';
            resultTips.innerHTML = html;
            resultTips.classList.add('visible');
        }

        function displayResult(score, level, recommendation, answers, meta) {
            resultLevel.textContent = level;
            const maxPossible = (meta && meta.maxPossible) || (answers ? getMaxPossible(answers) : 80);
            resultScore.textContent = `Баллы: ${score} из ${maxPossible}`;
            resultRecommendation.textContent = recommendation;

            const levelMap = {
                'Отлично 🌸': 'level-excellent',
                'Хорошо 🌿': 'level-good',
                'Средний 🌱': 'level-medium',
                'Критический ❤️‍🩹': 'level-critical',
                // Совместимость со старыми записями истории
                'Цветёт 🌸': 'level-excellent',
                'Средне 🌱': 'level-medium',
                'Грустно 🍂': 'level-low',
                'Критическое ❤️‍🩹': 'level-critical'
            };
            resultLevel.className = 'result-level';
            const foundClass = levelMap[level];
            if (foundClass) resultLevel.classList.add(foundClass);

            renderGroupTips(meta && meta.groupTips ? meta.groupTips : (answers ? getActiveGroupTips(answers) : []));

            // Меняем аватара под итоговый балл (шкала из файла)
            updateAvatar(score, maxPossible);

            resultCard.classList.add('visible');
            // Скрываем отчёт при новом результате
            reportCard.classList.remove('visible');

            const history = saveTodayResult(score, level, recommendation, answers);
            renderHistory(history);
            renderRedFlags(history);
        }

        function renderHistory(history) {
            // Берём крайние 7 дней и рисуем слева направо по дате заполнения
            const last7 = getLast7Chronological(history);
            if (last7.length === 0) {
                historyContainer.innerHTML = `<div class="empty-history">Нет данных. Пройдите тест, чтобы заполнить историю.</div>`;
                return;
            }
            // Масштаб по фактическому максимуму |балла|, чтобы столбики читались лучше
            const maxScore = Math.max(...last7.map(e => Math.abs(e.score)), 1);
            const colorPositive = getCssVar('--bar-positive');
            const colorNegative = getCssVar('--bar-negative');
            let barsHtml = '<div class="history-bars">';
            last7.forEach(entry => {
                const height = Math.max(4, (Math.abs(entry.score) / maxScore) * 72);
                const color = entry.score >= 0 ? colorPositive : colorNegative;
                const dateParts = entry.date.split('-');
                const label = `${dateParts[2]}.${dateParts[1]}`;
                barsHtml += `<div class="bar-wrapper">
                                <span class="bar-score">${entry.score}</span>
                                <div class="bar" style="height: ${height}px; background: ${color};"></div>
                                <span class="bar-label">${label}</span>
                            </div>`;
            });
            barsHtml += '</div>';
            historyContainer.innerHTML = barsHtml;
        }

        function resetForm() {
            document.querySelectorAll('input[type="radio"]').forEach(input => input.checked = false);
            resultCard.classList.remove('visible');
            reportCard.classList.remove('visible');
            if (resultTips) {
                resultTips.classList.remove('visible');
                resultTips.innerHTML = '';
            }
        }

        // ============================================================
        // 5. ОТЧЁТ ЗА НЕДЕЛЮ
        // ============================================================

        function generateWeeklyReport() {
            const history = loadHistory();
            // Крайние 7 дней в хронологическом порядке (как на диаграмме)
            const last7 = getLast7Chronological(history);
            if (last7.length === 0) {
                return `<div class="report-empty">Нет данных для отчёта. Пройдите тест несколько раз, чтобы увидеть статистику.</div>`;
            }

            const scores = last7.map(e => e.score);
            const average = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
            const min = Math.min(...scores);
            const max = Math.max(...scores);
            const trendInfo = detectTrend(scores);
            const trend = trendInfo.label;

            const levelCounts = {};
            last7.forEach(entry => {
                const level = entry.level;
                levelCounts[level] = (levelCounts[level] || 0) + 1;
            });

            // Рекомендация на основе тренда
            let recommendation = '';
            if (trendInfo.kind === 'up') {
                recommendation = 'Вы на правильном пути! Продолжайте заботиться о себе. Обратите внимание на сон и время для себя.';
            } else if (trendInfo.kind === 'down') {
                recommendation = 'Ваше состояние снижается. Попробуйте добавить восстановительные практики: дыхание, прогулки, общение с близкими. Возможно, стоит обратиться к специалисту.';
            } else if (trendInfo.kind === 'variable') {
                recommendation = 'Состояние колеблется. Это нормально, но полезно замечать, что помогает восстановиться, а что забирает силы. Старайтесь выравнивать сон, питание и время для себя.';
            } else {
                recommendation = 'Состояние стабильно. Это хорошо, но не забывайте о регулярной заботе о себе. Попробуйте ввести новый ритуал для поддержания энергии.';
            }

            let statsHtml = `
                <div class="report-stats">
                    <div class="stat-item">
                        <div class="stat-label">Средний балл</div>
                        <div class="stat-value">${average}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Минимум</div>
                        <div class="stat-value warning">${min}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Максимум</div>
                        <div class="stat-value good">${max}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Тренд</div>
                        <div class="stat-value">${trend}</div>
                    </div>
                </div>
                <div class="report-trend">
                    <strong>Распределение состояний:</strong><br>
                    ${Object.entries(levelCounts).map(([level, count]) => `${level}: ${count} дн.`).join(' • ')}
                    <br><br>
                    <strong>Рекомендация:</strong> ${recommendation}
                </div>
            `;
            return statsHtml;
        }

        function showReport() {
            const html = generateWeeklyReport();
            reportContent.innerHTML = html;
            reportCard.classList.add('visible');
            reportCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // ============================================================
        // 6. ОБРАБОТЧИКИ СОБЫТИЙ
        // ============================================================

        document.getElementById('calcBtn').addEventListener('click', function() {
            const { answers, allAnswered } = getAnswers();
            if (!allAnswered) {
                alert('Пожалуйста, ответьте на все вопросы чек-листа.');
                return;
            }
            const result = calculateResult(answers);
            displayResult(result.score, result.level, result.recommendation, answers, result);
        });

        document.getElementById('resetBtn').addEventListener('click', resetForm);

        document.getElementById('reportBtn').addEventListener('click', function() {
            showReport();
        });

        document.getElementById('clearHistoryBtn').addEventListener('click', function() {
            if (confirm('Удалить всю историю прохождений?')) {
                clearAllHistory();
                renderHistory([]);
                resultCard.classList.remove('visible');
                reportCard.classList.remove('visible');
                if (resultTips) {
                    resultTips.classList.remove('visible');
                    resultTips.innerHTML = '';
                }
                historyContainer.innerHTML = `<div class="empty-history">История очищена. Пройдите тест, чтобы начать заново.</div>`;
                // Нейтральный аватар (средний уровень по шкале файла)
                updateAvatar(48, 80);
                renderRedFlags([]);
            }
        });

        // При смене темы перерисовываем столбцы истории под новые цвета
        document.addEventListener('themechange', function() {
            renderHistory(loadHistory());
        });

        // ============================================================
        // 7. ИНИЦИАЛИЗАЦИЯ
        // ============================================================

        renderQuestions();
        const initialHistory = loadHistory();
        renderHistory(initialHistory);
        renderRedFlags(initialHistory);

        const today = getTodayStr();
        const todayEntry = initialHistory.find(entry => entry.date === today);
        if (todayEntry) {
            const meta = todayEntry.answers
                ? {
                    maxPossible: getMaxPossible(todayEntry.answers),
                    groupTips: getActiveGroupTips(todayEntry.answers)
                }
                : { maxPossible: 80, groupTips: [] };
            displayResult(
                todayEntry.score,
                todayEntry.level,
                todayEntry.recommendation,
                todayEntry.answers || null,
                meta
            );
        }

        console.log('🌱 Мой Аватар: Калькулятор состояния загружен!');
        console.log(`📊 Всего записей в истории: ${initialHistory.length}`);
    })();

