const STORAGE_KEY = 'nuobellLogs';
const WEIGHTS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
const KNEE_OPTIONS = [
  ['good', 'Good'],
  ['mild_discomfort', 'Mild discomfort'],
  ['stop_pain', 'Stop / pain']
];
const EFFORT_OPTIONS = [
  ['easy', 'Easy'],
  ['two_to_three_reps_left', '2–3 reps left'],
  ['hard', 'Hard']
];
const EXERCISES = {
  'romanian-deadlift': {
    name: 'Romanian Deadlift',
    loadMode: 'required',
    implement: 'two_dumbbells',
    valueKey: 'reps',
    valueLabel: 'Reps'
  },
  'floor-press': {
    name: 'Floor Press',
    loadMode: 'required',
    implement: 'two_dumbbells',
    valueKey: 'reps',
    valueLabel: 'Reps'
  },
  'supported-one-arm-row': {
    name: 'Supported One-Arm Row',
    loadMode: 'required',
    implement: 'one_dumbbell',
    valueKey: 'repsPerSide',
    valueLabel: 'Reps per side'
  },
  'standing-calf-raise': {
    name: 'Standing Calf Raise',
    loadMode: 'optional',
    implement: 'one_dumbbell',
    valueKey: 'reps',
    valueLabel: 'Reps'
  },
  'bird-dog': {
    name: 'Bird Dog',
    loadMode: 'bodyweight',
    implement: null,
    valueKey: 'repsPerSide',
    valueLabel: 'Reps per side'
  },
  'glute-bridge': {
    name: 'Glute Bridge',
    loadMode: 'optional',
    implement: 'one_dumbbell',
    valueKey: 'reps',
    valueLabel: 'Reps'
  },
  'hammer-curl': {
    name: 'Hammer Curl',
    loadMode: 'required',
    implement: 'two_dumbbells',
    valueKey: 'reps',
    valueLabel: 'Reps'
  },
  'seated-overhead-press': {
    name: 'Seated Overhead Press',
    loadMode: 'required',
    implement: 'two_dumbbells',
    valueKey: 'reps',
    valueLabel: 'Reps'
  },
  'suitcase-hold': {
    name: 'Suitcase Hold',
    loadMode: 'required',
    implement: 'one_dumbbell',
    valueKey: 'secondsPerSide',
    valueLabel: 'Seconds per side'
  }
};
const STRENGTH_PLANS = {
  'monday-strength-a': {
    day: 'Monday',
    title: 'Strength A',
    exercises: [
      'romanian-deadlift',
      'floor-press',
      'supported-one-arm-row',
      'standing-calf-raise',
      'bird-dog'
    ],
    cooldownMinutes: 10
  },
  'friday-strength-b': {
    day: 'Friday',
    title: 'Strength B',
    exercises: [
      'glute-bridge',
      'floor-press',
      'supported-one-arm-row',
      'hammer-curl',
      'seated-overhead-press',
      'suitcase-hold'
    ],
    cooldownMinutes: 10
  }
};
const ROW_PLANS = {
  'Weeks 1–2': {
    main: '10 min steady',
    targetMinutes: 10,
    prescription: '5 min easy • 10 min steady • 5 min easy'
  },
  'Weeks 3–4': {
    main: '15 min steady',
    targetMinutes: 15,
    prescription: '5 min easy • 15 min steady • 5 min easy'
  },
  'Weeks 5–6': {
    main: '2 min moderate / 2 min easy × 5',
    targetMinutes: 20,
    prescription: '5 min easy • 2 min moderate / 2 min easy × 5 • 5 min cool-down'
  },
  'Weeks 7–8': {
    main: '3 min moderate-hard / 2 min easy × 4',
    targetMinutes: 20,
    prescription: '5 min easy • 3 min moderate-hard / 2 min easy × 4 • 5 min cool-down'
  }
};

const $ = selector => document.querySelector(selector);
let storage = { mode: 'empty', workouts: [], legacyRaw: null };
let pendingPlanId = null;
let pendingConfirmation = null;
let referenceOpener = null;

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function setNotice(message, isError = false) {
  const notice = $('#appNotice');
  notice.textContent = message;
  notice.classList.toggle('error', isError);
  notice.hidden = false;
}

function clearNotice() {
  $('#appNotice').hidden = true;
  $('#appNotice').textContent = '';
  $('#appNotice').classList.remove('error');
}

function kneeLabel(value) {
  return KNEE_OPTIONS.find(([key]) => key === value)?.[1] || '';
}

function effortLabel(value) {
  return EFFORT_OPTIONS.find(([key]) => key === value)?.[1] || '';
}

function optionMarkup(options, selected, placeholder = 'Choose') {
  return `<option value="">${placeholder}</option>${options.map(([value, label]) =>
    `<option value="${value}"${value === selected ? ' selected' : ''}>${label}</option>`
  ).join('')}`;
}

function numberOptions(selected) {
  return `<option value="">Choose</option>${WEIGHTS.map(weight =>
    `<option value="${weight}"${weight === selected ? ' selected' : ''}>${weight} lb</option>`
  ).join('')}`;
}

function validPositiveNumber(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0;
}

function validStoredPositiveNumber(value) {
  return Number.isInteger(value) && value > 0;
}

