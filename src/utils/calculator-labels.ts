import type {
  PartitionKind,
  RoofCladding,
  WallCladding,
} from '../types/calculator';

export const ROOF_CLADDING_LABELS: Record<RoofCladding, string> = {
  profile: 'Профлист',
  pvc: 'ПВХ-мембрана',
  sandwich_layer: 'Сэндвич-панели послойной сборки',
  sandwich: 'Сэндвич-панели заводские',
};

export const WALL_CLADDING_LABELS: Record<WallCladding, string> = {
  none: 'Без стен',
  profile: 'Профлист',
  sandwich_layer: 'Сэндвич-панели послойной сборки',
  sandwich: 'Сэндвич-панели заводские',
};

export const PARTITION_KIND_LABELS: Record<PartitionKind, string> = {
  gvl: 'ГВЛ',
  sandwich_layer: 'Сэндвич-панели послойной сборки',
  sandwich: 'Сэндвич-панели заводские',
};
