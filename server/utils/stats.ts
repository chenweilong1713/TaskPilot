export function getDateRangeFromQuery(query: Record<string, unknown>) {
  const start = parseDateQuery(query.start)
  const end = parseDateQuery(query.end)

  if (!start && !end) return {}

  return {
    dueTime: {
      ...(start ? { gte: start } : {}),
      ...(end ? { lte: end } : {})
    }
  }
}

export function parseDateQuery(value: unknown) {
  if (typeof value !== 'string' || !value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