function validDraftNumber(value) {
  return typeof value === 'string' && (value === '' || /^-?\d+$/.test(value));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function isValidLoad(load, exercise) {
  if (!load || typeof load !== 'object') return false;
  if (exercise.loadMode === 'bodyweight') return load.kind === 'bodyweight';
  if (exercise.loadMode === 'required' && load.kind !== 'weighted') return false;
  if (load.kind === 'bodyweight') return exercise.loadMode === 'optional';
  return load.kind === 'weighted'
    && WEIGHTS.includes(load.weightLb)
    && load.implement === exercise.implement;
}

function isValidSet(set, exercise) {
  return set
    && Number.isInteger(set.setNumber)
    && set.setNumber > 0
    && isValidLoad(set.load, exercise)
    && validStoredPositiveNumber(set[exercise.valueKey]);
}

function isValidExerciseDraft(draft, exercise) {
  if (!draft || typeof draft !== 'object') return false;
  return Array.isArray(draft.sets)
    && draft.sets.length > 0
    && draft.sets.every(set =>
      set
      && ['bodyweight', 'weighted'].includes(set.loadKind)
      && (exercise.loadMode !== 'bodyweight' || set.loadKind === 'bodyweight')
      && (exercise.loadMode !== 'required' || set.loadKind === 'weighted')
      && (set.weightLb == null || WEIGHTS.includes(set.weightLb))
      && (set.value == null || Number.isInteger(set.value))
    )
    && (draft.kneeResponse === '' || KNEE_OPTIONS.some(([key]) => key === draft.kneeResponse))
    && (draft.effort === '' || EFFORT_OPTIONS.some(([key]) => key === draft.effort))
    && typeof draft.notes === 'string'
    && typeof (draft.skipReason || '') === 'string'
    && (draft.skipReason || '').length <= 120;
}

function isValidStep(step) {
  if (!step || !['completed', 'skipped', 'not_started'].includes(step.status)) return false;
  if (step.kind === 'warmup' || step.kind === 'cooldown') {
    if (step.activity !== 'row') return false;
    if (step.entryDraft
      && (!validDraftNumber(step.entryDraft.actualMinutes)
        || (step.entryDraft.kneeResponse !== ''
          && !KNEE_OPTIONS.some(([key]) => key === step.entryDraft.kneeResponse)))) return false;
    if (step.status === 'completed') {
      return validStoredPositiveNumber(step.actualMinutes)
        && KNEE_OPTIONS.some(([key]) => key === step.kneeResponse);
    }
    if (step.status === 'not_started') {
      return step.actualMinutes === null && step.kneeResponse === null;
    }
    return (step.actualMinutes == null || (Number.isInteger(step.actualMinutes) && step.actualMinutes >= 0))
      && (step.kneeResponse == null || KNEE_OPTIONS.some(([key]) => key === step.kneeResponse));
  }
  if (step.kind === 'exercise') {
    const exercise = EXERCISES[step.exerciseId];
    if (!exercise || !Array.isArray(step.sets)) return false;
    if (step.entryDraft && !isValidExerciseDraft(step.entryDraft, exercise)) return false;
    if (step.status === 'completed') {
      return step.sets.length > 0
        && step.sets.every((set, index) => isValidSet(set, exercise) && set.setNumber === index + 1)
        && KNEE_OPTIONS.some(([key]) => key === step.kneeResponse)
        && EFFORT_OPTIONS.some(([key]) => key === step.effort);
    }
    return step.sets.length === 0
      && (step.skipReason == null || (typeof step.skipReason === 'string' && step.skipReason.length <= 120));
  }
  if (step.kind === 'row') {
    if (step.entryDraft
      && (!validDraftNumber(step.entryDraft.minutes)
        || (step.entryDraft.distance !== '' && !validDraftNumber(step.entryDraft.distance))
        || (step.entryDraft.spm !== ''
          && !(Number.isInteger(Number(step.entryDraft.spm))
            && Number(step.entryDraft.spm) >= 16
            && Number(step.entryDraft.spm) <= 30))
        || (step.entryDraft.kneeResponse !== ''
          && !KNEE_OPTIONS.some(([key]) => key === step.entryDraft.kneeResponse))
        || typeof step.entryDraft.notes !== 'string')) return false;
    return step.status === 'completed'
      ? validStoredPositiveNumber(step.minutes)
        && KNEE_OPTIONS.some(([key]) => key === step.kneeResponse)
        && (step.distance === null || (Number.isInteger(step.distance) && step.distance >= 0))
        && (step.spm === null || (Number.isInteger(step.spm) && step.spm >= 16 && step.spm <= 30))
      : step.status === 'not_started';
  }
  if (step.kind === 'optional') {
    return step.status === 'completed'
      && typeof step.activity === 'string'
      && Number.isInteger(step.minutes)
      && step.minutes >= 0;
  }
  return false;
}

function validateEnvelope(value) {
  if (!value || value.version !== 2 || !Array.isArray(value.workouts)) return false;
  const active = value.workouts.filter(workout => workout?.status === 'in_progress');
  const ids = value.workouts.map(workout => workout?.id);
  if (active.length > 1 || new Set(ids).size !== ids.length) return false;
  return value.workouts.every(workout => {
    if (!workout
      || typeof workout.id !== 'string'
      || workout.id.length === 0
      || typeof workout.day !== 'string'
      || typeof workout.title !== 'string'
      || !['strength', 'row', 'optional'].includes(workout.type)
      || !['in_progress', 'completed'].includes(workout.status)
      || typeof workout.startedAt !== 'string'
      || Number.isNaN(Date.parse(workout.startedAt))
      || (workout.completedAt !== null
        && (typeof workout.completedAt !== 'string' || Number.isNaN(Date.parse(workout.completedAt))))
      || Array.isArray(workout.steps) === false
      || !Number.isInteger(workout.currentStepIndex)
      || workout.currentStepIndex < 0
      || workout.currentStepIndex > workout.steps.length
      || !workout.steps.every(isValidStep)
      || (workout.status === 'completed'
        && (workout.completedAt === null
          || workout.currentStepIndex !== workout.steps.length
          || workout.steps.some(step => step.status === 'not_started')))
      || (workout.status === 'in_progress' && workout.completedAt !== null)) return false;
    if (workout.type === 'strength') {
      const plan = STRENGTH_PLANS[workout.planId];
      return plan
        && workout.day === plan.day
        && workout.title === plan.title
        && workout.steps.length === plan.exercises.length + 2
        && workout.steps[0].id === 'warm-up'
        && workout.steps[0].kind === 'warmup'
        && workout.steps[0].targetMinutes === 5
        && workout.steps.slice(1, -1).every((step, index) =>
          step.kind === 'exercise' && step.exerciseId === plan.exercises[index]
        )
        && workout.steps[workout.steps.length - 1].id === 'cool-down'
        && workout.steps[workout.steps.length - 1].targetMinutes === plan.cooldownMinutes
        && workout.steps[workout.steps.length - 1].kind === 'cooldown';
    }
    if (workout.type === 'row') {
      const plan = ROW_PLANS[workout.week];
      return workout.planId === 'wednesday-row'
        && workout.day === 'Wednesday'
        && workout.title === 'Rower'
        && plan
        && workout.prescription === plan.prescription
        && workout.steps.length === 3
        && workout.steps[0].id === 'warm-up'
        && workout.steps[0].kind === 'warmup'
        && workout.steps[0].targetMinutes === 5
        && workout.steps[1].id === 'main-row'
        && workout.steps[1].kind === 'row'
        && workout.steps[1].targetMinutes === plan.targetMinutes
        && workout.steps[1].prescription === plan.main
        && workout.steps[2].id === 'cool-down'
        && workout.steps[2].kind === 'cooldown';
    }
    return workout.planId === 'saturday-optional'
      && workout.day === 'Saturday'
      && workout.status === 'completed'
      && workout.steps.length === 1
      && workout.steps[0].kind === 'optional'
      && workout.steps[0].status === 'completed';
  });
}

function loadStorage() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    storage.mode = 'invalid';
    setNotice(`Could not read workout storage: ${error.message}`, true);
    return;
  }
  if (raw === null) {
    storage = { mode: 'empty', workouts: [], legacyRaw: null };
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    storage.mode = 'invalid';
    setNotice(`Workout storage contains invalid JSON and was left unchanged: ${error.message}`, true);
    return;
  }
  if (Array.isArray(parsed)) {
    storage = { mode: 'legacy', workouts: [], legacyRaw: raw };
    return;
  }
  if (!validateEnvelope(parsed)) {
    storage.mode = 'invalid';
    setNotice('Workout storage is not a valid Version 2 envelope and was left unchanged.', true);
    return;
  }
  storage = { mode: 'v2', workouts: parsed.workouts, legacyRaw: null };
}

function updateStorageNotice() {
  $('#legacyNotice').hidden = storage.mode !== 'legacy';
  if (storage.mode === 'invalid' && $('#appNotice').hidden) {
    setNotice('Workout data could not be safely read. No records have been changed.', true);
  }
}

