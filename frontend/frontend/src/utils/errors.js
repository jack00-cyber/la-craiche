function flattenErrors(value) {
  if (!value) {
    return []
  }

  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenErrors)
  }

  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) =>
      flattenErrors(entry).map((message) => `${key}: ${message}`),
    )
  }

  return [String(value)]
}

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) {
    return fallback
  }

  if (typeof error === 'string') {
    return error
  }

  const responseData = error?.response?.data

  if (responseData) {
    const messages = flattenErrors(responseData)

    if (messages.length > 0) {
      return messages.join(' ')
    }
  }

  return error?.message || fallback
}
