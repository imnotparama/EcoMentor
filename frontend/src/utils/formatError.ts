/**
 * Formats API errors cleanly, extracts backend validation messages.
 */
export const formatError = (err: unknown, fallback: string): string => {
  const axiosErr = err as { response?: { data?: { detail?: unknown } } }
  const detail = axiosErr?.response?.data?.detail
  if (!detail) {
    return fallback
  }
  if (typeof detail === 'string') {
    return detail
  }
  if (Array.isArray(detail)) {
    return detail
      .map((d: any) => {
        const field = d.loc ? d.loc[d.loc.length - 1] : ''
        return field ? `${field}: ${d.msg}` : d.msg
      })
      .join(', ')
  }
  return fallback
}