function saveEnvelope(workouts, replacingLegacy = false) {
  if (storage.mode === 'invalid' || (storage.mode === 'legacy' && !replacingLegacy)) {
    setNotice('Workout data was not changed because its current format must be resolved first.', true);
    return false;
  }
  const envelope = { version: 2, workouts };
  if (!validateEnvelope(envelope)) {
    setNotice('The workout change was not saved because it failed Version 2 data validation.', true);
    return false;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch (error) {
    setNotice(`Could not save workout data: ${error.message}`, true);
    return false;
  }
  storage = { mode: 'v2', workouts, legacyRaw: null };
  updateStorageNotice();
  renderActiveBanner();
  return true;
}

function showConfirmation(title, message, actionLabel, action) {
  $('#confirmTitle').textContent = title;
  $('#confirmMessage').textContent = message;
  $('#confirmAction').textContent = actionLabel;
  pendingConfirmation = action;
  $('#confirmDialog').hidden = false;
  $('#confirmAction').focus();
}

function resolveConfirmation(confirmed) {
  $('#confirmDialog').hidden = true;
  const action = pendingConfirmation;
  pendingConfirmation = null;
  if (confirmed && action) action();
  if (!confirmed) pendingPlanId = null;
}

function prepareVersion2Storage(onReady) {
  if (storage.mode === 'invalid') {
    setNotice('Workout storage could not be read safely. No data was changed.', true);
    return false;
  }
  if (storage.mode !== 'legacy') return true;
  showConfirmation(
    'Replace legacy workout data?',
    'Legacy records are still unchanged. Export legacy JSON using the visible export button before continuing if you want a backup. Replacing the data cannot be undone.',
    'Replace legacy data',
    () => {
      if (saveEnvelope([], true) && onReady) onReady();
    }
  );
  return false;
}

function activeWorkout(workouts = storage.workouts) {
  return workouts.find(workout => workout.status === 'in_progress') || null;
}

function updateActiveWorkout(mutator) {
  if (storage.mode !== 'v2') {
    setNotice('Start using Version 2 storage before changing a workout.', true);
    return false;
  }
  const workouts = JSON.parse(JSON.stringify(storage.workouts));
  const workout = activeWorkout(workouts);
  if (!workout) {
    setNotice('There is no active workout to update.', true);
    return false;
  }
  mutator(workout, workouts);
  return saveEnvelope(workouts);
}

function previousExercise(exerciseId) {
  return storage.workouts
    .filter(workout => workout.type === 'strength' && workout.status === 'completed')
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
    .map(workout => ({
      workout,
      step: workout.steps.find(item =>
        item.kind === 'exercise'
        && item.exerciseId === exerciseId
        && item.status === 'completed'
        && item.sets.length > 0
      )
    }))
    .find(item => item.step) || null;
}

function defaultLoad(exercise, previous) {
  const previousLoad = previous?.step.sets[0]?.load;
  if (exercise.loadMode === 'bodyweight') return { kind: 'bodyweight' };
  if (exercise.loadMode === 'optional' && previousLoad?.kind === 'bodyweight') {
    return { kind: 'bodyweight' };
  }
  const weightLb = WEIGHTS.includes(previousLoad?.weightLb) ? previousLoad.weightLb : 5;
  return { kind: 'weighted', weightLb, implement: exercise.implement };
}

function makeExerciseDraft(exerciseId) {
  const exercise = EXERCISES[exerciseId];
  const previous = previousExercise(exerciseId);
  const setCount = previous ? previous.step.sets.length : 3;
  const load = defaultLoad(exercise, previous);
  return {
    sets: Array.from({ length: setCount }, () => ({
      loadKind: load.kind,
      weightLb: load.weightLb ?? null,
      value: null
    })),
    kneeResponse: 'good',
    effort: 'two_to_three_reps_left',
    notes: ''
  };
}

function newExerciseStep(exerciseId) {
  return {
    id: exerciseId,
    kind: 'exercise',
    exerciseId,
    status: 'not_started',
    sets: [],
    kneeResponse: null,
    effort: null,
    notes: null,
    entryDraft: makeExerciseDraft(exerciseId)
  };
}

function exerciseDraftForStep(step) {
  if (step.entryDraft) return step.entryDraft;
  if (step.status === 'completed') {
    const exercise = EXERCISES[step.exerciseId];
    return {
      sets: step.sets.map(set => ({
        loadKind: set.load.kind,
        weightLb: set.load.weightLb ?? null,
        value: set[exercise.valueKey]
      })),
      kneeResponse: step.kneeResponse,
      effort: step.effort,
      notes: step.notes || '',
      skipReason: step.skipReason || ''
    };
  }
  return {
    ...makeExerciseDraft(step.exerciseId),
    skipReason: step.skipReason || ''
  };
}

function makeStrengthWorkout(planId) {
  const plan = STRENGTH_PLANS[planId];
  const steps = [
    {
      id: 'warm-up',
      kind: 'warmup',
      activity: 'row',
      targetMinutes: 5,
      actualMinutes: null,
      status: 'not_started',
      kneeResponse: null,
      entryDraft: { actualMinutes: '', kneeResponse: 'good' }
    },
    ...plan.exercises.map(newExerciseStep),
    {
      id: 'cool-down',
      kind: 'cooldown',
      activity: 'row',
      targetMinutes: plan.cooldownMinutes,
      actualMinutes: null,
      status: 'not_started',
      kneeResponse: null,
      entryDraft: { actualMinutes: '', kneeResponse: 'good' }
    }
  ];
  return {
    id: makeId(),
    type: 'strength',
    planId,
    title: plan.title,
    day: plan.day,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    completedAt: null,
    currentStepIndex: 0,
    steps
  };
}

function makeRowWorkout(week) {
  const plan = ROW_PLANS[week];
  return {
    id: makeId(),
    type: 'row',
    planId: 'wednesday-row',
    title: 'Rower',
    day: 'Wednesday',
    week,
    prescription: plan.prescription,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    completedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'warm-up',
        kind: 'warmup',
        activity: 'row',
        targetMinutes: 5,
        actualMinutes: null,
        status: 'not_started',
        kneeResponse: null,
        entryDraft: { actualMinutes: '', kneeResponse: 'good' }
      },
      {
        id: 'main-row',
        kind: 'row',
        activity: 'row',
        targetMinutes: plan.targetMinutes,
        prescription: plan.main,
        status: 'not_started',
        minutes: null,
        distance: '',
        spm: null,
        kneeResponse: null,
        notes: null,
        entryDraft: {
          minutes: String(plan.targetMinutes),
          distance: '',
          spm: '',
          kneeResponse: 'good',
          notes: ''
        }
      },
      {
        id: 'cool-down',
        kind: 'cooldown',
        activity: 'row',
        targetMinutes: 5,
        actualMinutes: null,
        status: 'not_started',
        kneeResponse: null,
        entryDraft: { actualMinutes: '', kneeResponse: 'good' }
      }
    ]
  };
}

function createWorkout(planId) {
  const start = () => {
    const workout = planId === 'wednesday-row'
      ? makeRowWorkout($('#rw').value)
      : makeStrengthWorkout(planId);
    if (saveEnvelope([...storage.workouts, workout])) tab('Workout');
  };
  if (prepareVersion2Storage(start)) start();
}

function startWorkout(planId) {
  if (!STRENGTH_PLANS[planId] && planId !== 'wednesday-row') {
    setNotice('That workout plan is not available.', true);
    return;
  }
  const current = activeWorkout();
  if (!current) {
    createWorkout(planId);
    return;
  }
  pendingPlanId = planId;
  $('#workoutChoiceDescription').textContent =
    `${current.day} · ${current.title} is still in progress. Resume it, discard it and start the selected workout, or cancel.`;
  $('#workoutChoice').hidden = false;
  $('#choiceResume').focus();
}

