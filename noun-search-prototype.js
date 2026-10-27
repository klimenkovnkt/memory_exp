/* =========================
АДАПТИВНЫЕ РАЗМЕРЫ
========================= */
function getAdaptiveSizes() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const minDim = Math.min(w, h);

    // УВЕЛИЧЕННЫЙ радиус для всех set_size (было 0.40/420, стало 0.45/500)
    const circle_radius = Math.min(minDim * 0.45, 500);
    const ring_px = Math.min(minDim * 0.16, 200);
    const stim_px = Math.round(ring_px * 0.75);
    const arena_size = Math.round(circle_radius * 2 + ring_px + 200);

    return { circle_radius, ring_px, stim_px, arena_size };
}

const ADAPTIVE = getAdaptiveSizes();

/* =========================
BASIC CONFIG
========================= */
const CONFIG = {
    left_key: "ArrowLeft",
    right_key: "ArrowRight",

    blank_ms: 300,
    cue_ms: 700,
    fixation_ms: 500,
    blank_after_fixation_ms: 300,
    study_ms: 700,
    search_timeout_ms: 5000,
    familiar_timeout_ms: 3000,
    feedback_ms: 700,

    stim_px: ADAPTIVE.stim_px,
    ring_px: ADAPTIVE.ring_px,
    circle_radius: ADAPTIVE.circle_radius,
    arena_size: ADAPTIVE.arena_size,

    stim_templates_count: 8,
    without_search_count: 8,
    new_stims_count: 8,
    newest_stims_count: 8,

    correct_per_item: 8,

    set_sizes: [4, 8, 12],

    paths: {
        objects: "./NOUN-2-600DPI/",
        ring_left: "./Lring_LEFT.png",
        ring_right: "./Lring_RIGHT.png",
    },
};

/* =========================
СПИСОК ВСЕХ ОБЪЕКТОВ
========================= */
const ALL_OBJECT_IDS = [
    2001, 2002, 2003, 2004, 2005, 2006, 2007, 2009, 2010, 2011, 2012, 2013,
    2014, 2015, 2016, 2017, 2018, 2019, 2021, 2022, 2023, 2025, 2026, 2027,
    2028, 2029, 2030, 2032, 2033, 2035, 2036, 2037, 2038, 2039, 2040, 2041,
    2042, 2044, 2045, 2046, 2047, 2048, 2049, 2050, 2051, 2052, 2053, 2054,
    2055, 2056, 2057, 2058, 2060, 2061, 2062, 2063, 2064
];

function objPath(id) { return `${CONFIG.paths.objects}${id}-600.jpg`; }

/* =========================
ИНИЦИАЛИЗАЦИЯ JSPSYCH С DATAPIPE
========================= */
const jsPsych = initJsPsych({
    display_element: "jspsych-target",
    extensions: [
        {
            type: jsPsychExtensionPipe,
            params: {
                experiment_id: "ktbMNGnc4ZoC",
            }
        }
    ],
    on_finish: function () {
        jsPsych.data.displayData();
    },
});

/* =========================
HELPERS
========================= */
function sampleOne(arr) { return jsPsych.randomization.sampleWithoutReplacement(arr, 1)[0]; }
function shuffle(arr) { return jsPsych.randomization.shuffle(arr); }
function pickDistractors(targetId, pool, n) {
    const candidates = pool.filter(x => x !== targetId);
    return jsPsych.randomization.sampleWithoutReplacement(candidates, n);
}
function getRingPath(side) { return side === "left" ? CONFIG.paths.ring_left : CONFIG.paths.ring_right; }
function getCorrectKey(side) {
    return side === "left" ? CONFIG.left_key.toLowerCase() : CONFIG.right_key.toLowerCase();
}
function getKeyName(code) {
    const map = { "ArrowLeft": "стрелку влево (←)", "ArrowRight": "стрелку вправо (→)" };
    return map[code] || code;
}

