const STORAGE_KEY = 'nuobellLogs';
const PROGRAM_VERSION = 'bench-supported-v1';
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
const ROWING_VALIDATION_MESSAGE = 'Enter a valid time, positive meters, resistance from 1 to 10, and positive SPM.';
const WALK_METERS_PER_MILE = 1609.344;
// Fixes too uncertain to use even as a baseline tend to create GPS drift.
const MAX_GPS_ACCURACY_METERS = 75;
// Only report the signal as ready once the reported uncertainty is modest.
const GOOD_GPS_ACCURACY_METERS = 25;
const WEAK_GPS_ACCURACY_METERS = 50;
// Ignore very small coordinate changes that are commonly stationary GPS noise.
const MIN_GPS_MOVEMENT_METERS = 5;
// A single segment this long is more likely a GPS jump than a walking step.
const MAX_GPS_JUMP_METERS = 250;
// Walking faster than about 16 km/h is not a credible GPS segment.
const MAX_WALKING_SPEED_METERS_PER_SECOND = 4.5;
// Never bridge a long fix gap that may represent time in the background.
const MAX_GPS_FIX_GAP_SECONDS = 60;
// Less than about 53 feet is too little distance for a useful average pace.
const MIN_USABLE_GPS_DISTANCE_MILES = 0.01;
const GPS_WATCH_OPTIONS = { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 };
const WALK_GPS_STATUSES = [
  'requesting',
  'ready',
  'improving',
  'weak',
  'denied',
  'unavailable',
  'timeout',
  'unsupported'
];
const WALK_DISTANCE_SOURCES = ['iphone-gps', 'apple-watch-manual', 'manual'];
const EXERCISES = {
  'romanian-deadlift': {
    name: 'Romanian Deadlift',
    currentName: 'NÜOBELL Romanian Deadlift',
    loadMode: 'required',
    implement: 'two_dumbbells',
    valueKey: 'reps',
    valueLabel: 'Reps',
    image: 'assets/exercise-01.jpg',
    cues: 'Soft knees; hinge at hips; weights close; neutral back.',
    aceUrl: 'https://www.acefitness.org/continuing-education/certified/may-2025/8865/the-ace-do-it-better-series-the-romanian-deadlift/',
    videoUrl: 'https://www.youtube.com/watch?v=aa57T45iFSE'
  },
  'floor-press': {
    name: 'Floor Press',
    loadMode: 'required',
    implement: 'two_dumbbells',
    valueKey: 'reps',
    valueLabel: 'Reps',
    retired: true
  },
  'low-incline-dumbbell-press': {
    name: 'Low-Incline NÜOBELL Dumbbell Press',
    loadMode: 'required',
    implement: 'two_dumbbells',
    valueKey: 'reps',
    valueLabel: 'Reps',
    image: 'assets/exercise-10.png',
    cues: 'Set the Rogue Adjustable Bench 3.0 to a low incline; stay supported on the bench and press smoothly.',
    videoUrl: 'https://www.youtube.com/watch?v=fez7La5001w'
  },
  'supported-one-arm-row': {
    name: 'Supported One-Arm Row',
    currentName: 'Supported One-Arm NÜOBELL Row',
    loadMode: 'required',
    implement: 'one_dumbbell',
    valueKey: 'repsPerSide',
    valueLabel: 'Reps per side',
    image: 'assets/exercise-03.jpg',
    cues: 'Brace one hand on the Rogue Adjustable Bench 3.0 while standing; row without twisting.',
    videoUrl: 'https://www.youtube.com/watch?v=ZRSGpBUVcNw'
  },
  'chest-supported-dumbbell-row': {
    name: 'Chest-Supported NÜOBELL Row',
    loadMode: 'required',
    implement: 'two_dumbbells',
    valueKey: 'reps',
    valueLabel: 'Reps',
    image: 'assets/exercise-11.png',
    cues: 'Set the Rogue Adjustable Bench 3.0 to an incline; keep your chest supported while standing and row both dumbbells.',
    videoUrl: 'https://www.youtube.com/watch?v=0-DXJiceG-0'
  },
  'supported-standing-hip-extension': {
    name: 'Supported Standing Hip Extension',
    loadMode: 'bodyweight',
    implement: null,
    valueKey: 'repsPerSide',
    valueLabel: 'Reps per side',
    image: 'assets/exercise-12.png',
    cues: 'Stand tall and hold the Rogue Adjustable Bench 3.0 for balance; extend one leg behind you without arching your back.',
    videoUrl: 'https://www.youtube.com/watch?v=Ayfg6sEzA8Y'
  },
  'standing-calf-raise': {
    name: 'Standing Calf Raise',
    currentName: 'Standing NÜOBELL Calf Raise',
    loadMode: 'optional',
    implement: 'one_dumbbell',
    valueKey: 'reps',
    valueLabel: 'Reps',
    image: 'assets/exercise-04.jpg',
    cues: 'Stand tall near the Rogue Adjustable Bench 3.0 for balance; rise, pause and lower slowly.',
    videoUrl: 'https://www.youtube.com/watch?v=H6WptvjXkgw'
  },
  'bird-dog': {
    name: 'Bird Dog',
    loadMode: 'bodyweight',
    implement: null,
    valueKey: 'repsPerSide',
    valueLabel: 'Reps per side',
    retired: true
  },
  'glute-bridge': {
    name: 'Glute Bridge',
    loadMode: 'optional',
    implement: 'one_dumbbell',
    valueKey: 'reps',
    valueLabel: 'Reps',
    retired: true
  },
  'hammer-curl': {
    name: 'Hammer Curl',
    currentName: 'Seated NÜOBELL Hammer Curl',
    loadMode: 'required',
    implement: 'two_dumbbells',
    valueKey: 'reps',
    valueLabel: 'Reps',
    image: 'assets/exercise-07.jpg',
    cues: 'Sit upright on the Rogue Adjustable Bench 3.0; keep palms facing inward and avoid swinging.',
    videoUrl: 'https://www.youtube.com/watch?v=CFBZ4jN1CMI'
  },
  'seated-overhead-press': {
    name: 'Seated Overhead Press',
    currentName: 'Seated NÜOBELL Overhead Press',
    loadMode: 'required',
    implement: 'two_dumbbells',
    valueKey: 'reps',
    valueLabel: 'Reps',
    image: 'assets/exercise-08.jpg',
    cues: 'Sit upright on the Rogue Adjustable Bench 3.0; press smoothly and keep breathing.',
    videoUrl: 'https://www.youtube.com/watch?v=C0We_bEyxlM'
  },
  'suitcase-hold': {
    name: 'Suitcase Hold',
    currentName: 'NÜOBELL Suitcase Hold',
    loadMode: 'required',
    implement: 'one_dumbbell',
    valueKey: 'secondsPerSide',
    valueLabel: 'Seconds per side',
    image: 'assets/exercise-09.jpg',
    cues: 'Stand tall with one dumbbell; resist leaning.',
    videoUrl: 'https://www.youtube.com/watch?v=WS1Db_NQdFI'
  }
};
const EXERCISE_LIBRARY_IDS = [
  'romanian-deadlift',
  'low-incline-dumbbell-press',
  'supported-one-arm-row',
  'chest-supported-dumbbell-row',
  'supported-standing-hip-extension',
  'standing-calf-raise',
  'seated-overhead-press',
  'hammer-curl',
  'suitcase-hold'
];
const LEGACY_STRENGTH_PLANS = {
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
const STRENGTH_PLANS = {
  'monday-strength-a': {
    day: 'Monday',
    title: 'Strength A',
    exercises: [
      'romanian-deadlift',
      'low-incline-dumbbell-press',
      'supported-one-arm-row',
      'standing-calf-raise',
      'suitcase-hold'
    ],
    cooldownMinutes: 10
  },
  'friday-strength-b': {
    day: 'Friday',
    title: 'Strength B',
    exercises: [
      'romanian-deadlift',
      'chest-supported-dumbbell-row',
      'seated-overhead-press',
      'hammer-curl',
      'supported-standing-hip-extension',
      'standing-calf-raise',
      'suitcase-hold'
    ],
    variations: {
      'romanian-deadlift': 'Use a lighter load and a controlled tempo.'
    },
    cooldownMinutes: 10
  }
};
const PREVIOUS_STRENGTH_PLANS = {
  'friday-strength-b': {
    day: 'Friday',
    title: 'Strength B',
    exercises: [
      'romanian-deadlift',
      'chest-supported-dumbbell-row',
      'seated-overhead-press',
      'hammer-curl',
      'standing-calf-raise',
      'suitcase-hold'
    ],
    variations: {
      'romanian-deadlift': 'Use a lighter load and a controlled tempo.'
    },
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
let walkTimer = null;
let walkWatchId = null;

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

function validRowingDraft(draft) {
  return draft
    && typeof draft.elapsedTime === 'string'
    && draft.elapsedTime.length <= 8
    && validDraftNumber(draft.meters)
    && validDraftNumber(draft.resistance)
    && (draft.spm === '' || /^(?:\d+(?:\.\d*)?|\.\d*)$/.test(draft.spm));
}

function validRowingData(data, complete = false) {
  if (!data || typeof data !== 'object') return false;
  const fields = ['elapsedSeconds', 'meters', 'resistance'];
  if (fields.some(field => data[field] !== null && !Number.isInteger(data[field]))) return false;
  if (data.spm !== null && (!Number.isFinite(data.spm) || data.spm <= 0)) return false;
  if (complete) {
    return Number.isInteger(data.elapsedSeconds) && data.elapsedSeconds > 0
      && Number.isInteger(data.meters) && data.meters > 0
      && Number.isInteger(data.resistance) && data.resistance >= 1 && data.resistance <= 10
      && Number.isFinite(data.spm) && data.spm > 0;
  }
  return (data.elapsedSeconds === null || data.elapsedSeconds > 0)
    && (data.meters === null || data.meters > 0)
    && (data.resistance === null || (data.resistance >= 1 && data.resistance <= 10));
}

function isValidKneeResponse(value) {
  return value == null || value === '' || KNEE_OPTIONS.some(([key]) => key === value);
}

function validWalkDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function validWalkPosition(position) {
  return position === null || (position
    && Number.isFinite(position.latitude)
    && position.latitude >= -90
    && position.latitude <= 90
    && Number.isFinite(position.longitude)
    && position.longitude >= -180
    && position.longitude <= 180
    && Number.isFinite(position.accuracy)
    && position.accuracy >= 0
    && position.accuracy <= MAX_GPS_ACCURACY_METERS
    && Number.isFinite(position.timestamp)
    && position.timestamp > 0);
}

function validActiveWalk(walk) {
  if (!walk
    || walk.activityType !== 'walk'
    || typeof walk.id !== 'string'
    || !walk.id
    || !validWalkDate(walk.date)
    || typeof walk.startedAt !== 'string'
    || Number.isNaN(Date.parse(walk.startedAt))
    || (walk.endedAt !== null
      && (typeof walk.endedAt !== 'string' || Number.isNaN(Date.parse(walk.endedAt))))
    || !Number.isFinite(walk.accumulatedDistanceMeters)
    || walk.accumulatedDistanceMeters < 0
    || !validWalkPosition(walk.lastAcceptedPosition)
    || !WALK_GPS_STATUSES.includes(walk.gpsStatus)) return false;
  if (walk.endedAt === null) {
    return walk.gpsDistanceMiles === null
      && walk.finalDistanceMiles === ''
      && walk.distanceSource === ''
      && walk.notes === '';
  }
  return (walk.gpsDistanceMiles === null
      || (Number.isFinite(walk.gpsDistanceMiles) && walk.gpsDistanceMiles >= 0))
    && typeof walk.finalDistanceMiles === 'string'
    && (walk.finalDistanceMiles === '' || /^\d+(?:\.\d*)?$/.test(walk.finalDistanceMiles))
    && WALK_DISTANCE_SOURCES.includes(walk.distanceSource)
    && typeof walk.notes === 'string';
}

function validWalkRecord(step) {
  return step
    && step.activityType === 'walk'
    && validWalkDate(step.date)
    && typeof step.startedAt === 'string'
    && !Number.isNaN(Date.parse(step.startedAt))
    && typeof step.endedAt === 'string'
    && !Number.isNaN(Date.parse(step.endedAt))
    && Number.isInteger(step.durationSeconds)
    && step.durationSeconds >= 0
    && (step.gpsDistanceMiles === null
      || (Number.isFinite(step.gpsDistanceMiles) && step.gpsDistanceMiles >= 0))
    && Number.isFinite(step.distanceMiles)
    && step.distanceMiles > 0
    && Number.isFinite(step.averagePaceSecondsPerMile)
    && step.averagePaceSecondsPerMile >= 0
    && WALK_DISTANCE_SOURCES.includes(step.distanceSource)
    && typeof step.notes === 'string'
    && typeof step.createdAt === 'string'
    && !Number.isNaN(Date.parse(step.createdAt));
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

function isValidStep(step, programVersion) {
  if (!step || !['completed', 'skipped', 'not_started'].includes(step.status)) return false;
  if (step.kind === 'walk') {
    return step.status === 'completed' && validWalkRecord(step);
  }
  if (step.kind === 'warmup' || step.kind === 'cooldown') {
    if (step.activity !== 'row') return false;
    if (programVersion === PROGRAM_VERSION) {
      if (!validRowingData(step.rowingData)
        || (step.entryDraft
          && (!validRowingDraft(step.entryDraft)
            || !isValidKneeResponse(step.entryDraft.kneeResponse)))) return false;
      if (step.status === 'completed') {
        return validRowingData(step.rowingData, true)
          && KNEE_OPTIONS.some(([key]) => key === step.kneeResponse);
      }
      return step.status === 'skipped'
        || (step.rowingData.elapsedSeconds === null
          && step.rowingData.meters === null
          && step.rowingData.resistance === null
          && step.rowingData.spm === null
          && step.kneeResponse === null);
    }
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
    if (programVersion === PROGRAM_VERSION) {
      if (!validRowingData(step.rowingData)
        || (step.entryDraft
          && (!validRowingDraft(step.entryDraft)
            || !isValidKneeResponse(step.entryDraft.kneeResponse)
            || typeof step.entryDraft.notes !== 'string'))) return false;
      return step.status === 'completed'
        ? validRowingData(step.rowingData, true)
          && KNEE_OPTIONS.some(([key]) => key === step.kneeResponse)
          && typeof step.notes === 'string'
        : step.status === 'skipped'
          || (step.rowingData.elapsedSeconds === null
            && step.rowingData.meters === null
            && step.rowingData.resistance === null
            && step.rowingData.spm === null
            && step.kneeResponse === null);
    }
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
    if (programVersion === PROGRAM_VERSION) {
      if (!['row', 'walk', 'rest'].includes(step.activity)) return false;
      if (step.activity === 'row') {
        return step.status === 'completed'
          && validRowingData(step.rowingData, true)
          && typeof step.notes === 'string';
      }
      return step.status === 'completed'
        && Number.isInteger(step.minutes)
        && step.minutes >= 0
        && typeof step.notes === 'string';
    }
    return step.status === 'completed'
      && typeof step.activity === 'string'
      && Number.isInteger(step.minutes)
      && step.minutes >= 0;
  }
  return false;
}

function validateEnvelope(value) {
  if (!value || value.version !== 2 || !Array.isArray(value.workouts)) return false;
  if (value.activeWalk != null && !validActiveWalk(value.activeWalk)) return false;
  if (value.activeWalk && value.workouts.some(workout => workout?.id === value.activeWalk.id)) return false;
  const active = value.workouts.filter(workout => workout?.status === 'in_progress');
  const ids = value.workouts.map(workout => workout?.id);
  if (active.length > 1 || new Set(ids).size !== ids.length) return false;
  return value.workouts.every(workout => {
    if (!workout
      || typeof workout.id !== 'string'
      || workout.id.length === 0
      || typeof workout.day !== 'string'
      || typeof workout.title !== 'string'
      || !['strength', 'row', 'optional', 'walk'].includes(workout.type)
      || !['in_progress', 'completed'].includes(workout.status)
      || typeof workout.startedAt !== 'string'
      || Number.isNaN(Date.parse(workout.startedAt))
      || (workout.completedAt !== null
        && (typeof workout.completedAt !== 'string' || Number.isNaN(Date.parse(workout.completedAt))))
      || Array.isArray(workout.steps) === false
      || !Number.isInteger(workout.currentStepIndex)
      || workout.currentStepIndex < 0
      || workout.currentStepIndex > workout.steps.length
      || (workout.programVersion !== undefined && workout.programVersion !== PROGRAM_VERSION)
      || !workout.steps.every(step => isValidStep(step, workout.programVersion))
      || (workout.status === 'completed'
        && (workout.completedAt === null
          || workout.currentStepIndex !== workout.steps.length
          || workout.steps.some(step => step.status === 'not_started')))
      || (workout.status === 'in_progress' && workout.completedAt !== null)) return false;
    if (workout.type === 'strength') {
      const legacy = workout.programVersion === undefined;
      const plan = (legacy ? LEGACY_STRENGTH_PLANS : STRENGTH_PLANS)[workout.planId];
      const compatiblePlan = legacy ? null : PREVIOUS_STRENGTH_PLANS[workout.planId];
      return [plan, compatiblePlan].some(candidate =>
        candidate
        && workout.day === candidate.day
        && workout.title === candidate.title
        && workout.steps.length === candidate.exercises.length + 2
        && workout.steps[0].id === 'warm-up'
        && workout.steps[0].kind === 'warmup'
        && workout.steps[0].targetMinutes === 5
        && workout.steps.slice(1, -1).every((step, index) =>
          step.kind === 'exercise'
          && step.exerciseId === candidate.exercises[index]
          && (step.variation || null) === (candidate.variations?.[step.exerciseId] || null)
        )
        && workout.steps[workout.steps.length - 1].id === 'cool-down'
        && workout.steps[workout.steps.length - 1].targetMinutes === candidate.cooldownMinutes
        && workout.steps[workout.steps.length - 1].kind === 'cooldown'
      );
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
    if (workout.type === 'walk') {
      const step = workout.steps[0];
      return workout.planId === 'anytime-walk'
        && workout.day === 'Anytime'
        && workout.title === 'Walk'
        && workout.status === 'completed'
        && workout.steps.length === 1
        && workout.completedAt === step.endedAt
        && workout.startedAt === step.startedAt
        && workout.currentStepIndex === 1
        && step.id === 'walk-activity'
        && step.kind === 'walk'
        && step.status === 'completed';
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
    storage = { mode: 'empty', workouts: [], legacyRaw: null, activeWalk: null };
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
    storage = { mode: 'legacy', workouts: [], legacyRaw: raw, activeWalk: null };
    return;
  }
  if (!validateEnvelope(parsed)) {
    storage.mode = 'invalid';
    setNotice('Workout storage is not a valid Version 2 envelope and was left unchanged.', true);
    return;
  }
  storage = { mode: 'v2', workouts: parsed.workouts, legacyRaw: null, activeWalk: parsed.activeWalk || null };
}

function updateStorageNotice() {
  $('#legacyNotice').hidden = storage.mode !== 'legacy';
  if (storage.mode === 'invalid' && $('#appNotice').hidden) {
    setNotice('Workout data could not be safely read. No records have been changed.', true);
  }
}

function saveEnvelope(workouts, replacingLegacy = false, activeWalk = storage.activeWalk || null) {
  if (storage.mode === 'invalid' || (storage.mode === 'legacy' && !replacingLegacy)) {
    setNotice('Workout data was not changed because its current format must be resolved first.', true);
    return false;
  }
  const envelope = { version: 2, workouts, ...(activeWalk ? { activeWalk } : {}) };
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
  storage = { mode: 'v2', workouts, legacyRaw: null, activeWalk };
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

function stopWalkWatching() {
  if (walkWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(walkWatchId);
    walkWatchId = null;
  }
}

function localDateKey(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatWalkDuration(seconds) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remainder = wholeSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function formatWalkPace(durationSeconds, distanceMiles) {
  if (!Number.isFinite(durationSeconds)
    || durationSeconds <= 0
    || !Number.isFinite(distanceMiles)
    || distanceMiles < MIN_USABLE_GPS_DISTANCE_MILES) return '--:-- /mi';
  const pace = Math.round(durationSeconds / distanceMiles);
  return `${String(Math.floor(pace / 60)).padStart(2, '0')}:${String(pace % 60).padStart(2, '0')} /mi`;
}

function walkDistanceSourceLabel(source) {
  return {
    'iphone-gps': 'iPhone GPS',
    'apple-watch-manual': 'Apple Watch (manual entry)',
    manual: 'Manual'
  }[source] || 'Manual';
}

function walkGPSStatusLabel(status) {
  return {
    requesting: 'Requesting location',
    ready: 'GPS ready',
    improving: 'Improving accuracy',
    weak: 'GPS signal weak',
    denied: 'Location permission denied',
    unavailable: 'Location unavailable',
    timeout: 'Location request timed out',
    unsupported: 'Location unavailable in this browser'
  }[status] || 'Location unavailable';
}

function walkDurationSeconds(walk, endTime = Date.now()) {
  const elapsed = endTime - Date.parse(walk.startedAt);
  return Number.isFinite(elapsed) ? Math.max(0, Math.floor(elapsed / 1000)) : 0;
}

function walkGPSDistanceMiles(walk) {
  return walk.accumulatedDistanceMeters / WALK_METERS_PER_MILE;
}

function renderActiveWalkBanner() {
  const banner = $('#activeWalkBanner');
  const walk = storage.activeWalk;
  if (!walk) {
    banner.hidden = true;
    return;
  }
  const summaryReady = walk.endedAt !== null;
  $('#activeWalkLabel').textContent = summaryReady ? 'WALK SUMMARY READY' : 'WALK IN PROGRESS';
  $('#resumeActiveWalk').textContent = summaryReady ? 'REVIEW' : 'RESUME';
  $('#finishActiveWalk').hidden = summaryReady;
  banner.hidden = false;
}

function showWalkError(message) {
  const error = $('#walkError') || $('#walkSaveError');
  if (!error) {
    setNotice(message, true);
    return;
  }
  error.textContent = message;
  error.hidden = false;
}

function persistActiveWalk(walk) {
  if (!saveEnvelope(storage.workouts, false, walk)) {
    showWalkError($('#appNotice').textContent || 'Walk state could not be saved.');
    return false;
  }
  renderActiveWalkBanner();
  return true;
}

function updateWalkMetrics() {
  const walk = storage.activeWalk;
  if (!walk || walk.endedAt !== null || $('#walkDialog').hidden) return;
  const duration = walkDurationSeconds(walk);
  const distance = walkGPSDistanceMiles(walk);
  const elapsed = $('#walkElapsed');
  if (elapsed) elapsed.textContent = formatWalkDuration(duration);
  const miles = $('#walkDistance');
  if (miles) miles.textContent = `${distance.toFixed(2)} mi`;
  const pace = $('#walkPace');
  if (pace) pace.textContent = formatWalkPace(duration, distance);
  const status = $('#walkGPSStatus');
  if (status) status.textContent = walkGPSStatusLabel(walk.gpsStatus);
}

function renderWalkTracker() {
  const content = $('#walkContent');
  const walk = storage.activeWalk;
  if (!walk) {
    const gpsSupported = window.isSecureContext && navigator.geolocation;
    content.innerHTML = `<p class="walk-intro">Track an independent walk without changing a scheduled workout.</p>
      <p class="walk-intro">Location permission is needed to calculate distance. You can enter distance manually if GPS is unavailable.</p>
      <p class="walk-warning">Browser GPS may be interrupted if your iPhone is locked or this app is placed in the background.</p>
      ${gpsSupported ? '' : '<p class="walk-gps-status" role="status">Location tracking requires a secure connection and a browser that supports location. You can still enter distance manually.</p>'}
      <p id="walkError" class="walk-error" role="alert" hidden></p>
      <button type="button" class="primary-action" data-walk-action="start">START WALK</button>`;
    return;
  }
  if (walk.endedAt !== null) {
    const duration = walkDurationSeconds(walk, Date.parse(walk.endedAt));
    const gpsDistance = walk.gpsDistanceMiles;
    const gpsText = gpsDistance === null ? 'Unavailable' : `${gpsDistance.toFixed(2)} mi`;
    content.innerHTML = `<p class="walk-summary"><strong>Date:</strong> ${escapeHTML(new Date(`${walk.date}T00:00:00`).toLocaleDateString())}<br>
        <strong>Start:</strong> ${escapeHTML(new Date(walk.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))}<br>
        <strong>End:</strong> ${escapeHTML(new Date(walk.endedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))}<br>
        <strong>Duration:</strong> ${formatWalkDuration(duration)}<br>
        <strong>GPS-calculated distance:</strong> ${gpsText}</p>
      <label for="walkFinalDistance">FINAL DISTANCE</label>
      <input id="walkFinalDistance" data-walk-field="finalDistanceMiles" type="number" min="0.01" step="0.01" inputmode="decimal" value="${escapeHTML(walk.finalDistanceMiles)}" aria-describedby="walkDistanceHelp">
      <p id="walkDistanceHelp" class="walk-summary-help">Enter distance in miles. You may replace the GPS result with the distance shown on your Apple Watch.</p>
      <label for="walkDistanceSource">Distance source</label>
      <select id="walkDistanceSource" data-walk-field="distanceSource">
        <option value="iphone-gps"${walk.distanceSource === 'iphone-gps' ? ' selected' : ''}${gpsDistance === null || gpsDistance < MIN_USABLE_GPS_DISTANCE_MILES ? ' disabled' : ''}>iPhone GPS</option>
        <option value="apple-watch-manual"${walk.distanceSource === 'apple-watch-manual' ? ' selected' : ''}>Apple Watch (manual entry)</option>
        <option value="manual"${walk.distanceSource === 'manual' ? ' selected' : ''}>Manual</option>
      </select>
      <p class="walk-summary-help">Apple Watch distance is entered by you; this app does not connect to Apple Watch or HealthKit.</p>
      <div class="walk-summary">
        <span class="walk-metric-label">Average pace</span>
        <strong id="walkSummaryPace" class="walk-metric-value">${formatWalkPace(duration, Number(walk.finalDistanceMiles))}</strong>
        <span>Distance source: <span id="walkSummarySource">${escapeHTML(walkDistanceSourceLabel(walk.distanceSource))}</span></span>
      </div>
      <label for="walkNotes">Optional notes</label>
      <textarea id="walkNotes" data-walk-field="notes">${escapeHTML(walk.notes)}</textarea>
      <p id="walkSaveError" class="walk-error" role="alert" hidden></p>
      <div class="walk-actions">
        <button type="button" class="primary-action" data-walk-action="save">SAVE WALK</button>
        <button type="button" class="danger-action" data-walk-action="discard">DISCARD WALK</button>
      </div>`;
    return;
  }
  const distance = walkGPSDistanceMiles(walk);
  content.innerHTML = `<div class="walk-metrics">
      <div class="walk-metric"><span class="walk-metric-label">Elapsed duration</span><strong id="walkElapsed" class="walk-metric-value">00:00:00</strong></div>
      <div class="walk-metric"><span class="walk-metric-label">Distance</span><strong id="walkDistance" class="walk-metric-value">${distance.toFixed(2)} mi</strong></div>
      <div class="walk-metric"><span class="walk-metric-label">Average pace</span><strong id="walkPace" class="walk-metric-value">${formatWalkPace(walkDurationSeconds(walk), distance)}</strong></div>
    </div>
    <p id="walkGPSStatus" class="walk-gps-status" role="status" aria-live="polite">${walkGPSStatusLabel(walk.gpsStatus)}</p>
    <p id="walkError" class="walk-error" role="alert" hidden></p>
    <p class="walk-gps-details">Only the distance total and most recent accepted position are retained while this walk is active. The route is not saved.</p>
    <button type="button" class="danger-action" data-walk-action="stop">STOP WALK</button>`;
  updateWalkMetrics();
}

function openWalkTracker() {
  renderWalkTracker();
  $('#walkDialog').hidden = false;
  $('#closeWalkTracker').focus();
  if (storage.activeWalk && storage.activeWalk.endedAt === null && walkTimer === null) {
    resumeWalk();
  }
}

function startWalkTimer() {
  if (walkTimer !== null) clearInterval(walkTimer);
  walkTimer = window.setInterval(updateWalkMetrics, 1000);
  updateWalkMetrics();
}

function stopWalkTimerAndWatching() {
  if (walkTimer !== null) {
    clearInterval(walkTimer);
    walkTimer = null;
  }
  stopWalkWatching();
}

function startWalk() {
  if (storage.activeWalk) {
    openWalkTracker();
    return;
  }
  const begin = () => {
    const now = new Date();
    const walk = {
      id: makeId(),
      activityType: 'walk',
      date: localDateKey(now),
      startedAt: now.toISOString(),
      endedAt: null,
      accumulatedDistanceMeters: 0,
      lastAcceptedPosition: null,
      gpsStatus: 'requesting',
      gpsDistanceMiles: null,
      finalDistanceMiles: '',
      distanceSource: '',
      notes: ''
    };
    if (!persistActiveWalk(walk)) return;
    renderWalkTracker();
    startWalkTimer();
    startWalkLocationTracking();
  };
  if (prepareVersion2Storage(begin)) begin();
}

function haversineDistanceMeters(first, second) {
  const radians = degrees => degrees * Math.PI / 180;
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const firstLatitude = radians(first.latitude);
  const secondLatitude = radians(second.latitude);
  const rawHalfChord = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const halfChord = Math.min(1, Math.max(0, rawHalfChord));
  return 6371000 * 2 * Math.atan2(Math.sqrt(halfChord), Math.sqrt(1 - halfChord));
}

function setWalkGPSStatus(status) {
  const walk = storage.activeWalk;
  if (!walk || walk.endedAt !== null || walk.gpsStatus === status) return;
  persistActiveWalk({ ...walk, gpsStatus: status });
  updateWalkMetrics();
}

function handleWalkPosition(position) {
  const walk = storage.activeWalk;
  if (!walk || walk.endedAt !== null) return;
  const coords = position?.coords;
  const nextPosition = coords && {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    timestamp: position.timestamp
  };
  if (!nextPosition || !validWalkPosition(nextPosition) || nextPosition.accuracy > MAX_GPS_ACCURACY_METERS) {
    setWalkGPSStatus('weak');
    return;
  }
  const previous = walk.lastAcceptedPosition;
  const status = nextPosition.accuracy <= GOOD_GPS_ACCURACY_METERS
    ? 'ready'
    : nextPosition.accuracy <= WEAK_GPS_ACCURACY_METERS ? 'improving' : 'weak';
  if (!previous) {
    persistActiveWalk({ ...walk, lastAcceptedPosition: nextPosition, gpsStatus: status });
    updateWalkMetrics();
    return;
  }
  if (nextPosition.latitude === previous.latitude && nextPosition.longitude === previous.longitude) return;
  const elapsedSeconds = (nextPosition.timestamp - previous.timestamp) / 1000;
  const distanceMeters = haversineDistanceMeters(previous, nextPosition);
  if (elapsedSeconds > MAX_GPS_FIX_GAP_SECONDS) {
    persistActiveWalk({ ...walk, lastAcceptedPosition: nextPosition, gpsStatus: status });
    updateWalkMetrics();
    return;
  }
  const movementThreshold = Math.max(
    MIN_GPS_MOVEMENT_METERS,
    (previous.accuracy + nextPosition.accuracy) / 2
  );
  if (elapsedSeconds <= 0) {
    setWalkGPSStatus('weak');
    return;
  }
  if (distanceMeters > MAX_GPS_JUMP_METERS
    || distanceMeters / elapsedSeconds > MAX_WALKING_SPEED_METERS_PER_SECOND) {
    // Drop this segment but re-anchor so one bad fix cannot poison all later readings.
    persistActiveWalk({ ...walk, lastAcceptedPosition: nextPosition, gpsStatus: 'weak' });
    updateWalkMetrics();
    return;
  }
  if (distanceMeters <= movementThreshold) {
    setWalkGPSStatus(status);
    return;
  }
  const updated = {
    ...walk,
    accumulatedDistanceMeters: walk.accumulatedDistanceMeters + distanceMeters,
    lastAcceptedPosition: nextPosition,
    gpsStatus: status
  };
  persistActiveWalk(updated);
  updateWalkMetrics();
}

function handleWalkLocationError(error) {
  const status = error?.code === 1
    ? 'denied'
    : error?.code === 3 ? 'timeout' : 'unavailable';
  setWalkGPSStatus(status);
  if (status === 'denied') stopWalkWatching();
}

function startWalkLocationTracking() {
  if (!window.isSecureContext || !navigator.geolocation) {
    setWalkGPSStatus('unsupported');
    return;
  }
  setWalkGPSStatus('requesting');
  try {
    walkWatchId = navigator.geolocation.watchPosition(
      handleWalkPosition,
      handleWalkLocationError,
      GPS_WATCH_OPTIONS
    );
  } catch (error) {
    setWalkGPSStatus('unavailable');
    const message = `Could not start location tracking: ${error.message || 'unknown error'}`;
    setNotice(message, true);
    showWalkError(message);
  }
}

function resumeWalk() {
  const walk = storage.activeWalk;
  if (!walk) return;
  if (walk.endedAt !== null) {
    openWalkTracker();
    return;
  }
  stopWalkTimerAndWatching();
  const resumed = { ...walk, lastAcceptedPosition: null, gpsStatus: 'requesting' };
  if (!persistActiveWalk(resumed)) return;
  renderWalkTracker();
  $('#walkDialog').hidden = false;
  startWalkTimer();
  startWalkLocationTracking();
}

function stopWalk(stopTime = new Date()) {
  const walk = storage.activeWalk;
  if (!walk || walk.endedAt !== null) return;
  stopWalkTimerAndWatching();
  const gpsDistanceMiles = walkGPSDistanceMiles(walk);
  const hasGPSDistance = gpsDistanceMiles >= MIN_USABLE_GPS_DISTANCE_MILES;
  const stopped = {
    ...walk,
    endedAt: stopTime.toISOString(),
    lastAcceptedPosition: null,
    gpsDistanceMiles: walk.accumulatedDistanceMeters > 0 ? gpsDistanceMiles : null,
    finalDistanceMiles: hasGPSDistance ? gpsDistanceMiles.toFixed(2) : '',
    distanceSource: hasGPSDistance ? 'iphone-gps' : 'manual',
    notes: ''
  };
  if (!persistActiveWalk(stopped)) return;
  renderWalkTracker();
}

function finishActiveWalk() {
  const walk = storage.activeWalk;
  if (!walk) return;
  if (walk.endedAt === null) stopWalk();
  openWalkTracker();
}

function confirmDiscardWalk() {
  showConfirmation(
    'Discard walk?',
    'Discard this walk and its unsaved distance and duration? This cannot be undone.',
    'Discard walk',
    clearActiveWalk
  );
}

function clearActiveWalk() {
  stopWalkTimerAndWatching();
  if (!saveEnvelope(storage.workouts, false, null)) {
    showWalkError($('#appNotice').textContent || 'Walk state could not be cleared.');
    return;
  }
  $('#walkDialog').hidden = true;
  renderWalkTracker();
  renderActiveWalkBanner();
}

function requestCloseWalkTracker() {
  const walk = storage.activeWalk;
  if (!walk) {
    $('#walkDialog').hidden = true;
    return;
  }
  if (walk.endedAt !== null) {
    showConfirmation(
      'Discard unsaved walk?',
      'Closing now will discard this unsaved walk summary.',
      'Discard walk',
      clearActiveWalk
    );
    return;
  }
  showConfirmation(
    'Close walk tracker?',
    'The walk will keep running and timing while the tracker is closed. GPS may be interrupted in the background.',
    'Close tracker',
    () => {
      $('#walkDialog').hidden = true;
      renderActiveWalkBanner();
    }
  );
}

function updateWalkSummaryPreview() {
  const walk = storage.activeWalk;
  if (!walk || walk.endedAt === null) return;
  const pace = $('#walkSummaryPace');
  if (pace) {
    pace.textContent = formatWalkPace(
      walkDurationSeconds(walk, Date.parse(walk.endedAt)),
      Number(walk.finalDistanceMiles)
    );
  }
  const source = $('#walkSummarySource');
  if (source) source.textContent = walkDistanceSourceLabel(walk.distanceSource);
  const sourceSelect = $('#walkDistanceSource');
  if (sourceSelect) sourceSelect.value = walk.distanceSource;
  const error = $('#walkSaveError');
  if (error) error.hidden = true;
}

function handleWalkFieldChange(event) {
  const field = event.target.dataset.walkField;
  const walk = storage.activeWalk;
  if (!field || !walk || walk.endedAt === null) return;
  const updated = { ...walk, [field]: event.target.value };
  if (field === 'finalDistanceMiles'
    && walk.distanceSource === 'iphone-gps'
    && Number(event.target.value) !== Number(walk.gpsDistanceMiles?.toFixed(2))) {
    updated.distanceSource = 'manual';
  }
  if (persistActiveWalk(updated)) updateWalkSummaryPreview();
}

function saveWalk() {
  const walk = storage.activeWalk;
  if (!walk || walk.endedAt === null) return;
  const distanceMiles = Number(walk.finalDistanceMiles);
  const durationSeconds = walkDurationSeconds(walk, Date.parse(walk.endedAt));
  const pace = durationSeconds / distanceMiles;
  if (!Number.isFinite(distanceMiles) || distanceMiles <= 0 || !Number.isFinite(pace) || pace < 0) {
    const error = $('#walkSaveError');
    error.textContent = 'Enter a final distance greater than zero miles before saving.';
    error.hidden = false;
    $('#walkFinalDistance').focus();
    return;
  }
  const endedAt = walk.endedAt;
  const step = {
    id: 'walk-activity',
    kind: 'walk',
    status: 'completed',
    activityType: 'walk',
    date: walk.date,
    startedAt: walk.startedAt,
    endedAt,
    durationSeconds,
    gpsDistanceMiles: walk.gpsDistanceMiles,
    distanceMiles,
    averagePaceSecondsPerMile: pace,
    distanceSource: walk.distanceSource,
    notes: walk.notes,
    createdAt: new Date().toISOString()
  };
  const workout = {
    id: walk.id,
    type: 'walk',
    planId: 'anytime-walk',
    day: 'Anytime',
    title: 'Walk',
    status: 'completed',
    startedAt: walk.startedAt,
    completedAt: endedAt,
    currentStepIndex: 1,
    steps: [step]
  };
  if (!saveEnvelope([...storage.workouts, workout], false, null)) {
    showWalkError($('#appNotice').textContent || 'Walk could not be saved.');
    return;
  }
  $('#walkDialog').hidden = true;
  renderActiveWalkBanner();
  renderHistory();
  setNotice('Walk saved to history.');
}

function handleWalkAction(event) {
  const button = event.target.closest('[data-walk-action]');
  if (!button) return;
  const action = button.dataset.walkAction;
  if (action === 'start') startWalk();
  if (action === 'stop') stopWalk();
  if (action === 'save') saveWalk();
  if (action === 'discard') confirmDiscardWalk();
}

function emptyRowingData() {
  return {
    elapsedSeconds: null,
    meters: null,
    resistance: null,
    spm: null
  };
}

function emptyRowingDraft(kneeResponse = 'good', notes = '') {
  return {
    elapsedTime: '',
    meters: '',
    resistance: '',
    spm: '',
    kneeResponse,
    notes
  };
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

function makeExerciseDraft(exerciseId, variation = null) {
  const exercise = EXERCISES[exerciseId];
  const previous = previousExercise(exerciseId);
  const setCount = previous ? previous.step.sets.length : 3;
  const load = defaultLoad(exercise, variation ? null : previous);
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

function newExerciseStep(exerciseId, variation = null) {
  const step = {
    id: exerciseId,
    kind: 'exercise',
    exerciseId,
    status: 'not_started',
    sets: [],
    kneeResponse: null,
    effort: null,
    notes: null,
    entryDraft: makeExerciseDraft(exerciseId, variation)
  };
  if (variation) step.variation = variation;
  return step;
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
      rowingData: emptyRowingData(),
      status: 'not_started',
      kneeResponse: null,
      entryDraft: emptyRowingDraft()
    },
    ...plan.exercises.map(exerciseId =>
      newExerciseStep(exerciseId, plan.variations?.[exerciseId] || null)
    ),
    {
      id: 'cool-down',
      kind: 'cooldown',
      activity: 'row',
      targetMinutes: plan.cooldownMinutes,
      rowingData: emptyRowingData(),
      status: 'not_started',
      kneeResponse: null,
      entryDraft: emptyRowingDraft()
    }
  ];
  return {
    id: makeId(),
    type: 'strength',
    programVersion: PROGRAM_VERSION,
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
    programVersion: PROGRAM_VERSION,
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
        rowingData: emptyRowingData(),
        status: 'not_started',
        kneeResponse: null,
        entryDraft: emptyRowingDraft()
      },
      {
        id: 'main-row',
        kind: 'row',
        activity: 'row',
        targetMinutes: plan.targetMinutes,
        prescription: plan.main,
        status: 'not_started',
        rowingData: emptyRowingData(),
        kneeResponse: null,
        notes: null,
        entryDraft: emptyRowingDraft()
      },
      {
        id: 'cool-down',
        kind: 'cooldown',
        activity: 'row',
        targetMinutes: 5,
        rowingData: emptyRowingData(),
        status: 'not_started',
        kneeResponse: null,
        entryDraft: emptyRowingDraft()
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
  if (workout.type === 'walk') {
    return `WALK · ${new Date(`${workout.steps[0].date}T00:00:00`).toLocaleDateString()}`;
  }
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
  renderActiveWalkBanner();
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

function parseElapsedTime(value) {
  const match = /^(\d{1,3}):([0-5]\d)$/.exec(String(value || '').trim());
  if (!match) return null;
  const seconds = Number(match[1]) * 60 + Number(match[2]);
  return seconds > 0 ? seconds : null;
}

function formatElapsedTime(seconds) {
  if (!Number.isInteger(seconds) || seconds <= 0) return '';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function rowingMetrics(data) {
  if (!data
    || !Number.isInteger(data.elapsedSeconds) || data.elapsedSeconds <= 0
    || !Number.isInteger(data.meters) || data.meters <= 0) return null;
  return {
    splitSeconds: (data.elapsedSeconds * 500) / data.meters
  };
}

function formatSplit(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

function rowingMetricText(data) {
  const metrics = rowingMetrics(data);
  if (!metrics) return '';
  return `500 m split: ${formatSplit(metrics.splitSeconds)}`;
}

function rowingDraftForStep(step) {
  if (step.entryDraft?.elapsedTime !== undefined) return step.entryDraft;
  const data = step.rowingData;
  if (data) {
    return {
      ...emptyRowingDraft(step.entryDraft?.kneeResponse || step.kneeResponse || 'good', step.entryDraft?.notes || step.notes || ''),
      elapsedTime: formatElapsedTime(data.elapsedSeconds),
      meters: data.meters == null ? '' : String(data.meters),
      resistance: data.resistance == null ? '' : String(data.resistance),
      spm: data.spm == null ? '' : String(data.spm)
    };
  }
  const legacyMinutes = step.actualMinutes ?? step.entryDraft?.actualMinutes ?? step.minutes ?? step.entryDraft?.minutes;
  const legacySpm = step.spm ?? step.entryDraft?.spm ?? '';
  return {
    ...emptyRowingDraft(step.entryDraft?.kneeResponse || step.kneeResponse || 'good', step.entryDraft?.notes || step.notes || ''),
    elapsedTime: legacyMinutes == null || legacyMinutes === '' ? '' : `${Number(legacyMinutes)}:00`,
    meters: step.distance ?? step.entryDraft?.distance ?? '',
    resistance: '',
    spm: legacySpm === '' || legacySpm == null ? '' : String(legacySpm)
  };
}

function rowingDataFromDraft(draft) {
  const elapsedSeconds = parseElapsedTime(draft.elapsedTime);
  const meters = draft.meters === '' ? null : Number(draft.meters);
  const resistance = draft.resistance === '' ? null : Number(draft.resistance);
  const spm = draft.spm === '' ? null : Number(draft.spm);
  return {
    elapsedSeconds,
    meters: Number.isInteger(meters) && meters > 0 ? meters : null,
    resistance: Number.isInteger(resistance) && resistance >= 1 && resistance <= 10 ? resistance : null,
    spm: Number.isFinite(spm) && spm > 0 ? spm : null
  };
}

function renderRowingFields(scope, draft) {
  const elapsedTime = draft.elapsedTime || '';
  const meters = draft.meters ?? '';
  const resistance = draft.resistance ?? '';
  const spm = draft.spm ?? '';
  const data = rowingDataFromDraft(draft);
  return `<div class="rowing-fields" data-rowing-container="${scope}">
    <div class="g2">
      <div>
        <label for="${scope}-elapsed">Time (mm:ss)</label>
        <input id="${scope}-elapsed" data-rowing-field="elapsedTime" type="text" inputmode="numeric" autocomplete="off" placeholder="mm:ss" maxlength="8" value="${escapeHTML(elapsedTime)}">
      </div>
      <div>
        <label for="${scope}-meters">Meters rowed</label>
        <input id="${scope}-meters" data-rowing-field="meters" type="number" min="1" step="1" inputmode="numeric" value="${escapeHTML(meters)}">
      </div>
    </div>
    <div class="g2">
      <div>
        <label for="${scope}-resistance">Resistance (1–10)</label>
        <select id="${scope}-resistance" data-rowing-field="resistance">
          <option value="">Choose resistance</option>
          ${Array.from({ length: 10 }, (_, index) => index + 1).map(value =>
            `<option value="${value}"${String(value) === String(resistance) ? ' selected' : ''}>${value}</option>`
          ).join('')}
        </select>
      </div>
      <div>
        <label for="${scope}-spm">Strokes/min (SPM)</label>
        <input id="${scope}-spm" data-rowing-field="spm" type="number" min="0" step="any" inputmode="decimal" value="${escapeHTML(spm)}">
      </div>
    </div>
    <p class="rowing-metrics" data-rowing-metrics aria-live="polite">${escapeHTML(rowingMetricText(data))}</p>
  </div>`;
}

function renderWarmupStep(workout, step) {
  const usesRowingData = workout.programVersion === PROGRAM_VERSION;
  if (usesRowingData) {
    const draft = rowingDraftForStep(step);
    const isCoolDown = step.kind === 'cooldown';
    const name = isCoolDown ? 'Cool-down' : 'Warm-up';
    const pace = isCoolDown ? 'very easy' : 'easy';
    return `<article class="card step-card">
      ${statusMarkup(step.status)}
      <h3>${name}: ${step.targetMinutes}-minute ${pace} row</h3>
      <p class="step-description">Target: ${step.targetMinutes} minutes</p>
      ${renderRowingFields('warmup-row', draft)}
      <label for="kneeResponse" class="field-spaced">Knee response</label>
      <select id="kneeResponse" data-rowing-knee>${optionMarkup(KNEE_OPTIONS, draft.kneeResponse, 'Choose response')}</select>
      <div class="step-actions">
        <button type="button" class="primary-action" data-action="complete-warmup">COMPLETE</button>
        <button type="button" class="danger-action" data-action="skip-warmup">SKIP</button>
        <button type="button" class="secondary-action" data-action="previous-step" ${workout.currentStepIndex === 0 ? 'disabled' : ''}>Previous</button>
      </div>
    </article>`;
  }
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

function exerciseReferenceMarkup(exerciseId) {
  const exercise = EXERCISES[exerciseId];
  if (!exercise || exercise.retired) return '';
  const name = exercise.currentName || exercise.name;
  return `<article class="ref" data-exercise-id="${exerciseId}">
    <h3>${escapeHTML(name)}</h3>
    ${exercise.image ? `<img src="${escapeHTML(exercise.image)}" alt="${escapeHTML(name)} illustration">` : ''}
    ${exercise.cues ? `<p>${escapeHTML(exercise.cues)}</p>` : ''}
    ${exercise.videoUrl ? `<a class="watch-form" href="${escapeHTML(exercise.videoUrl)}" target="_blank" rel="noopener noreferrer">WATCH FORM ↗</a>` : ''}
    ${exercise.aceUrl ? `<a href="${escapeHTML(exercise.aceUrl)}" target="_blank" rel="noopener noreferrer">ACE guidance ↗</a>` : ''}
  </article>`;
}

function renderExerciseLibrary() {
  $('#refs').innerHTML = EXERCISE_LIBRARY_IDS.map(exerciseReferenceMarkup).join('');
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
  if (exercise.retired && step.status !== 'completed') {
    return renderRetiredExerciseStep(workout, step);
  }
  if (exercise.retired) return renderCompletedRetiredExerciseStep(workout, step);
  const draft = exerciseDraftForStep(step);
  const kneeResponse = step.status === 'completed' ? step.kneeResponse : draft.kneeResponse;
  const effort = step.status === 'completed' ? step.effort : draft.effort;
  const notes = step.status === 'completed' ? step.notes : draft.notes;
  const exerciseName = exercise.currentName || exercise.name;
  return `<article class="card step-card">
    ${statusMarkup(step.status)}
    <h3>${escapeHTML(exerciseName)}</h3>
    <button type="button" class="reference-action" data-action="open-exercise-form" data-exercise-id="${step.exerciseId}">FORM / ${exercise.image ? 'ILLUSTRATION' : 'CUES'}</button>
    ${previousPerformanceMarkup(step.exerciseId)}
    <p class="step-description">${step.variation ? `${escapeHTML(step.variation)} ` : ''}${exercise.valueLabel}${exercise.implement === 'two_dumbbells' ? ' · weight per dumbbell' : exercise.implement === 'one_dumbbell' ? ' · one dumbbell' : ''}</p>
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

function renderRetiredExerciseStep(workout, step) {
  const reason = step.skipReason || '';
  return `<article class="card step-card retired-step">
    ${statusMarkup(step.status)}
    <h3>${escapeHTML(EXERCISES[step.exerciseId].name)} — retired</h3>
    <p class="step-description">This movement is no longer part of the current program. Its saved workout data is preserved; do not perform it. Skip this step to continue.</p>
    ${reason ? `<p>Skip reason: ${escapeHTML(reason)}</p>` : ''}
    <div class="step-actions">
      <button type="button" class="danger-action" data-action="skip-retired-exercise">SKIP RETIRED EXERCISE</button>
      <button type="button" class="secondary-action" data-action="previous-step" ${workout.currentStepIndex === 0 ? 'disabled' : ''}>Previous</button>
    </div>
  </article>`;
}

function renderCompletedRetiredExerciseStep(workout, step) {
  const exercise = EXERCISES[step.exerciseId];
  const sets = step.sets.map(set =>
    `<p>Set ${set.setNumber}: ${escapeHTML(formatLoad(set.load))} · ${escapeHTML(formatSet(set, exercise))}</p>`
  ).join('');
  return `<article class="card step-card retired-step">
    ${statusMarkup(step.status)}
    <h3>${escapeHTML(exercise.name)} — retired historical exercise</h3>
    <p class="step-description">Historical results are shown as recorded. This movement is no longer prescribed.</p>
    ${sets}
    <div class="step-actions">
      <button type="button" class="primary-action" data-action="continue-step">CONTINUE</button>
      <button type="button" class="secondary-action" data-action="previous-step" ${workout.currentStepIndex === 0 ? 'disabled' : ''}>Previous</button>
    </div>
  </article>`;
}

function renderRowStep(workout, step) {
  const usesRowingData = workout.programVersion === PROGRAM_VERSION;
  if (usesRowingData) {
    const draft = rowingDraftForStep(step);
    return `<article class="card step-card">
      ${statusMarkup(step.status)}
      <h3>Main rowing block</h3>
      <p class="step-description"><strong>${escapeHTML(workout.week)}:</strong> ${escapeHTML(step.prescription)}. Target: ${step.targetMinutes} minutes.</p>
      ${renderRowingFields('main-row', draft)}
      <label for="rowKnee" class="field-spaced">Knee response</label>
      <select id="rowKnee" data-rowing-knee>${optionMarkup(KNEE_OPTIONS, draft.kneeResponse, 'Choose response')}</select>
      <label for="rowNotes" class="field-spaced">Optional notes</label>
      <textarea id="rowNotes" data-rowing-notes>${escapeHTML(draft.notes || '')}</textarea>
      <div class="step-actions">
        <button type="button" class="primary-action" data-action="save-row">SAVE &amp; NEXT</button>
        <button type="button" class="secondary-action" data-action="previous-step" ${workout.currentStepIndex === 0 ? 'disabled' : ''}>Previous</button>
      </div>
    </article>`;
  }
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
  const exercise = EXERCISES[exerciseId];
  $('#exerciseFormTitle').textContent = `${exercise.currentName || exercise.name} form reference`;
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
  if (!target.matches('[data-draft-field], [data-set-value], [data-set-weight], [data-set-load-kind], [data-rowing-field], [data-rowing-knee], [data-rowing-notes]')) return;
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
      if ($('#workoutContent [data-rowing-container]')) {
        step.rowingData ||= emptyRowingData();
      }
      step.entryDraft = readStepDraft(step);
    }
  });
  const rowingContainer = target.closest('[data-rowing-container]');
  if (rowingContainer) {
    updateRowingMetricPreview(rowingContainer);
    clearRowingValidationNotice();
  }
  renderActiveBanner();
}

function clearRowingValidationNotice() {
  if ($('#appNotice').textContent === ROWING_VALIDATION_MESSAGE) clearNotice();
}

function readRowingDraft(container) {
  const value = field => container.querySelector(`[data-rowing-field="${field}"]`)?.value || '';
  return {
    elapsedTime: value('elapsedTime'),
    meters: value('meters'),
    resistance: value('resistance'),
    spm: value('spm')
  };
}

function updateRowingMetricPreview(container) {
  const output = container.querySelector('[data-rowing-metrics]');
  if (!output) return;
  output.textContent = rowingMetricText(rowingDataFromDraft(readRowingDraft(container)));
}

function readStepDraft(step) {
  if (step.kind === 'warmup' || step.kind === 'cooldown') {
    const rowingContainer = $('#workoutContent [data-rowing-container]');
    if (rowingContainer) {
      return {
        ...(step.entryDraft || {}),
        ...readRowingDraft(rowingContainer),
        kneeResponse: $('#kneeResponse').value
      };
    }
    return {
      actualMinutes: $('#actualMinutes').value,
      kneeResponse: $('#kneeResponse').value
    };
  }
  if (step.kind === 'row') {
    const rowingContainer = $('#workoutContent [data-rowing-container]');
    if (rowingContainer) {
      return {
        ...(step.entryDraft || {}),
        ...readRowingDraft(rowingContainer),
        kneeResponse: $('#rowKnee').value,
        notes: $('#rowNotes').value
      };
    }
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
  if ($('#workoutContent [data-rowing-container]')) {
    const draft = readStepDraft(step);
    const data = rowingDataFromDraft(draft);
    if (!validRowingData(data, true)) {
      setNotice(ROWING_VALIDATION_MESSAGE, true);
      return;
    }
    if (!KNEE_OPTIONS.some(([key]) => key === draft.kneeResponse)) {
      setNotice('Choose a knee response before completing this step.', true);
      return;
    }
    clearNotice();
    updateActiveWorkout(current => {
      const target = current.steps[current.currentStepIndex];
      target.rowingData = data;
      target.kneeResponse = draft.kneeResponse;
      target.status = 'completed';
      delete target.entryDraft;
      current.currentStepIndex += 1;
    });
    renderWorkout();
    return;
  }
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
    if ($('#workoutContent [data-rowing-container]')) {
      step.rowingData ||= emptyRowingData();
      step.entryDraft = readStepDraft(step);
      step.status = 'skipped';
      workout.currentStepIndex += 1;
      return;
    }
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

function skipRetiredExercise() {
  updateActiveWorkout(workout => {
    const step = workout.steps[workout.currentStepIndex];
    if (!step || step.kind !== 'exercise' || !EXERCISES[step.exerciseId]?.retired) return;
    step.status = 'skipped';
    step.skipReason ||= 'Retired in current program';
    workout.currentStepIndex += 1;
  });
  renderWorkout();
}

function continueStep() {
  updateActiveWorkout(workout => {
    if (workout.currentStepIndex < workout.steps.length) workout.currentStepIndex += 1;
  });
  renderWorkout();
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
  const workout = activeWorkout();
  const currentStep = workout?.steps[workout.currentStepIndex];
  if (!currentStep || currentStep.kind !== 'row') return;
  if ($('#workoutContent [data-rowing-container]')) {
    const draft = readStepDraft(currentStep);
    const data = rowingDataFromDraft(draft);
    if (!validRowingData(data, true)) {
      setNotice(ROWING_VALIDATION_MESSAGE, true);
      return;
    }
    if (!KNEE_OPTIONS.some(([key]) => key === draft.kneeResponse)) {
      setNotice('Choose a knee response before continuing.', true);
      return;
    }
    clearNotice();
    updateActiveWorkout(current => {
      const step = current.steps[current.currentStepIndex];
      step.rowingData = data;
      step.kneeResponse = draft.kneeResponse;
      step.notes = draft.notes.trim();
      step.status = 'completed';
      delete step.entryDraft;
      current.currentStepIndex += 1;
    });
    renderWorkout();
    return;
  }
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

function historyStepSummary(step, programVersion) {
  if (step.kind === 'walk') return 'WALK';
  if (step.kind === 'warmup' || step.kind === 'cooldown') {
    if (step.rowingData) {
      const time = formatElapsedTime(step.rowingData.elapsedSeconds);
      return `${step.kind === 'warmup' ? 'Warm-up' : 'Cool-down'} ${step.status}${time ? ` · ${time}` : ''}`;
    }
    return `${step.kind === 'warmup' ? 'Warm-up' : 'Cool-down'} ${step.status}${step.actualMinutes == null ? '' : ` · ${step.actualMinutes} min`}`;
  }
  if (step.kind === 'exercise') {
    const exercise = EXERCISES[step.exerciseId];
    const name = programVersion === PROGRAM_VERSION
      ? exercise.currentName || exercise.name
      : exercise.name;
    return `${name}${step.variation ? ` (${step.variation})` : ''}: ${step.status}`;
  }
  if (step.kind === 'row') {
    const time = step.rowingData ? formatElapsedTime(step.rowingData.elapsedSeconds) : '';
    return `Main row: ${step.status}${time ? ` · ${time}` : step.minutes ? ` · ${step.minutes} min` : ''}`;
  }
  if (step.kind === 'optional' && step.activity === 'row') return 'Easy conversational row';
  if (step.kind === 'optional' && programVersion === PROGRAM_VERSION) {
    const labels = {
      walk: 'Comfortable walk',
      rest: 'Recovery / rest'
    };
    return `${labels[step.activity] || step.activity} · ${step.minutes} min`;
  }
  return `${step.activity} · ${step.minutes} min`;
}

function rowingHistoryDetails(data) {
  if (!data) return '';
  if (data.elapsedSeconds === null
    && data.meters === null
    && data.resistance === null
    && data.spm === null) return '';
  const time = formatElapsedTime(data.elapsedSeconds) || '—';
  const metrics = rowingMetrics(data);
  const source = `Time: ${time} · ${data.meters ?? '—'} m · Resistance: ${data.resistance ?? '—'} · SPM: ${data.spm ?? '—'}`;
  return metrics
    ? `${source} · ${formatSplit(metrics.splitSeconds)} / 500 m`
    : source;
}

function appendHistoryStep(container, step, programVersion) {
  const block = document.createElement('div');
  block.className = 'history-step';
  const heading = document.createElement('strong');
  heading.textContent = historyStepSummary(step, programVersion);
  block.append(heading);
  if (step.kind === 'walk') {
    const date = new Date(`${step.date}T00:00:00`).toLocaleDateString();
    const start = new Date(step.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const end = new Date(step.endedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const details = document.createElement('p');
    details.textContent = `Date: ${date} · ${start}–${end} · Duration: ${formatWalkDuration(step.durationSeconds)} · Distance: ${step.distanceMiles.toFixed(2)} mi · Average pace: ${formatWalkPace(step.durationSeconds, step.distanceMiles)} · Source: ${walkDistanceSourceLabel(step.distanceSource)}`;
    block.append(details);
    if (step.gpsDistanceMiles !== null) {
      const gps = document.createElement('p');
      gps.textContent = `GPS-calculated distance: ${step.gpsDistanceMiles.toFixed(2)} mi`;
      block.append(gps);
    }
    if (step.notes) {
      const notes = document.createElement('p');
      notes.textContent = `Notes: ${step.notes}`;
      block.append(notes);
    }
  } else if (step.kind === 'exercise') {
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
    if (step.rowingData) {
      const details = rowingHistoryDetails(step.rowingData);
      if (details) {
        const rowing = document.createElement('p');
        rowing.textContent = details;
        block.append(rowing);
      }
    }
    if (step.kneeResponse) {
      const response = document.createElement('p');
      response.textContent = `Knees: ${kneeLabel(step.kneeResponse)}`;
      block.append(response);
    }
  } else if (step.kind === 'row') {
    const details = document.createElement('p');
    details.textContent = step.rowingData
      ? `${step.prescription} · ${rowingHistoryDetails(step.rowingData)} · Knees: ${kneeLabel(step.kneeResponse)}${step.notes ? ` · ${step.notes}` : ''}`
      : `${step.prescription} · ${step.distance ?? '—'} m · ${step.spm ?? '—'} spm · Knees: ${kneeLabel(step.kneeResponse)}${step.notes ? ` · ${step.notes}` : ''}`;
    block.append(details);
  } else if (step.kind === 'optional') {
    const details = document.createElement('p');
    details.textContent = step.activity === 'row'
      ? `${rowingHistoryDetails(step.rowingData)}${step.notes ? ` · Notes: ${step.notes}` : ''}`
      : step.notes ? `Notes: ${step.notes}` : '';
    block.append(details);
  }
  container.append(block);
}

function workoutSummary(workout) {
  if (workout.type === 'walk') {
    const walk = workout.steps[0];
    return `${formatWalkDuration(walk.durationSeconds)} · ${walk.distanceMiles.toFixed(2)} mi · ${formatWalkPace(walk.durationSeconds, walk.distanceMiles)} · ${walkDistanceSourceLabel(walk.distanceSource)}`;
  }
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
  return historyStepSummary(workout.steps[0], workout.programVersion);
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
  workout.steps.forEach(step => appendHistoryStep(details, step, workout.programVersion));
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
    remove.textContent = workout.type === 'walk' ? 'Delete walk' : 'Delete workout';
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

function toggleOptionalActivityFields() {
  const isRowing = $('#sa').value === 'row';
  $('#optionalMinutesField').hidden = isRowing;
  const rowFields = $('#optionalRowFields');
  rowFields.hidden = !isRowing;
  if (isRowing && !rowFields.firstElementChild) {
    rowFields.innerHTML = renderRowingFields('saturday-row', emptyRowingDraft());
  }
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
  const activity = $('#sa').value;
  let rowingData = null;
  if (activity === 'row') {
    const container = $('#optionalRowFields [data-rowing-container]');
    rowingData = rowingDataFromDraft(readRowingDraft(container));
    if (!validRowingData(rowingData, true)) {
      setNotice(ROWING_VALIDATION_MESSAGE, true);
      return;
    }
  }
  const save = () => {
    const minutes = Number($('#sm').value);
    const now = new Date().toISOString();
    const workout = {
      id: makeId(),
      type: 'optional',
      programVersion: PROGRAM_VERSION,
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
        ...(activity === 'row' ? { rowingData } : { minutes }),
        notes: $('#sn').value.trim()
      }]
    };
    if (saveEnvelope([...storage.workouts, workout])) {
      $('#sn').value = '';
      $('#optionalRowFields').innerHTML = '';
      if (activity === 'row') toggleOptionalActivityFields();
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
  if (action === 'skip-retired-exercise') skipRetiredExercise();
  if (action === 'save-row') saveRowStep();
  if (action === 'add-set') addSet();
  if (action === 'remove-set') removeSet(Number(button.dataset.setIndex));
  if (action === 'previous-step') {
    const workout = activeWorkout();
    if (workout) goToStep(workout.currentStepIndex - 1);
  }
  if (action === 'finish-workout') finishWorkout();
  if (action === 'continue-step') continueStep();
  if (action === 'exit-workout') exitWorkout();
  if (action === 'open-exercise-form') openExerciseForm(button.dataset.exerciseId, button);
}

function init() {
  loadStorage();
  updateStorageNotice();
  renderExerciseLibrary();
  toggleOptionalActivityFields();
  rowPlan();
  renderActiveBanner();
  renderActiveWalkBanner();
  $('#openWalkTracker').addEventListener('click', openWalkTracker);
  $('#resumeActiveWalk').addEventListener('click', resumeWalk);
  $('#finishActiveWalk').addEventListener('click', finishActiveWalk);
  $('#discardActiveWalk').addEventListener('click', confirmDiscardWalk);
  $('#closeWalkTracker').addEventListener('click', requestCloseWalkTracker);
  $('#walkDialog').addEventListener('click', handleWalkAction);
  $('#walkDialog').addEventListener('input', handleWalkFieldChange);
  $('#walkDialog').addEventListener('change', handleWalkFieldChange);
  $('#rw').addEventListener('change', rowPlan);
  $('#sa').addEventListener('change', toggleOptionalActivityFields);
  $('#optionalRowFields').addEventListener('input', event => {
    const container = event.target.closest('[data-rowing-container]');
    if (container) {
      updateRowingMetricPreview(container);
      clearRowingValidationNotice();
    }
  });
  $('#optionalRowFields').addEventListener('change', event => {
    const container = event.target.closest('[data-rowing-container]');
    if (container) {
      updateRowingMetricPreview(container);
      clearRowingValidationNotice();
    }
  });
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
    if (event.key !== 'Escape') return;
    if (!$('#confirmDialog').hidden) {
      resolveConfirmation(false);
      return;
    }
    if (!$('#workoutChoice').hidden) {
      $('#workoutChoice').hidden = true;
      pendingPlanId = null;
      return;
    }
    if (!$('#exerciseFormDialog').hidden) {
      closeExerciseForm();
      return;
    }
    if (!$('#walkDialog').hidden) requestCloseWalkTracker();
  });
  tab('Monday');
}

init();
