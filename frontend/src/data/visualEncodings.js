export const ENTITY_TYPE_COLORS = {
  Person: '#4477aa',
  Song: '#228833',
  Album: '#eeaa33',
  RecordLabel: '#aa3377',
  MusicalGroup: '#66ccee',
  Unknown: '#64748b',
}

export const ENTITY_TYPE_ORDER = [
  'Person',
  'Song',
  'Album',
  'RecordLabel',
  'MusicalGroup',
  'Unknown',
]

export function entityTypeColor(type) {
  return ENTITY_TYPE_COLORS[type] ?? ENTITY_TYPE_COLORS.Unknown
}