/* =========================
POSITION GENERATION (СТРОГО СИММЕТРИЧНО ПО КВАДРАНТАМ)
========================= */
/* =========================
POSITION GENERATION (СТРОГО СИММЕТРИЧНО ПО КВАДРАНТАМ)
========================= */
function generateSearchPositions({ nItems }) {
    const cx = CONFIG.arena_size / 2;
    const cy = CONFIG.arena_size / 2;
    const radius = CONFIG.circle_radius;
    
    // Угол между стимулами (равные расстояния)
    const angleStep = (Math.PI * 2) / nItems;
    
    // Начальный угол делит первый квадрант пополам для симметрии
    // 4 стимула: 45°, 8 стимулов: 22.5°, 12 стимулов: 15°
    const startAngle = Math.PI / (2 * nItems);
    
    let positions = [];
    for (let i = 0; i < nItems; i++) {
        // Начинаем сверху (-π/2) и добавляем начальный угол
        const angle = -Math.PI / 2 + startAngle + (angleStep * i);
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        positions.push({ x, y });
    }
    
    return positions;
}

/* =========================
HTML BUILDERS
========================= */
function blankHTML() {
    return `<div class="screen-wrap"></div>`;
}

function fixationHTML() {
    return `<div class="screen-wrap"><div class="fixation">+</div></div>`;
}

function cueHTML(targetPath, showLabel = true) {
    if (showLabel) {
        return `<div class="screen-wrap">
                    <div class="cue-wrap">
                        <div class="cue-label">Найдите этот предмет</div>
                        <img class="cue-img" src="${targetPath}" style="width:${CONFIG.stim_px}px; height:${CONFIG.stim_px}px;">
                    </div>
                </div>`;
    } else {
        return `<div class="screen-wrap">
                    <img class="cue-img" src="${targetPath}" style="width:${CONFIG.stim_px}px; height:${CONFIG.stim_px}px;">
                </div>`;
    }
}

function singleObjectWithRingHTML(targetPath, gapSide, showLabel = true) {
    const inner = `
        <div class="stim-container" style="position:relative; width:${CONFIG.ring_px}px; height:${CONFIG.ring_px}px; transform:none;">
            <img class="stim-obj" src="${targetPath}" style="width:${CONFIG.stim_px}px; height:${CONFIG.stim_px}px;">
            <img class="stim-ring" src="${getRingPath(gapSide)}" style="width:100%; height:100%;">
        </div>
    `;
    if (showLabel) {
        return `<div class="screen-wrap">
                    <div class="cue-wrap">
                        <div class="cue-label">Где разрыв кольца?</div>
                        ${inner}
                    </div>
                </div>`;
    } else {
        return `<div class="screen-wrap">${inner}</div>`;
    }
}

function searchArrayHTML({ targetId, distractorIds, gapSideTarget, setSize }) {
    const ids = shuffle([targetId, ...distractorIds]);
    const positions = generateSearchPositions({ nItems: setSize });
    let html = `<div class="arena-wrap"><div class="arena" style="width:${CONFIG.arena_size}px; height:${CONFIG.arena_size}px;">`;
    const targetIndex = ids.indexOf(targetId);

    ids.forEach((id, idx) => {
        const pos = positions[idx];
        const isTarget = idx === targetIndex;
        const ringSide = isTarget ? gapSideTarget : sampleOne(["left", "right"]);

        html += `
          <div class="stim-container" style="left:${pos.x}px; top:${pos.y}px; width:${CONFIG.ring_px}px; height:${CONFIG.ring_px}px; transform: translate(-50%, -50%);">
            <img class="stim-obj" src="${objPath(id)}" style="width:${CONFIG.stim_px}px; height:${CONFIG.stim_px}px;">
            <img class="stim-ring" src="${getRingPath(ringSide)}" style="width:100%; height:100%;">
          </div>
        `;
    });
    html += `</div></div>`;
    return html;
}