function resumeWorkout() {
  $('#workoutChoice').hidden = true;
  pendingPlanId = null;
  tab('Workout');
}

function discardAndStart() {
  const current = activeWorkout();
  if (!current || !pendingPlanId) {
    $('#workoutChoice').hidden = true;
    return;
  }
  $('#workoutChoice').hidden = true;
  showConfirmation(
    'Discard active workout?',
    `Discard the in-progress ${current.title} workout and all its saved steps? This cannot be undone.`,
    'Discard and start selected',
    replaceActiveWorkout
  );
}

function replaceActiveWorkout() {
  const current = activeWorkout();
  if (!current || !pendingPlanId) return;
  const planId = pendingPlanId;
  pendingPlanId = null;
  const replacement = planId === 'wednesday-row'
    ? makeRowWorkout($('#rw').value)
    : makeStrengthWorkout(planId);
  const workouts = storage.workouts.filter(workout => workout.id !== current.id);
  if (saveEnvelope([...workouts, replacement])) tab('Workout');
}

function workoutTitle(workout) {
  return `${workout.day} · ${workout.title}`;
}

function renderActiveBanner() {
  const workout = activeWorkout();
  const banner = $('#activeWorkoutBanner');
  if (!workout || $('#Workout').classList.contains('active')) {
    banner.hidden = true;
    return;
  }
  $('#activeWorkoutLabel').textContent = `Active draft: ${workoutTitle(workout)}`;
  banner.hidden = false;
}

function tab(name) {
  document.querySelectorAll('main > section').forEach(section =>
    section.classList.toggle('active', section.id === name)
  );
  document.querySelectorAll('nav button').forEach(button =>
    button.classList.toggle('active', button.dataset.t === name)
  );
  document.body.classList.toggle('workout-active', name === 'Workout');
  if (name === 'Workout') renderWorkout();
  if (name === 'History') renderHistory();
  renderActiveBanner();
  scrollTo(0, 0);
}

function rowPlan() {
  $('#rp').textContent = ROW_PLANS[$('#rw').value].prescription;
}

function progressMarkup(workout) {
  const total = workout.steps.length;
  const complete = workout.steps.filter(step => step.status !== 'not_started').length;
  const current = Math.min(workout.currentStepIndex + 1, total);
  const title = workout.title;
  const label = workout.currentStepIndex >= total
    ? `${title} • All ${total} steps`
    : `${title} • Step ${current} of ${total}`;
  const width = `${Math.round((complete / total) * 100)}%`;
  return `<p class="progress-label">${escapeHTML(label)}</p><div class="progress-track" aria-label="${complete} of ${total} steps complete"><span style="width:${width}"></span></div>`;
}

function statusMarkup(status) {
  if (status === 'completed') return '<p class="step-status">Completed</p>';
  if (status === 'skipped') return '<p class="step-status skipped">Skipped</p>';
  return '';
}

function renderWarmupStep(workout, step) {
  const draft = step.entryDraft || {
    actualMinutes: step.actualMinutes ?? '',
    kneeResponse: step.kneeResponse || 'good'
  };
  const isCoolDown = step.kind === 'cooldown';
  const name = isCoolDown ? 'Cool-down' : 'Warm-up';
  return `<article class="card step-card">
    ${statusMarkup(step.status)}
    <h3>${name}: ${step.targetMinutes}-minute ${isCoolDown ? 'very easy' : 'easy'} row</h3>
    <p class="step-description">Target: ${step.targetMinutes} minutes</p>
    <label for="actualMinutes">Actual minutes</label>
    <input id="actualMinutes" data-draft-field="actualMinutes" type="number" min="0" step="1" inputmode="numeric" value="${escapeHTML(draft.actualMinutes ?? '')}">
    <label for="kneeResponse" class="field-spaced">Knee response</label>
    <select id="kneeResponse" data-draft-field="kneeResponse">${optionMarkup(KNEE_OPTIONS, draft.kneeResponse, 'Choose response')}</select>
    <div class="step-actions">
      <button type="button" class="primary-action" data-action="complete-warmup">COMPLETE</button>
      <button type="button" class="danger-action" data-action="skip-warmup">SKIP</button>
      <button type="button" class="secondary-action" data-action="previous-step" ${workout.currentStepIndex === 0 ? 'disabled' : ''}>Previous</button>
    </div>
  </article>`;
}

function previousPerformanceMarkup(exerciseId) {
  const previous = previousExercise(exerciseId);
  if (!previous) return '';
  const config = EXERCISES[exerciseId];
  const sets = previous.step.sets.map(set => {
    const load = set.load.kind === 'bodyweight'
      ? 'Bodyweight'
      : `${set.load.weightLb} lb${set.load.implement === 'two_dumbbells' ? ' each' : ''}`;
    return `${load} · ${set[config.valueKey]}${config.valueKey === 'secondsPerSide' ? ' sec/side' : config.valueKey === 'repsPerSide' ? '/side' : ''}`;
  });
  return `<div class="previous-performance"><strong>Last workout:</strong> ${sets.join(' • ')}</div>`;
}

function setDraftMarkup(exerciseId, exercise, step) {
  const draft = exerciseDraftForStep(step);
  const sourceSets = draft.sets;
  const savedSetNumbers = new Set(step.status === 'completed' ? step.sets.map(set => set.setNumber) : []);
  return sourceSets.map((set, index) => {
    const loadSelector = exercise.loadMode === 'optional'
      ? `<div class="load-kind">
          <label for="loadKind-${index}">Load</label>
          <select id="loadKind-${index}" data-set-load-kind="${index}">
            <option value="bodyweight"${set.loadKind === 'bodyweight' ? ' selected' : ''}>Bodyweight</option>
            <option value="weighted"${set.loadKind === 'weighted' ? ' selected' : ''}>Added load</option>
          </select>
        </div>`
      : '';
    const weightControl = exercise.loadMode === 'bodyweight'
      ? '<div><label>Load</label><div class="bodyweight-label">Bodyweight</div></div>'
      : `<div class="weight-control"${set.loadKind === 'bodyweight' ? ' hidden' : ''}>
          <label for="weight-${index}">${exercise.implement === 'two_dumbbells' ? 'Weight each' : 'Weight'}</label>
          <select id="weight-${index}" data-set-weight="${index}">${numberOptions(set.weightLb)}</select>
        </div>`;
    const valueLabel = exercise.valueLabel;
    return `<div class="set-entry${savedSetNumbers.has(index + 1) ? ' is-complete' : ''}" data-set-entry="${index}">
      <h4>Set ${index + 1}${savedSetNumbers.has(index + 1) ? ' · Saved' : ''}</h4>
      <div class="set-fields">
        ${loadSelector}
        ${weightControl}
        <div>
          <label for="set-value-${index}">${valueLabel}</label>
          <input id="set-value-${index}" data-set-value="${index}" type="number" min="1" step="1" inputmode="numeric" value="${escapeHTML(set.value ?? '')}">
        </div>
      </div>
      ${index > 0 ? `<div class="set-controls"><button type="button" class="small-button" data-action="remove-set" data-set-index="${index}">Remove set</button></div>` : ''}
    </div>`;
  }).join('');
}

