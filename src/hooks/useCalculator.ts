import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PARAMS } from '../data/defaults';
import { calculate } from '../logic/calculator';
import { hydrateCalculatorParams } from '../logic/params';
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
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    if (typeof parsed !== 'object' || parsed === null || (parsed as { model_version?: unknown }).model_version !== 2) return null;
    return hydrateCalculatorParams(parsed);
  } catch {
    return null;
  }
}

function normalize(params: CalculatorParams): CalculatorParams {
  const next = hydrateCalculatorParams(params);
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
