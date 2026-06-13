import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PARAMS } from '../data/defaults';
import { calculate } from '../logic/calculator';
import { getMaximumSpan } from '../logic/validation';
import type { CalculatorParams, RoofType } from '../types/calculator';

const cloneDefaults = (): CalculatorParams => structuredClone(DEFAULT_PARAMS);

const VALID_ROOFS: Record<CalculatorParams['system'], RoofType[]> = {
  'Спринт-М': ['one_slope', 'two_slope'],
  'Спринт-2М': ['one_slope', 'two_slope'],
  Великан: ['one_slope', 'two_slope', 'flat', 'multi_slope'],
  Атлант: ['one_slope', 'two_slope', 'flat', 'multi_slope'],
  'Атлант-М': ['one_slope', 'two_slope', 'flat', 'multi_slope'],
  Крон: ['one_slope', 'two_slope'],
};

function encodePayload(params: CalculatorParams): string {
  const bytes = new TextEncoder().encode(JSON.stringify(params));
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function decodePayload(value: string): CalculatorParams | null {
  try {
    const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '==='.slice((value.length + 3) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<CalculatorParams>;
    if (parsed.model_version !== 2 || !parsed.system || !parsed.roof_type) return null;
    const defaults = cloneDefaults();
    return {
      ...defaults,
      ...parsed,
      project_sections: { ...defaults.project_sections, ...(parsed.project_sections ?? {}) },
      floor: { ...defaults.floor, ...(parsed.floor ?? {}) },
      mezzanines: defaults.mezzanines.map((item, index) => ({
        ...item,
        ...(Array.isArray(parsed.mezzanines) ? parsed.mezzanines[index] ?? {} : {}),
      })) as CalculatorParams['mezzanines'],
      support_crane: { ...defaults.support_crane, ...(parsed.support_crane ?? {}) },
      suspension_crane: { ...defaults.suspension_crane, ...(parsed.suspension_crane ?? {}) },
      stairs: { ...defaults.stairs, ...(parsed.stairs ?? {}) },
      parapet: { ...defaults.parapet, ...(parsed.parapet ?? {}) },
      walls: {
        ...defaults.walls,
        ...(parsed.walls ?? {}),
        windows: { ...defaults.walls.windows, ...(parsed.walls?.windows ?? {}) },
        gates: { ...defaults.walls.gates, ...(parsed.walls?.gates ?? {}) },
        doors: { ...defaults.walls.doors, ...(parsed.walls?.doors ?? {}) },
      },
      partitions: defaults.partitions.map((item, index) => ({
        ...item,
        ...(Array.isArray(parsed.partitions) ? parsed.partitions[index] ?? {} : {}),
      })) as CalculatorParams['partitions'],
      partition_openings: { ...defaults.partition_openings, ...(parsed.partition_openings ?? {}) },
      partition_gates: { ...defaults.partition_gates, ...(parsed.partition_gates ?? {}) },
      span_widths_m: Array.isArray(parsed.span_widths_m) ? parsed.span_widths_m : defaults.span_widths_m,
      frame_steps_m: Array.isArray(parsed.frame_steps_m) ? parsed.frame_steps_m : defaults.frame_steps_m,
    };
  } catch {
    return null;
  }
}

function normalize(params: CalculatorParams): CalculatorParams {
  const next = structuredClone(params);
  if (!VALID_ROOFS[next.system].includes(next.roof_type)) next.roof_type = 'two_slope';
  const maximumSpan = getMaximumSpan(next.system, next.roof_type);
  next.span_widths_m = next.span_widths_m.slice(0, 5).map((span) => Math.min(Number(span) || 0, maximumSpan));
  if (next.span_widths_m.length === 0) next.span_widths_m = [Math.min(12, maximumSpan)];
  if (next.system !== 'Великан') next.has_subtruss = false;
  next.support_crane.spans_count = Math.min(next.support_crane.spans_count, next.span_widths_m.length);
  next.suspension_crane.spans_count = Math.min(next.suspension_crane.spans_count, next.span_widths_m.length);
  return next;
}

function initialParams(): CalculatorParams {
  if (typeof window === 'undefined') return cloneDefaults();
  const payload = new URLSearchParams(window.location.search).get('data');
  return payload ? normalize(decodePayload(payload) ?? cloneDefaults()) : cloneDefaults();
}

export function useCalculator() {
  const [params, setParamsState] = useState<CalculatorParams>(initialParams);

  const setParams = useCallback((next: CalculatorParams | ((previous: CalculatorParams) => CalculatorParams)) => {
    setParamsState((previous) => normalize(typeof next === 'function' ? next(previous) : next));
  }, []);

  const updateParam = useCallback(<K extends keyof CalculatorParams>(key: K, value: CalculatorParams[K]) => {
    setParams((previous) => ({ ...previous, [key]: value }));
  }, [setParams]);

  const resetParams = useCallback(() => setParams(cloneDefaults()), [setParams]);
  const result = useMemo(() => calculate(params), [params]);

  useEffect(() => {
    const query = new URLSearchParams();
    query.set('v', '2');
    query.set('data', encodePayload(params));
    window.history.replaceState(null, '', `${window.location.pathname}?${query}`);
  }, [params]);

  const shareUrl = typeof window === 'undefined' ? '' : window.location.href;

  return {
    params,
    setParams,
    updateParam,
    resetParams,
    result,
    validationAlerts: result.issues,
    shareUrl,
  };
}

export { DEFAULT_PARAMS };
