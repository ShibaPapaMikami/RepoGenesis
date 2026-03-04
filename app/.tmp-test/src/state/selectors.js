import { calculateMinSecurityLevel } from '../utils/securityCalc';
import { validate } from '../utils/validation';
export function effectiveSecurityLevel(state) {
    return state.security.level;
}
export function minimumSecurityLevel(state) {
    return calculateMinSecurityLevel(state.security);
}
export function repoNameSet(state) {
    return new Set(state.structure.repos.map((r) => r.name).filter(Boolean));
}
export function validationErrors(state) {
    return validate(state);
}
export function canExport(state) {
    const errors = validate(state);
    return Object.keys(errors).length === 0;
}
