/* =========================
BASIC CONFIG
========================= */
const CONFIG = {
    left_key: "ArrowLeft",
    right_key: "ArrowRight",

    fixation_ms: 500,
    cue_ms: 900,
    delay_ms: 500,
    study_ms: 3000,
    search_timeout_ms: 5000,
    feedback_ms: 700,

    stim_px: 120,
    ring_px: 180,

    circle_radius: 360,
    circle_start_angle: -3 * Math.PI / 4,

    stim_templates_count: 8,
    without_search_count: 8,
    new_stims_count: 8,
    newest_stims_count: 8,

    repeats_per_item: 1,

    set_sizes: [4, 8, 12],

    paths: {
        objects: "./NOUN-2-600DPI/",
        ring_left: "./Lring_LEFT.png",
        ring_right: "./Lring_RIGHT.png",
    },
};

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
                // filename будет подставлен автоматически как {subject_id}.csv
            }
        }
    ],
    on_finish: function () {
        // DataPipe сам отправит данные. Просто показываем таблицу.
        jsPsych.data.displayData();
    },
});

/* =========================
ВВОД ID И SEED
========================= */
const idTrial = {
    type: jsPsychSurveyHtmlForm,
    html: `
        <div style="display:flex; flex-direction:column; align-items:center; gap:20px; padding:40px;">
            <h2>Введите ID испытуемого</h2>
            <p>Например: id_1, id_124, sub001</p>
            <input type="text" name="participant_id" required placeholder="id_1"
                   style="font-size:24px; padding:10px 20px; border:2px solid #333; border-radius:8px; text-align:center; width:300px;">
            <button type="submit"
                    style="font-size:20px; padding:10px 30px; background:#333; color:white; border:none; border-radius:8px; cursor:pointer;">
                Начать
            </button>
        </div>
    `,
    button_label: "Продолжить",
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

        // ВАЖНО: устанавливаем subject_id для DataPipe
        // DataPipe использует его как имя файла: {subject_id}.csv
        jsPsych.data.addProperties({
            subject_id: rawId
        });
    },
};

/* =========================
STIMULUS SELECTION
========================= */
const ALL_OBJECT_IDS = [
    2001, 2002, 2003, 2004, 2005, 2006, 2007, 2009, 2010, 2011, 2012, 2013,
    2014, 2015, 2016, 2017, 2018, 2019, 2021, 2022, 2023, 2025, 2026, 2027,
    2028, 2029, 2030, 2032, 2033, 2035, 2036, 2037, 2038, 2039, 2040, 2041,
    2042, 2044, 2045, 2046, 2047, 2048, 2049, 2050, 2051, 2052, 2053, 2054,
    2055, 2056, 2057, 2058, 2060, 2061, 2062, 2063, 2064
];

function objPath(id) { return `${CONFIG.paths.objects}${id}-600.jpg`; }

const shuffledIds = jsPsych.randomization.shuffle([...ALL_OBJECT_IDS]);
let idx = 0;
const STIM_TEMPLATES = shuffledIds.slice(idx, idx += CONFIG.stim_templates_count);
const WITHOUT_SEARCH = shuffledIds.slice(idx, idx += CONFIG.without_search_count);
const NEW_STIMS = shuffledIds.slice(idx, idx += CONFIG.new_stims_count);
const NEWEST_STIMS = shuffledIds.slice(idx, idx += CONFIG.newest_stims_count);
const DISTRACTORS = shuffledIds.slice(idx);

console.log("STIM_TEMPLATES:", STIM_TEMPLATES);
console.log("WITHOUT_SEARCH:", WITHOUT_SEARCH);
console.log("NEW_STIMS:", NEW_STIMS);
console.log("NEWEST_STIMS:", NEWEST_STIMS);
console.log("DISTRACTORS:", DISTRACTORS);

const PRELOAD_IMAGES = [
    CONFIG.paths.ring_left, CONFIG.paths.ring_right,
    ...STIM_TEMPLATES.map(objPath), ...WITHOUT_SEARCH.map(objPath),
    ...NEW_STIMS.map(objPath), ...NEWEST_STIMS.map(objPath),
    ...DISTRACTORS.map(objPath)
];

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