function renderExerciseStep(workout, step) {
  const exercise = EXERCISES[step.exerciseId];
  const draft = exerciseDraftForStep(step);
  const kneeResponse = step.status === 'completed' ? step.kneeResponse : draft.kneeResponse;
  const effort = step.status === 'completed' ? step.effort : draft.effort;
  const notes = step.status === 'completed' ? step.notes : draft.notes;
  return `<article class="card step-card">
    ${statusMarkup(step.status)}
    <h3>${exercise.name}</h3>
    <button type="button" class="reference-action" data-action="open-exercise-form" data-exercise-id="${step.exerciseId}">FORM / ILLUSTRATION</button>
    ${previousPerformanceMarkup(step.exerciseId)}
    <p class="step-description">${exercise.valueLabel}${exercise.implement === 'two_dumbbells' ? ' · weight per dumbbell' : exercise.implement === 'one_dumbbell' ? ' · one dumbbell' : ''}</p>
    <div id="setEntries">${setDraftMarkup(step.exerciseId, exercise, step)}</div>
    <button type="button" class="add-set" data-action="add-set">+ ADD SET</button>
    <div class="g2">
      <div>
        <label for="exerciseKnee">Knee response</label>
        <select id="exerciseKnee" data-draft-field="kneeResponse">${optionMarkup(KNEE_OPTIONS, kneeResponse, 'Choose response')}</select>
      </div>
      <div>
        <label for="exerciseEffort">Effort</label>
        <select id="exerciseEffort" data-draft-field="effort">${optionMarkup(EFFORT_OPTIONS, effort, 'Choose effort')}</select>
      </div>
    </div>
    <label for="exerciseNotes" class="field-spaced">Optional notes</label>
    <textarea id="exerciseNotes" class="exercise-notes" data-draft-field="notes">${escapeHTML(notes || '')}</textarea>
    <label for="skipReason" class="field-spaced">Optional skip reason</label>
    <input id="skipReason" data-draft-field="skipReason" maxlength="120" value="${escapeHTML(draft.skipReason || step.skipReason || '')}">
    <div class="step-actions">
      <button type="button" class="primary-action" data-action="save-exercise">SAVE &amp; NEXT</button>
      <button type="button" class="danger-action" data-action="skip-exercise">SKIP EXERCISE</button>
      <button type="button" class="secondary-action" data-action="previous-step" ${workout.currentStepIndex === 0 ? 'disabled' : ''}>Previous</button>
    </div>
  </article>`;
}