/* =========================
TRIAL FACTORIES
========================= */
function makeBlankTrial(duration, extraData = {}) {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: blankHTML(),
        choices: "NO_KEYS",
        trial_duration: duration,
        data: { screen: "blank", participant_id: window.PARTICIPANT_ID, seed: window.SEED, part: 1, ...extraData },
    };
}

function makeFixationTrial(extraData = {}) {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: fixationHTML(),
        choices: "NO_KEYS",
        trial_duration: CONFIG.fixation_ms,
        data: { screen: "fixation", participant_id: window.PARTICIPANT_ID, seed: window.SEED, part: 1, ...extraData },
    };
}

function makeCueTrial(targetId, showLabel, extraData = {}) {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: cueHTML(objPath(targetId), showLabel),
        choices: "NO_KEYS",
        trial_duration: CONFIG.cue_ms,
        data: { screen: "cue", target_id: targetId, participant_id: window.PARTICIPANT_ID, seed: window.SEED, part: 1, ...extraData },
    };
}

function makeStudyTrial(targetId, extraData = {}) {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `<div class="screen-wrap"><img class="cue-img" src="${objPath(targetId)}" style="width:${CONFIG.stim_px}px; height:${CONFIG.stim_px}px;"></div>`,
        choices: "NO_KEYS",
        trial_duration: CONFIG.study_ms,
        data: { screen: "study", target_id: targetId, participant_id: window.PARTICIPANT_ID, seed: window.SEED, part: 1, ...extraData },
    };
}

function makeFeedbackTrial() {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function () {
            const last = jsPsych.data.get().last(1).values()[0];
            if (last.response === null) return `<div class="screen-wrap"><div class="feedback-slow">Слишком медленно</div></div>`;
            return last.correct ? `<div class="screen-wrap"><div class="feedback-good">Верно</div></div>` : `<div class="screen-wrap"><div class="feedback-bad">Ошибка</div></div>`;
        },
        choices: "NO_KEYS",
        trial_duration: CONFIG.feedback_ms,
        data: { screen: "feedback" },
    };
}

function makeSearchTrial({ targetId, distractorPool, setSize, block, condition, gapSide }) {
    const distractorIds = pickDistractors(targetId, distractorPool, setSize - 1);
    const correctKey = getCorrectKey(gapSide);

    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: searchArrayHTML({ targetId, distractorIds, gapSideTarget: gapSide, setSize }),
        choices: [CONFIG.left_key, CONFIG.right_key],
        trial_duration: CONFIG.search_timeout_ms,
        response_ends_trial: true,
        data: {
            trial_kind: "search", block, condition,
            target_id: targetId, distractor_ids: distractorIds.join("|"),
            set_size: setSize, correct_gap: gapSide, correct_key: correctKey,
            participant_id: window.PARTICIPANT_ID, seed: window.SEED, part: 1,
        },
        on_finish: function (data) {
            if (data.response === null) {
                data.correct = 0;
                data.timeout = 1;
            } else {
                data.correct = (data.response.toLowerCase() === correctKey.toLowerCase()) ? 1 : 0;
                data.timeout = 0;
            }
        },
    };
}

function makeFamiliarTrial({ targetId, block, condition, gapSide, showLabel }) {
    const correctKey = getCorrectKey(gapSide);

    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: singleObjectWithRingHTML(objPath(targetId), gapSide, showLabel),
        choices: [CONFIG.left_key, CONFIG.right_key],
        trial_duration: CONFIG.familiar_timeout_ms,
        response_ends_trial: true,
        data: {
            trial_kind: "familiar_single", block, condition,
            target_id: targetId, correct_gap: gapSide, correct_key: correctKey,
            participant_id: window.PARTICIPANT_ID, seed: window.SEED, part: 1,
        },
        on_finish: function (data) {
            if (data.response === null) {
                data.correct = 0;
                data.timeout = 1;
            } else {
                data.correct = (data.response.toLowerCase() === correctKey.toLowerCase()) ? 1 : 0;
                data.timeout = 0;
            }
        },
    };
}

