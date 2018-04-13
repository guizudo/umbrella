// best practice tip: define event & effect names as consts or enums
// and avoid hardcoded strings for more safety and easier refactoring
// also see pre-defined event handlers & interceptors in @thi.ng/atom:
// https://github.com/thi-ng/umbrella/blob/master/packages/interceptors/src/api.ts#L14

export const SET_AMP = "set-amp";
export const SET_FREQ = "set-freq";
export const SET_PHASE = "set-phase";
export const SET_HARMONICS = "set-harmonics";
export const SET_HSTEP = "set-hstep";