function createTrials(items, repeats) {
    const trials = [];
    items.forEach(id => {
        for (let i = 0; i < repeats; i++) {
            const side = sampleOne(["left", "right"]);
            trials.push({ id, side });
        }
    });
    return jsPsych.randomization.shuffle(trials);
}

/* =========================
POSITION GENERATION (СТРОГО ПО ОКРУЖНОСТИ)
========================= */
function generateSearchPositions({ nItems, arenaW = 1280, arenaH = 860 }) {
    const cx = arenaW / 2, cy = arenaH / 2;
    const radius = CONFIG.circle_radius;
    const angleStep = (Math.PI * 2) / nItems;

    let rotationOffset;
    if (nItems === 4) {
        rotationOffset = 0;
    } else {
        rotationOffset = Math.random() * angleStep;
    }

    let positions = [];
    for (let i = 0; i < nItems; i++) {
        const angle = CONFIG.circle_start_angle + rotationOffset + (angleStep * i);
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        positions.push({ x, y });
    }
    return positions;
}

/* =========================
HTML BUILDERS
========================= */
function fixationHTML() {
    return `<div class="screen-wrap"><div class="fixation">+</div></div>`;
}

function cueHTML(targetPath) {
    return `<div class="screen-wrap">
                <div class="cue-wrap">
                    <div class="cue-label">Найдите этот предмет</div>
                    <img class="cue-img" src="${targetPath}" style="width:${CONFIG.stim_px}px; height:${CONFIG.stim_px}px;">
                </div>
            </div>`;
}

function singleObjectWithRingHTML(targetPath, gapSide) {
    return `<div class="screen-wrap">
                <div class="cue-wrap">
                    <div class="cue-label">Где разрыв кольца?</div>
                    <div class="stim-container" style="position:relative; width:${CONFIG.ring_px}px; height:${CONFIG.ring_px}px; transform:none;">
                        <img class="stim-obj" src="${targetPath}" style="width:${CONFIG.stim_px}px; height:${CONFIG.stim_px}px;">
                        <img class="stim-ring" src="${getRingPath(gapSide)}" style="width:100%; height:100%;">
                    </div>
                </div>
            </div>`;
}

function searchArrayHTML({ targetId, distractorIds, gapSideTarget, setSize }) {
    const ids = shuffle([targetId, ...distractorIds]);
    const positions = generateSearchPositions({ nItems: setSize });
    let html = `<div class="arena-wrap"><div class="arena"><div class="arena-fix">+</div>`;
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
function makeFixationTrial(extraData = {}) {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: fixationHTML(),
        choices: "NO_KEYS",
        trial_duration: CONFIG.fixation_ms,
        data: { screen: "fixation", participant_id: window.PARTICIPANT_ID, seed: window.SEED, part: 1, ...extraData },
    };
}

function makeCueTrial(targetId, extraData = {}) {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: cueHTML(objPath(targetId)),
        choices: "NO_KEYS",
        trial_duration: CONFIG.cue_ms,
        data: { screen: "cue", target_id: targetId, participant_id: window.PARTICIPANT_ID, seed: window.SEED, part: 1, ...extraData },
    };
}

function makeDelayTrial(extraData = {}) {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: fixationHTML(),
        choices: "NO_KEYS",
        trial_duration: CONFIG.delay_ms,
        data: { screen: "delay", participant_id: window.PARTICIPANT_ID, seed: window.SEED, part: 1, ...extraData },
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
            console.log("Search trial:", { response: data.response, correctKey, correct: data.correct, timeout: data.timeout });
        },
    };
}

function makeFamiliarTrial({ targetId, block, condition, gapSide }) {
    const correctKey = getCorrectKey(gapSide);

    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: singleObjectWithRingHTML(objPath(targetId), gapSide),
        choices: [CONFIG.left_key, CONFIG.right_key],
        trial_duration: CONFIG.search_timeout_ms,
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
            console.log("Familiar trial:", { response: data.response, correctKey, correct: data.correct, timeout: data.timeout });
        },
    };
}

/* =========================
TIMELINE
========================= */
const timeline = [];

timeline.push(idTrial);
timeline.push({ type: jsPsychPreload, images: PRELOAD_IMAGES });

timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="screen-wrap"><div class="instr">
        <h1>Инструкция</h1>
        <p>В этом задании вам будут показывать необычные предметы.</p>
        <p>Иногда нужно будет найти определённый предмет среди других. После нахождения цели нужно ответить про разрыв кольца <strong>вокруг этого предмета</strong>.</p>
        <p>Нажимайте <strong>${getKeyName(CONFIG.left_key)}</strong>, если разрыв слева, и <strong>${getKeyName(CONFIG.right_key)}</strong>, если разрыв справа.</p>
        <div class="small-note">Нажмите любую клавишу, чтобы продолжить.</div>
    </div></div>`,
    choices: "ALL_KEYS"
});

// --- БЛОК 1: stim_templates с поиском ---
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="screen-wrap"><div class="instr">
        <h2>Блок 1: Поиск</h2>
        <p>Запоминайте предметы и ищите их в массиве из 8 объектов.</p>
        <div class="small-note">Нажмите любую клавишу.</div>
    </div></div>`,
    choices: "ALL_KEYS"
});

const block1Trials = createTrials(STIM_TEMPLATES, CONFIG.repeats_per_item);
block1Trials.forEach(({ id, side }) => {
    timeline.push(makeFixationTrial({ block: "stim_templates_search" }));
    timeline.push(makeCueTrial(id, { block: "stim_templates_search" }));
    timeline.push(makeDelayTrial({ block: "stim_templates_search" }));
    timeline.push(makeSearchTrial({
        targetId: id,
        distractorPool: DISTRACTORS,
        setSize: 8,
        block: "stim_templates_search",
        condition: "stim_templates",
        gapSide: side
    }));
    timeline.push(makeFeedbackTrial());
});

// --- БЛОК 2: without_search ---
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="screen-wrap"><div class="instr">
        <h2>Блок 2: Знакомство</h2>
        <p>Сначала посмотрите на предмет, затем вокруг него появится кольцо. Укажите, где разрыв.</p>
        <div class="small-note">Нажмите любую клавишу.</div>
    </div></div>`,
    choices: "ALL_KEYS"
});

const block2Trials = createTrials(WITHOUT_SEARCH, CONFIG.repeats_per_item);
block2Trials.forEach(({ id, side }) => {
    timeline.push(makeFixationTrial({ block: "without_search" }));
    timeline.push(makeStudyTrial(id, { block: "without_search" }));
    timeline.push(makeDelayTrial({ block: "without_search" }));
    timeline.push(makeFamiliarTrial({
        targetId: id,
        block: "without_search",
        condition: "without_search",
        gapSide: side
    }));
    timeline.push(makeFeedbackTrial());
});

// --- ФАЗА ПОИСКА (ТЕСТ) ---
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="screen-wrap"><div class="instr">
        <h2>Фаза поиска (Тест)</h2>
        <p>Теперь в качестве цели могут появляться разные предметы.</p>
        <p>В массиве может быть 4, 8 или 12 объектов.</p>
        <div class="small-note">Нажмите любую клавишу.</div>
    </div></div>`,
    choices: "ALL_KEYS"
});

const testPool = [...STIM_TEMPLATES, ...WITHOUT_SEARCH, ...NEW_STIMS];
const testTrials = createTrials(testPool, CONFIG.repeats_per_item);
testTrials.forEach(({ id, side }) => {
    let cond = "new_stims";
    if (STIM_TEMPLATES.includes(id)) cond = "stim_templates";
    else if (WITHOUT_SEARCH.includes(id)) cond = "without_search";

    const setSize = sampleOne(CONFIG.set_sizes);

    timeline.push(makeFixationTrial({ block: "test_search" }));
    timeline.push(makeCueTrial(id, { block: "test_search", condition: cond }));
    timeline.push(makeDelayTrial({ block: "test_search" }));
    timeline.push(makeSearchTrial({
        targetId: id,
        distractorPool: [...DISTRACTORS, ...NEWEST_STIMS],
        setSize: setSize,
        block: "test_search",
        condition: cond,
        gapSide: side
    }));
    timeline.push(makeFeedbackTrial());
});

// --- END ---
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="screen-wrap"><div class="instr">
        <h2>Спасибо!</h2>
        <p>Эксперимент завершён. Данные отправлены.</p>
        <div class="small-note">Нажмите любую клавишу, чтобы увидеть таблицу данных.</div>
    </div></div>`,
    choices: "ALL_KEYS"
});

jsPsych.run(timeline);