function renderRowStep(workout, step) {
  const draft = step.entryDraft || {
    minutes: step.minutes ?? step.targetMinutes,
    distance: step.distance ?? '',
    spm: step.spm ?? '',
    kneeResponse: step.kneeResponse || 'good',
    notes: step.notes || ''
  };
  return `<article class="card step-card">
    ${statusMarkup(step.status)}
    <h3>Main rowing block</h3>
    <p class="step-description"><strong>${escapeHTML(workout.week)}:</strong> ${escapeHTML(step.prescription)}. Target: ${step.targetMinutes} minutes.</p>
    <label for="rowMinutes">Actual minutes</label>
    <input id="rowMinutes" data-draft-field="minutes" type="number" min="1" step="1" inputmode="numeric" value="${escapeHTML(draft.minutes ?? '')}">
    <div class="g2">
      <div>
        <label for="rowDistance">Distance (m), optional</label>
        <input id="rowDistance" data-draft-field="distance" type="number" min="0" step="1" inputmode="numeric" value="${escapeHTML(draft.distance ?? '')}">
      </div>
      <div>
        <label for="rowSpm">Stroke rate, optional</label>
        <select id="rowSpm" data-draft-field="spm">
          <option value="">Not recorded</option>
          ${Array.from({ length: 15 }, (_, index) => index + 16).map(value =>
            `<option value="${value}"${String(value) === String(draft.spm) ? ' selected' : ''}>${value}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <label for="rowKnee" class="field-spaced">Knee response</label>
    <select id="rowKnee" data-draft-field="kneeResponse">${optionMarkup(KNEE_OPTIONS, draft.kneeResponse, 'Choose response')}</select>
    <label for="rowNotes" class="field-spaced">Optional notes</label>
    <textarea id="rowNotes" data-draft-field="notes">${escapeHTML(draft.notes || '')}</textarea>
    <div class="step-actions">
      <button type="button" class="primary-action" data-action="save-row">SAVE &amp; NEXT</button>
      <button type="button" class="secondary-action" data-action="previous-step" ${workout.currentStepIndex === 0 ? 'disabled' : ''}>Previous</button>
    </div>
  </article>`;
}

function renderFinishStep(workout) {
  const ready = workout.steps.every(step => step.status !== 'not_started');
  return `<article class="card step-card finish-card">
    <h3>Workout steps finished</h3>
    <p>Review any previous step or finish this workout. Finish Workout is an action, not an additional step.</p>
    <div class="step-actions">
      <button type="button" class="primary-action" data-action="finish-workout"${ready ? '' : ' disabled'}>FINISH WORKOUT</button>
      <button type="button" class="secondary-action" data-action="previous-step">Previous step</button>
    </div>
  </article>`;
}

function renderWorkout() {
  const workout = activeWorkout();
  if (!workout) {
    $('#workoutContent').innerHTML = '<div class="card"><h2>No active workout</h2><p>Choose a workout from its day screen to begin.</p><button type="button" class="secondary-action" data-action="exit-workout">Back to workouts</button></div>';
    return;
  }
  const step = workout.steps[workout.currentStepIndex];
  let content = '';
  if (!step) {
    content = renderFinishStep(workout);
  } else if (step.kind === 'warmup' || step.kind === 'cooldown') {
    content = renderWarmupStep(workout, step);
  } else if (step.kind === 'exercise') {
    content = renderExerciseStep(workout, step);
  } else if (step.kind === 'row') {
    content = renderRowStep(workout, step);
  }
  $('#workoutContent').innerHTML = `<h2 class="workout-heading">${escapeHTML(workoutTitle(workout))}</h2>
    ${progressMarkup(workout)}
    ${content}
    <button type="button" class="reference-action" data-action="exit-workout">Leave workout open</button>`;
}

function openExerciseForm(exerciseId, opener) {
  const reference = [...document.querySelectorAll('#refs [data-exercise-id]')]
    .find(article => article.dataset.exerciseId === exerciseId);
  if (!reference) {
    setNotice('The form reference for this exercise could not be found.', true);
    return;
  }
  referenceOpener = opener;
  const content = $('#exerciseFormContent');
  content.replaceChildren(reference.cloneNode(true));
  $('#exerciseFormTitle').textContent = `${EXERCISES[exerciseId].name} form reference`;
  $('#exerciseFormDialog').hidden = false;
  $('#closeExerciseForm').focus();
}

function closeExerciseForm() {
  $('#exerciseFormDialog').hidden = true;
  $('#exerciseFormContent').replaceChildren();
  const opener = referenceOpener;
  referenceOpener = null;
  if (opener?.isConnected) opener.focus();
}

function handleWorkoutDraftInput(event) {
  const target = event.target;
  if (!target.matches('[data-draft-field], [data-set-value], [data-set-weight], [data-set-load-kind]')) return;
  if (event.type === 'input' && target.tagName === 'SELECT') return;
  if (event.type === 'change' && target.tagName !== 'SELECT') return;
  if (target.matches('[data-set-load-kind]')) {
    const weightControl = target.closest('[data-set-entry]').querySelector('.weight-control');
    if (weightControl) weightControl.hidden = target.value === 'bodyweight';
  }
  updateActiveWorkout(workout => {
    const step = workout.steps[workout.currentStepIndex];
    if (!step) return;
    if (step.kind === 'exercise') {
      step.entryDraft = readExerciseDraft(step);
    } else {
      step.entryDraft = readStepDraft(step);
    }
  });
  renderActiveBanner();
}

function readStepDraft(step) {
  if (step.kind === 'warmup' || step.kind === 'cooldown') {
    return {
      actualMinutes: $('#actualMinutes').value,
      kneeResponse: $('#kneeResponse').value
    };
  }
  if (step.kind === 'row') {
    return {
      minutes: $('#rowMinutes').value,
      distance: $('#rowDistance').value,
      spm: $('#rowSpm').value,
      kneeResponse: $('#rowKnee').value,
      notes: $('#rowNotes').value
    };
  }
  return step.entryDraft;
}

function readExerciseDraft(step) {
  const exercise = EXERCISES[step.exerciseId];
  const sets = [...$('#setEntries').querySelectorAll('[data-set-entry]')].map((entry, index) => {
    const selector = entry.querySelector('[data-set-load-kind]');
    const loadKind = exercise.loadMode === 'bodyweight'
      ? 'bodyweight'
      : selector?.value || 'weighted';
    const weight = entry.querySelector('[data-set-weight]')?.value || '';
    const value = entry.querySelector('[data-set-value]')?.value || '';
    return {
      loadKind,
      weightLb: weight ? Number(weight) : null,
      value: value ? Number(value) : null
    };
  });
  return {
    sets,
    kneeResponse: $('#exerciseKnee').value,
    effort: $('#exerciseEffort').value,
    notes: $('#exerciseNotes').value,
    skipReason: $('#skipReason').value
  };
}

function goToStep(index) {
  updateActiveWorkout(workout => {
    workout.currentStepIndex = Math.max(0, Math.min(index, workout.steps.length));
  });
  renderWorkout();
}

function completeWarmup() {
  const workout = activeWorkout();
  const step = workout?.steps[workout.currentStepIndex];
  if (!step || !['warmup', 'cooldown'].includes(step.kind)) return;
  const minutes = Number($('#actualMinutes').value);
  const kneeResponse = $('#kneeResponse').value;
  if (!validPositiveNumber(minutes)) {
    setNotice('Enter the actual minutes before completing this step.', true);
    return;
  }
  if (!KNEE_OPTIONS.some(([key]) => key === kneeResponse)) {
    setNotice('Choose a knee response before completing this step.', true);
    return;
  }
  clearNotice();
  updateActiveWorkout(current => {
    const target = current.steps[current.currentStepIndex];
    target.actualMinutes = minutes;
    target.kneeResponse = kneeResponse;
    target.status = 'completed';
    delete target.entryDraft;
    current.currentStepIndex += 1;
  });
  renderWorkout();
}

function skipWarmup() {
  updateActiveWorkout(workout => {
    const step = workout.steps[workout.currentStepIndex];
    if (!step || !['warmup', 'cooldown'].includes(step.kind)) return;
    const minutes = $('#actualMinutes').value;
    const kneeResponse = $('#kneeResponse').value;
    const enteredMinutes = Number(minutes);
    step.actualMinutes = minutes !== ''
      && Number.isInteger(enteredMinutes)
      && enteredMinutes >= 0
      ? enteredMinutes
      : null;
    step.kneeResponse = KNEE_OPTIONS.some(([key]) => key === kneeResponse) ? kneeResponse : null;
    step.status = 'skipped';
    delete step.entryDraft;
    workout.currentStepIndex += 1;
  });
  renderWorkout();
}

function addSet() {
  updateActiveWorkout(workout => {
    const step = workout.steps[workout.currentStepIndex];
    if (!step || step.kind !== 'exercise') return;
    step.entryDraft = readExerciseDraft(step);
    const last = step.entryDraft.sets.at(-1);
    step.entryDraft.sets.push({
      loadKind: last?.loadKind || 'weighted',
      weightLb: last?.weightLb || 5,
      value: null
    });
  });
  renderWorkout();
}

function removeSet(index) {
  updateActiveWorkout(workout => {
    const step = workout.steps[workout.currentStepIndex];
    if (!step || step.kind !== 'exercise') return;
    step.entryDraft = readExerciseDraft(step);
    if (step.entryDraft.sets.length <= 1) return;
    step.entryDraft.sets.splice(index, 1);
  });
  renderWorkout();
}

function validateExerciseDraft(step, draft) {
  const exercise = EXERCISES[step.exerciseId];
  if (!draft.sets.length) return 'Add at least one set.';
  for (let index = 0; index < draft.sets.length; index += 1) {
    const set = draft.sets[index];
    if (!validPositiveNumber(set.value)) return `Enter ${exercise.valueLabel.toLowerCase()} for set ${index + 1}.`;
    if (exercise.loadMode === 'required' && !WEIGHTS.includes(set.weightLb)) {
      return `Choose a valid NUOBELL weight for set ${index + 1}.`;
    }
    if (exercise.loadMode === 'optional' && set.loadKind === 'weighted' && !WEIGHTS.includes(set.weightLb)) {
      return `Choose a valid added weight for set ${index + 1}.`;
    }
  }
  if (!KNEE_OPTIONS.some(([key]) => key === draft.kneeResponse)) return 'Choose a knee response.';
  if (!EFFORT_OPTIONS.some(([key]) => key === draft.effort)) return 'Choose an effort level.';
  return '';
}

function saveExercise() {
  const workout = activeWorkout();
  const step = workout?.steps[workout.currentStepIndex];
  if (!step || step.kind !== 'exercise') return;
  const draft = readExerciseDraft(step);
  const error = validateExerciseDraft(step, draft);
  if (error) {
    setNotice(error, true);
    return;
  }
  const exercise = EXERCISES[step.exerciseId];
  const sets = draft.sets.map((set, index) => {
    const load = set.loadKind === 'bodyweight'
      ? { kind: 'bodyweight' }
      : {
        kind: 'weighted',
        weightLb: set.weightLb,
        implement: exercise.implement
      };
    return {
      setNumber: index + 1,
      load,
      [exercise.valueKey]: set.value
    };
  });
  clearNotice();
  updateActiveWorkout(current => {
    const target = current.steps[current.currentStepIndex];
    target.sets = sets;
    target.status = 'completed';
    target.kneeResponse = draft.kneeResponse;
    target.effort = draft.effort;
    target.notes = draft.notes.trim();
    delete target.entryDraft;
    current.currentStepIndex += 1;
  });
  renderWorkout();
}

function skipExercise() {
  const workout = activeWorkout();
  const step = workout?.steps[workout.currentStepIndex];
  if (!step || step.kind !== 'exercise') return;
  if (step.status === 'completed') {
    showConfirmation(
      'Replace saved exercise results?',
      `Replace the saved ${EXERCISES[step.exerciseId].name} results with a skipped step?`,
      'Skip exercise',
      () => saveSkippedExercise(step)
    );
    return;
  }
  saveSkippedExercise(step);
}

function saveSkippedExercise(step) {
  const skipReason = $('#skipReason').value.trim().slice(0, 120);
  const entryDraft = readExerciseDraft(step);
  updateActiveWorkout(current => {
    const target = current.steps[current.currentStepIndex];
    target.status = 'skipped';
    target.sets = [];
    target.kneeResponse = null;
    target.effort = null;
    target.notes = null;
    target.skipReason = skipReason.trim().slice(0, 120);
    target.entryDraft = entryDraft;
    current.currentStepIndex += 1;
  });
  renderWorkout();
}

function saveRowStep() {
  const minutes = Number($('#rowMinutes').value);
  const distanceInput = $('#rowDistance').value;
  const spmInput = $('#rowSpm').value;
  const kneeResponse = $('#rowKnee').value;
  if (!validPositiveNumber(minutes)) {
    setNotice('Enter the actual rowing minutes before continuing.', true);
    return;
  }
  if (distanceInput !== '' && (!Number.isInteger(Number(distanceInput)) || Number(distanceInput) < 0)) {
    setNotice('Distance must be zero or a positive whole number of meters.', true);
    return;
  }
  if (!KNEE_OPTIONS.some(([key]) => key === kneeResponse)) {
    setNotice('Choose a knee response before continuing.', true);
    return;
  }
  clearNotice();
  updateActiveWorkout(workout => {
    const step = workout.steps[workout.currentStepIndex];
    step.minutes = minutes;
    step.distance = distanceInput === '' ? null : Number(distanceInput);
    step.spm = spmInput === '' ? null : Number(spmInput);
    step.kneeResponse = kneeResponse;
    step.notes = $('#rowNotes').value.trim();
    step.status = 'completed';
    delete step.entryDraft;
    workout.currentStepIndex += 1;
  });
  renderWorkout();
}

function finishWorkout() {
  const workout = activeWorkout();
  if (!workout
    || workout.currentStepIndex < workout.steps.length
    || workout.steps.some(step => step.status === 'not_started')) {
    setNotice('Complete or skip every workout step before finishing.', true);
    return;
  }
  if (!updateActiveWorkout(current => {
    current.status = 'completed';
    current.completedAt = new Date().toISOString();
    current.currentStepIndex = current.steps.length;
  })) return;
  renderHistory();
  tab('History');
}

function exitWorkout() {
  const workout = activeWorkout();
  tab(workout ? workout.day : 'Monday');
}

function formatLoad(load) {
  if (load?.kind === 'bodyweight') return 'Bodyweight';
  if (!load || !Number.isInteger(load.weightLb)) return 'Load not recorded';
  return `${load.weightLb} lb${load.implement === 'two_dumbbells' ? ' each' : ''}`;
}

function formatSet(set, exercise) {
  const amount = set[exercise.valueKey];
  if (exercise.valueKey === 'secondsPerSide') return `${amount} sec/side`;
  if (exercise.valueKey === 'repsPerSide') return `${amount} reps/side`;
  return `${amount} reps`;
}

function historyStepSummary(step) {
  if (step.kind === 'warmup' || step.kind === 'cooldown') {
    return `${step.kind === 'warmup' ? 'Warm-up' : 'Cool-down'} ${step.status}${step.actualMinutes == null ? '' : ` · ${step.actualMinutes} min`}`;
  }
  if (step.kind === 'exercise') {
    return `${EXERCISES[step.exerciseId].name}: ${step.status}`;
  }
  if (step.kind === 'row') return `Main row: ${step.status}${step.minutes ? ` · ${step.minutes} min` : ''}`;
  return `${step.activity} · ${step.minutes} min`;
}

function appendHistoryStep(container, step) {
  const block = document.createElement('div');
  block.className = 'history-step';
  const heading = document.createElement('strong');
  heading.textContent = historyStepSummary(step);
  block.append(heading);
  if (step.kind === 'exercise') {
    if (step.status === 'completed') {
      const exercise = EXERCISES[step.exerciseId];
      step.sets.forEach(set => {
        const line = document.createElement('p');
        line.textContent = `Set ${set.setNumber}: ${formatLoad(set.load)} · ${formatSet(set, exercise)}`;
        block.append(line);
      });
      const details = document.createElement('p');
      details.textContent = `Knees: ${kneeLabel(step.kneeResponse)} · Effort: ${effortLabel(step.effort)}${step.notes ? ` · ${step.notes}` : ''}`;
      block.append(details);
    }
    if (step.skipReason) {
      const reason = document.createElement('p');
      reason.textContent = `Reason: ${step.skipReason}`;
      block.append(reason);
    }
  } else if (step.kind === 'warmup' || step.kind === 'cooldown') {
    if (step.kneeResponse) {
      const response = document.createElement('p');
      response.textContent = `Knees: ${kneeLabel(step.kneeResponse)}`;
      block.append(response);
    }
  } else if (step.kind === 'row') {
    const details = document.createElement('p');
    details.textContent = `${step.prescription} · ${step.distance ?? '—'} m · ${step.spm ?? '—'} spm · Knees: ${kneeLabel(step.kneeResponse)}${step.notes ? ` · ${step.notes}` : ''}`;
    block.append(details);
  } else if (step.kind === 'optional') {
    const details = document.createElement('p');
    details.textContent = step.notes ? `Notes: ${step.notes}` : '';
    block.append(details);
  }
  container.append(block);
}

function workoutSummary(workout) {
  if (workout.type === 'strength') {
    const exercises = workout.steps.filter(step => step.kind === 'exercise').length;
    const warmup = workout.steps.find(step => step.kind === 'warmup');
    const cooldown = workout.steps.find(step => step.kind === 'cooldown');
    return `Warm-up ${warmup.status} · ${exercises} strength exercises · Cool-down ${cooldown.status}`;
  }
  if (workout.type === 'row') {
    const warmup = workout.steps.find(step => step.kind === 'warmup');
    const cooldown = workout.steps.find(step => step.kind === 'cooldown');
    return `${workout.week} · Warm-up ${warmup.status} · 1 rowing block · Cool-down ${cooldown.status}`;
  }
  return historyStepSummary(workout.steps[0]);
}

function renderHistoryCard(workout) {
  const card = document.createElement('article');
  card.className = `card history-card${workout.status === 'in_progress' ? ' draft' : ''}`;
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = `${workoutTitle(workout)} · ${new Date(workout.startedAt).toLocaleString()}`;
  details.append(summary);
  const info = document.createElement('p');
  info.textContent = workoutSummary(workout);
  details.append(info);
  workout.steps.forEach(step => appendHistoryStep(details, step));
  card.append(details);
  if (workout.status === 'in_progress') {
    const actions = document.createElement('div');
    actions.className = 'history-actions';
    const resume = document.createElement('button');
    resume.type = 'button';
    resume.textContent = 'Resume';
    resume.addEventListener('click', () => tab('Workout'));
    const discard = document.createElement('button');
    discard.type = 'button';
    discard.className = 'danger-action';
    discard.textContent = 'Discard draft';
    discard.addEventListener('click', () => deleteWorkout(workout.id, true));
    actions.append(resume, discard);
    card.append(actions);
  } else {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'small-button';
    remove.textContent = 'Delete workout';
    remove.addEventListener('click', () => deleteWorkout(workout.id, false));
    card.append(remove);
  }
  return card;
}

function renderHistory() {
  const list = $('#historyList');
  list.replaceChildren();
  if (storage.mode === 'legacy') {
    const message = document.createElement('p');
    message.textContent = 'Legacy records are preserved. Export them above before explicitly replacing them with Version 2 storage.';
    list.append(message);
    return;
  }
  if (storage.mode !== 'v2' || storage.workouts.length === 0) {
    const message = document.createElement('p');
    message.textContent = 'No workouts yet.';
    list.append(message);
    return;
  }
  const workouts = [...storage.workouts].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  workouts.forEach(workout => list.append(renderHistoryCard(workout)));
}

function deleteWorkout(workoutId, isDraft) {
  const workout = storage.workouts.find(item => item.id === workoutId);
  if (!workout) return;
  const question = isDraft
    ? `Discard the in-progress ${workout.title} workout? This cannot be undone.`
    : `Delete the ${workout.title} workout and all its details?`;
  showConfirmation(
    isDraft ? 'Discard workout draft?' : 'Delete workout?',
    question,
    isDraft ? 'Discard draft' : 'Delete workout',
    () => {
      const next = storage.workouts.filter(item => item.id !== workoutId);
      if (saveEnvelope(next)) {
        renderHistory();
        renderActiveBanner();
        if ($('#Workout').classList.contains('active')) tab(workout.day);
      }
    }
  );
}

function downloadJSON(contents, filename) {
  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportJSON() {
  if (storage.mode === 'legacy') {
    setNotice('Legacy data is preserved. Use Export legacy JSON to download it unchanged.');
    return;
  }
  if (storage.mode !== 'v2') {
    setNotice('There is no Version 2 workout data to export.', true);
    return;
  }
  downloadJSON(
    JSON.stringify({ version: 2, workouts: storage.workouts }, null, 2),
    `nuobell-log-${new Date().toISOString().slice(0, 10)}.json`
  );
}

function exportLegacyJSON() {
  if (storage.mode !== 'legacy' || storage.legacyRaw === null) return;
  downloadJSON(
    storage.legacyRaw,
    `nuobell-legacy-log-${new Date().toISOString().slice(0, 10)}.json`
  );
  setNotice('Legacy JSON exported. The original localStorage data remains unchanged.');
}

function importEnvelope(text) {
  let imported;
  try {
    imported = JSON.parse(text);
  } catch (error) {
    setNotice(`Invalid JSON file: ${error.message}`, true);
    return;
  }
  if (!validateEnvelope(imported)) {
    setNotice('Invalid Version 2 JSON file. Legacy arrays are not converted or imported.', true);
    return;
  }
  const merge = () => mergeImportedEnvelope(imported);
  if (prepareVersion2Storage(merge)) merge();
}

function mergeImportedEnvelope(imported) {
  const merged = new Map(storage.workouts.map(workout => [workout.id, workout]));
  imported.workouts.forEach(workout => {
    if (!merged.has(workout.id)) merged.set(workout.id, workout);
  });
  const workouts = [...merged.values()];
  if (workouts.filter(workout => workout.status === 'in_progress').length > 1) {
    setNotice('Import was not applied because it would create more than one active workout.', true);
    return;
  }
  if (saveEnvelope(workouts)) {
    renderHistory();
    setNotice('Import complete.');
  }
}

function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => importEnvelope(String(reader.result));
  reader.onerror = () => setNotice(`Could not read the selected file: ${reader.error?.message || 'unknown file error'}`, true);
  reader.readAsText(file);
  event.target.value = '';
}

function saveOptionalActivity(event) {
  event.preventDefault();
  const save = () => {
    const activity = $('#sa').value;
    const minutes = Number($('#sm').value);
    const now = new Date().toISOString();
    const workout = {
      id: makeId(),
      type: 'optional',
      planId: 'saturday-optional',
      title: 'Optional activity',
      day: 'Saturday',
      status: 'completed',
      startedAt: now,
      completedAt: now,
      currentStepIndex: 1,
      steps: [{
        id: 'optional-activity',
        kind: 'optional',
        status: 'completed',
        activity,
        minutes,
        notes: $('#sn').value.trim()
      }]
    };
    if (saveEnvelope([...storage.workouts, workout])) {
      $('#sn').value = '';
      setNotice('Optional-day log saved.');
    }
  };
  if (prepareVersion2Storage(save)) save();
}

function handleWorkoutAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  clearNotice();
  const action = button.dataset.action;
  if (action === 'complete-warmup') completeWarmup();
  if (action === 'skip-warmup') skipWarmup();
  if (action === 'save-exercise') saveExercise();
  if (action === 'skip-exercise') skipExercise();
  if (action === 'save-row') saveRowStep();
  if (action === 'add-set') addSet();
  if (action === 'remove-set') removeSet(Number(button.dataset.setIndex));
  if (action === 'previous-step') {
    const workout = activeWorkout();
    if (workout) goToStep(workout.currentStepIndex - 1);
  }
  if (action === 'finish-workout') finishWorkout();
  if (action === 'exit-workout') exitWorkout();
  if (action === 'open-exercise-form') openExerciseForm(button.dataset.exerciseId, button);
}

function init() {
  loadStorage();
  updateStorageNotice();
  rowPlan();
  renderActiveBanner();
  $('#rw').addEventListener('change', rowPlan);
  document.querySelectorAll('[data-start-workout]').forEach(button =>
    button.addEventListener('click', () => startWorkout(button.dataset.startWorkout))
  );
  $('#resumeActiveWorkout').addEventListener('click', resumeWorkout);
  $('#choiceResume').addEventListener('click', resumeWorkout);
  $('#choiceDiscard').addEventListener('click', discardAndStart);
  $('#choiceCancel').addEventListener('click', () => {
    $('#workoutChoice').hidden = true;
    pendingPlanId = null;
  });
  $('#replaceLegacy').addEventListener('click', () => {
    const afterReplace = () => {
      renderHistory();
      setNotice('Version 2 storage is ready. Legacy records were replaced only after confirmation.');
    };
    if (prepareVersion2Storage(afterReplace)) afterReplace();
  });
  $('#confirmAction').addEventListener('click', () => resolveConfirmation(true));
  $('#cancelConfirmation').addEventListener('click', () => resolveConfirmation(false));
  $('#exportLegacy').addEventListener('click', exportLegacyJSON);
  $('#exportJSON').addEventListener('click', exportJSON);
  $('#importJSON').addEventListener('change', handleImport);
  $('#optionalForm').addEventListener('submit', saveOptionalActivity);
  $('#workoutContent').addEventListener('click', handleWorkoutAction);
  $('#workoutContent').addEventListener('input', handleWorkoutDraftInput);
  $('#workoutContent').addEventListener('change', handleWorkoutDraftInput);
  $('#closeExerciseForm').addEventListener('click', closeExerciseForm);
  $('#exerciseFormDialog').addEventListener('click', event => {
    if (event.target === $('#exerciseFormDialog')) closeExerciseForm();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('#workoutChoice').hidden) {
      $('#workoutChoice').hidden = true;
      pendingPlanId = null;
    }
    if (event.key === 'Escape' && !$('#confirmDialog').hidden) resolveConfirmation(false);
    if (event.key === 'Escape' && !$('#exerciseFormDialog').hidden) closeExerciseForm();
  });
  tab('Monday');
}

init();
