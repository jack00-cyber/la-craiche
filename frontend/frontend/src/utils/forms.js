export function omitEmptyValues(values) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )
}

export function normalizeNumberInput(value) {
  if (value === '' || value === null || value === undefined) {
    return ''
  }

  return Number(value)
}