/* =========================
ГЕНЕРАЦИЯ УСЛОВИЙ ДЛЯ БЛОКА 1
========================= */
function generateBlock1Conditions() {
    const conditions = [];
    for (let i = 0; i < 2; i++) {
        conditions.push({ targetSide: "left", gapSide: "left" });
        conditions.push({ targetSide: "left", gapSide: "right" });
    }
    for (let i = 0; i < 2; i++) {
        conditions.push({ targetSide: "right", gapSide: "left" });
        conditions.push({ targetSide: "right", gapSide: "right" });
    }
    return shuffle(conditions);
}

/* =========================
ГЕНЕРАЦИЯ УСЛОВИЙ ДЛЯ БЛОКА 2
========================= */
function generateBlock2Conditions() {
    const conditions = [];
    for (let i = 0; i < 4; i++) {
        conditions.push({ gapSide: "left" });
        conditions.push({ gapSide: "right" });
    }
    return shuffle(conditions);
}

/* =========================
ВВОД ID — ЗДЕСЬ УСТАНАВЛИВАЕМ SEED, ДЕЛАЕМ SHUFFLE И ДОБАВЛЯЕМ ТРИАЛЫ
========================= */
const idTrial = {
    type: jsPsychSurveyHtmlForm,
    html: `
        <div style="display:flex; flex-direction:column; align-items:center; gap:20px; padding:40px;">
            <h2>Введите ID, который вам сообщил экспериментатор</h2>
            <input type="text" name="participant_id" required placeholder="id_1"
                   style="font-size:24px; padding:10px 20px; border:2px solid #333; border-radius:8px; text-align:center; width:300px;">
        </div>
    `,
    button_label: "Начать",
    on_finish: function (data) {
        const rawId = data.response.participant_id;
        const match = rawId.match(/\d+/);
        if (!match) {
            alert("ID должен содержать число! Например: id_1");
            location.reload();
            return;
        }
        const seed = parseInt(match[0]);

        jsPsych.randomization.setSeed(seed);

        window.PARTICIPANT_ID = rawId;
        window.SEED = seed;
        window.trainingSearchCorrect = 0;
        window.trainingFamiliarCorrect = 0;

        jsPsych.data.addProperties({
            subject_id: rawId
        });

        const shuffledIds = jsPsych.randomization.shuffle([...ALL_OBJECT_IDS]);
        let idx = 0;
        const STIM_TEMPLATES = shuffledIds.slice(idx, idx += CONFIG.stim_templates_count);
        const WITHOUT_SEARCH = shuffledIds.slice(idx, idx += CONFIG.without_search_count);
        const NEW_STIMS = shuffledIds.slice(idx, idx += CONFIG.new_stims_count);
        const NEWEST_STIMS = shuffledIds.slice(idx, idx += CONFIG.newest_stims_count);
        const DISTRACTORS = shuffledIds.slice(idx);

        const TRAINING_TARGET = DISTRACTORS[0];
        const DISTRACTORS_WITHOUT_TRAINING = DISTRACTORS.slice(1);

        console.log("SEED:", seed);
        console.log("TRAINING_TARGET:", TRAINING_TARGET);
        console.log("STIM_TEMPLATES:", STIM_TEMPLATES);
        console.log("WITHOUT_SEARCH:", WITHOUT_SEARCH);

        const PRELOAD_IMAGES = [
            CONFIG.paths.ring_left, CONFIG.paths.ring_right,
            ...STIM_TEMPLATES.map(objPath), ...WITHOUT_SEARCH.map(objPath),
            ...NEW_STIMS.map(objPath), ...NEWEST_STIMS.map(objPath),
            ...DISTRACTORS_WITHOUT_TRAINING.map(objPath),
            objPath(TRAINING_TARGET)
        ];

        // === ДОБАВЛЯЕМ ВСЕ ОСТАЛЬНЫЕ ТРИАЛЫ ===
        jsPsych.addNodeToEndOfTimeline({
            timeline: [
                { type: jsPsychPreload, images: PRELOAD_IMAGES },
                {
                    type: jsPsychHtmlKeyboardResponse,
                    stimulus: `<div class="screen-wrap"><div class="instr">
                        <h1>Инструкция</h1>
                        <p>В этом задании вам будут показывать необычные предметы.</p>
                        <p>Нужно будет найти определённый предмет среди других. После нахождения целевого объекта вам нужно ответить про разрыв кольца вокруг этого предмета.</p>
                        <p>Нажимайте <strong>${getKeyName(CONFIG.left_key)}</strong>, если разрыв слева, и <strong>${getKeyName(CONFIG.right_key)}</strong>, если разрыв справа.</p>
                        <div class="small-note">Нажмите любую клавишу, чтобы продолжить.</div>
                    </div></div>`,
                    choices: "ALL_KEYS"
                },
                // Тренировка поиска
                {
                    type: jsPsychHtmlKeyboardResponse,
                    stimulus: `<div class="screen-wrap"><div class="instr">
                        <h2>Тренировка: Поиск</h2>
                        <p>Сейчас будет тренировка. Вам нужно найти предмет среди 8 объектов.</p>
                        <p>Тренировка продлится до 5 правильных ответов.</p>
                        <div class="small-note">Нажмите любую клавишу.</div>
                    </div></div>`,
                    choices: "ALL_KEYS"
                },
                {
                    timeline: [
                        makeBlankTrial(CONFIG.blank_ms, { block: "training_search" }),
                        makeCueTrial(TRAINING_TARGET, true, { block: "training_search" }),
                        makeFixationTrial({ block: "training_search" }),
                        makeBlankTrial(CONFIG.blank_after_fixation_ms, { block: "training_search" }),
                        {
                            type: jsPsychHtmlKeyboardResponse,
                            stimulus: function() {
                                const gapSide = sampleOne(["left", "right"]);
                                const distractorIds = pickDistractors(TRAINING_TARGET, DISTRACTORS_WITHOUT_TRAINING, 7);
                                window.currentTrainingGapSide = gapSide;
                                return searchArrayHTML({ targetId: TRAINING_TARGET, distractorIds, gapSideTarget: gapSide, setSize: 8 });
                            },
                            choices: [CONFIG.left_key, CONFIG.right_key],
                            trial_duration: CONFIG.search_timeout_ms,
                            response_ends_trial: true,
                            data: {
                                trial_kind: "training_search",
                                block: "training_search",
                                target_id: TRAINING_TARGET,
                                correct_gap: function() { return window.currentTrainingGapSide; },
                                participant_id: window.PARTICIPANT_ID, seed: window.SEED, part: 1,
                            },
                            on_finish: function(data) {
                                const correctKey = getCorrectKey(window.currentTrainingGapSide);
                                if (data.response === null) {
                                    data.correct = 0;
                                } else {
                                    data.correct = (data.response.toLowerCase() === correctKey.toLowerCase()) ? 1 : 0;
                                }
                                if (data.correct) {
                                    window.trainingSearchCorrect++;
                                }
                            },
                        },
                        makeFeedbackTrial(),
                    ],
                    loop_function: function() {
                        return window.trainingSearchCorrect < 5;
                    }
                },
                {
                    type: jsPsychHtmlKeyboardResponse,
                    stimulus: `<div class="screen-wrap"><div class="instr">
                        <h2>Тренировка завершена!</h2>
                        <p>Теперь начинается основное задание. Обратной связи больше не будет.</p>
                        <p>Готовы приступить к основному блоку?</p>
                        <div class="small-note">Нажмите любую клавишу, чтобы продолжить.</div>
                    </div></div>`,
                    choices: "ALL_KEYS"
                },
                {
                    type: jsPsychHtmlKeyboardResponse,
                    stimulus: `<div class="screen-wrap"><div class="instr">
                        <h2>Блок 1: Поиск</h2>
                        <p>Запоминайте предметы и ищите их среди остальных объектов.</p>
                        <div class="small-note">Нажмите любую клавишу.</div>
                    </div></div>`,
                    choices: "ALL_KEYS"
                },
            ]
        });

        // === БЛОК 1: stim_templates_search ===
        STIM_TEMPLATES.forEach((targetId) => {
            const conditions = generateBlock1Conditions();
            let correctCount = 0;
            let condIndex = 0;

            jsPsych.addNodeToEndOfTimeline({
                timeline: [
                    {
                        timeline: [
                            makeBlankTrial(CONFIG.blank_ms, { block: "stim_templates_search" }),
                            makeCueTrial(targetId, false, { block: "stim_templates_search" }),
                            makeFixationTrial({ block: "stim_templates_search" }),
                            makeBlankTrial(CONFIG.blank_after_fixation_ms, { block: "stim_templates_search" }),
                            {
                                type: jsPsychHtmlKeyboardResponse,
                                stimulus: function() {
                                    const cond = conditions[condIndex % conditions.length];
                                    window.currentBlock1Cond = cond;
                                    const distractorIds = pickDistractors(targetId, DISTRACTORS_WITHOUT_TRAINING, 7);
                                    return searchArrayHTML({ 
                                        targetId, 
                                        distractorIds, 
                                        gapSideTarget: cond.gapSide, 
                                        setSize: 8
                                    });
                                },
                                choices: [CONFIG.left_key, CONFIG.right_key],
                                trial_duration: CONFIG.search_timeout_ms,
                                response_ends_trial: true,
                                data: {
                                    trial_kind: "search",
                                    block: "stim_templates_search",
                                    condition: "stim_templates",
                                    target_id: targetId,
                                    correct_gap: function() { return window.currentBlock1Cond.gapSide; },
                                    participant_id: window.PARTICIPANT_ID, seed: window.SEED, part: 1,
                                },
                                on_finish: function(data) {
                                    const cond = window.currentBlock1Cond;
                                    const correctKey = getCorrectKey(cond.gapSide);
                                    if (data.response === null) {
                                        data.correct = 0;
                                    } else {
                                        data.correct = (data.response.toLowerCase() === correctKey.toLowerCase()) ? 1 : 0;
                                    }
                                    if (data.correct) {
                                        correctCount++;
                                        condIndex++;
                                    }
                                },
                            },
                        ],
                        loop_function: function() {
                            return correctCount < CONFIG.correct_per_item;
                        }
                    }
                ]
            });
        });

        // === ТРЕНИРОВКА WITHOUT_SEARCH ===
        jsPsych.addNodeToEndOfTimeline({
            timeline: [
                {
                    type: jsPsychHtmlKeyboardResponse,
                    stimulus: `<div class="screen-wrap"><div class="instr">
                        <h2>Тренировка: Знакомство</h2>
                        <p>Сначала посмотрите на предмет, затем вокруг него появится кольцо. Укажите, где разрыв.</p>
                        <p>Тренировка продлится до 5 правильных ответов.</p>
                        <div class="small-note">Нажмите любую клавишу.</div>
                    </div></div>`,
                    choices: "ALL_KEYS"
                },
                {
                    timeline: [
                        makeBlankTrial(CONFIG.blank_ms, { block: "training_familiar" }),
                        makeStudyTrial(TRAINING_TARGET, { block: "training_familiar" }),
                        makeFixationTrial({ block: "training_familiar" }),
                        makeBlankTrial(CONFIG.blank_after_fixation_ms, { block: "training_familiar" }),
                        {
                            type: jsPsychHtmlKeyboardResponse,
                            stimulus: function() {
                                const gapSide = sampleOne(["left", "right"]);
                                window.currentTrainingFamiliarGapSide = gapSide;
                                return singleObjectWithRingHTML(objPath(TRAINING_TARGET), gapSide, true);
                            },
                            choices: [CONFIG.left_key, CONFIG.right_key],
                            trial_duration: CONFIG.familiar_timeout_ms,
                            response_ends_trial: true,
                            data: {
                                trial_kind: "training_familiar",
                                block: "training_familiar",
                                target_id: TRAINING_TARGET,
                                correct_gap: function() { return window.currentTrainingFamiliarGapSide; },
                                participant_id: window.PARTICIPANT_ID, seed: window.SEED, part: 1,
                            },
                            on_finish: function(data) {
                                const correctKey = getCorrectKey(window.currentTrainingFamiliarGapSide);
                                if (data.response === null) {
                                    data.correct = 0;
                                } else {
                                    data.correct = (data.response.toLowerCase() === correctKey.toLowerCase()) ? 1 : 0;
                                }
                                if (data.correct) {
                                    window.trainingFamiliarCorrect++;
                                }
                            },
                        },
                        makeFeedbackTrial(),
                    ],
                    loop_function: function() {
                        return window.trainingFamiliarCorrect < 5;
                    }
                },
                {
                    type: jsPsychHtmlKeyboardResponse,
                    stimulus: `<div class="screen-wrap"><div class="instr">
                        <h2>Тренировка завершена!</h2>
                        <p>Теперь начинается основное задание. Обратной связи больше не будет.</p>
                        <p>Готовы приступить к основному блоку?</p>
                        <div class="small-note">Нажмите любую клавишу, чтобы продолжить.</div>
                    </div></div>`,
                    choices: "ALL_KEYS"
                },
                {
                    type: jsPsychHtmlKeyboardResponse,
                    stimulus: `<div class="screen-wrap"><div class="instr">
                        <h2>Блок 2: Знакомство</h2>
                        <p>Сначала посмотрите на предмет, затем вокруг него появится кольцо. Укажите, где разрыв. Старайтесь не отводить взгляд от предмета!</p>
                        <div class="small-note">Нажмите любую клавишу.</div>
                    </div></div>`,
                    choices: "ALL_KEYS"
                },
            ]
        });

        // === БЛОК 2: without_search ===
        WITHOUT_SEARCH.forEach((targetId) => {
            const conditions = generateBlock2Conditions();
            let correctCount = 0;
            let condIndex = 0;

            jsPsych.addNodeToEndOfTimeline({
                timeline: [
                    {
                        timeline: [
                            makeBlankTrial(CONFIG.blank_ms, { block: "without_search" }),
                            makeStudyTrial(targetId, { block: "without_search" }),
                            makeFixationTrial({ block: "without_search" }),
                            makeBlankTrial(CONFIG.blank_after_fixation_ms, { block: "without_search" }),
                            {
                                type: jsPsychHtmlKeyboardResponse,
                                stimulus: function() {
                                    const cond = conditions[condIndex % conditions.length];
                                    window.currentBlock2Cond = cond;
                                    return singleObjectWithRingHTML(objPath(targetId), cond.gapSide, false);
                                },
                                choices: [CONFIG.left_key, CONFIG.right_key],
                                trial_duration: CONFIG.familiar_timeout_ms,
                                response_ends_trial: true,
                                data: {
                                    trial_kind: "familiar_single",
                                    block: "without_search",
                                    condition: "without_search",
                                    target_id: targetId,
                                    correct_gap: function() { return window.currentBlock2Cond.gapSide; },
                                    participant_id: window.PARTICIPANT_ID, seed: window.SEED, part: 1,
                                },
                                on_finish: function(data) {
                                    const cond = window.currentBlock2Cond;
                                    const correctKey = getCorrectKey(cond.gapSide);
                                    if (data.response === null) {
                                        data.correct = 0;
                                    } else {
                                        data.correct = (data.response.toLowerCase() === correctKey.toLowerCase()) ? 1 : 0;
                                    }
                                    if (data.correct) {
                                        correctCount++;
                                        condIndex++;
                                    }
                                },
                            },
                        ],
                        loop_function: function() {
                            return correctCount < CONFIG.correct_per_item;
                        }
                    }
                ]
            });
        });

        // === ФАЗА ПОИСКА (ТЕСТ) ===
        jsPsych.addNodeToEndOfTimeline({
            timeline: [
                {
                    type: jsPsychHtmlKeyboardResponse,
                    stimulus: `<div class="screen-wrap"><div class="instr">
                        <h2>Фаза поиска (Тест)</h2>
                        <p>Теперь вам вновь необходимо искать предметы. Нужно будет найти определённый предмет среди других. После нахождения целевого объекта вам нужно ответить про разрыв кольца вокруг этого предмета.</p>
                        <p>Нажимайте <strong>${getKeyName(CONFIG.left_key)}</strong>, если разрыв слева, и <strong>${getKeyName(CONFIG.right_key)}</strong>, если разрыв справа.</p>
                        <div class="small-note">Нажмите любую клавишу, чтобы продолжить.</div>
                    </div></div>`,
                    choices: "ALL_KEYS"
                },
            ]
        });

        const testPool = [...STIM_TEMPLATES, ...WITHOUT_SEARCH, ...NEW_STIMS];
        const shuffledTestPool = shuffle(testPool);

        shuffledTestPool.forEach((id) => {
            let cond = "new_stims";
            if (STIM_TEMPLATES.includes(id)) cond = "stim_templates";
            else if (WITHOUT_SEARCH.includes(id)) cond = "without_search";

            const setSize = sampleOne(CONFIG.set_sizes);
            const gapSide = sampleOne(["left", "right"]);

            jsPsych.addNodeToEndOfTimeline({
                timeline: [
                    makeBlankTrial(CONFIG.blank_ms, { block: "test_search" }),
                    makeCueTrial(id, false, { block: "test_search", condition: cond }),
                    makeFixationTrial({ block: "test_search" }),
                    makeBlankTrial(CONFIG.blank_after_fixation_ms, { block: "test_search" }),
                    makeSearchTrial({
                        targetId: id,
                        distractorPool: [...DISTRACTORS_WITHOUT_TRAINING, ...NEWEST_STIMS],
                        setSize: setSize,
                        block: "test_search",
                        condition: cond,
                        gapSide: gapSide
                    }),
                ]
            });
        });

        // Конец
        jsPsych.addNodeToEndOfTimeline({
            timeline: [
                {
                    type: jsPsychHtmlKeyboardResponse,
                    stimulus: `<div class="screen-wrap"><div class="instr">
                        <h2>Спасибо!</h2>
                        <p>Эксперимент завершён. Данные отправлены.</p>
                        <div class="small-note">Нажмите любую клавишу, чтобы увидеть таблицу данных.</div>
                    </div></div>`,
                    choices: "ALL_KEYS"
                },
            ]
        });
    },
};

/* =========================
СТАРТОВЫЙ ЭКРАН С ПОЛНЫМ ЭКРАНОМ
========================= */
function startExperiment() {
    document.getElementById('fullscreen-start').style.display = 'none';
    jsPsych.run(timeline);
}

function enterFullscreen() {
    const el = document.documentElement;
    const requestFullscreen = el.requestFullscreen 
        || el.webkitRequestFullscreen 
        || el.msRequestFullscreen;
    
    if (requestFullscreen) {
        requestFullscreen.call(el).then(() => {
            startExperiment();
        }).catch((err) => {
            console.warn("Fullscreen request failed:", err);
            startExperiment();
        });
    } else {
        startExperiment();
    }
}

document.getElementById('start-fullscreen-btn').addEventListener('click', enterFullscreen);

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const startScreen = document.getElementById('fullscreen-start');
        if (startScreen && startScreen.style.display !== 'none') {
            enterFullscreen();
        }
    }
});

/* =========================
TIMELINE (изначально только idTrial)
========================= */
const timeline = [idTrial];
