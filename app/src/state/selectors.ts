import type { FormState } from './actions';
import type { SecurityLevel } from '../constants/enums';
import { calculateMinSecurityLevel } from '../utils/securityCalc';
import { validate } from '../utils/validation';

export function effectiveSecurityLevel(state: FormState): SecurityLevel {
  return state.security.level;
}

export function minimumSecurityLevel(state: FormState): SecurityLevel {
  return calculateMinSecurityLevel(state.security);
}

export function repoNameSet(state: FormState): Set<string> {
  return new Set(state.structure.repos.map((r) => r.name).filter(Boolean));
}

export function validationErrors(state: FormState): Record<string, string> {
  return validate(state);
}

export function canExport(state: FormState): boolean {
  const errors = validate(state);
  return Object.keys(errors).length === 0;
}
