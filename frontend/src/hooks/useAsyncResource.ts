import { useState, useCallback, useRef, useEffect } from 'react'

interface AsyncResourceState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

export function useAsyncResource<T>(fetchFn: (signal?: AbortSignal) => Promise<T>, initialData: T | null = null) {
  const [state, setState] = useState<AsyncResourceState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
  })

  const cache = useRef<T | null>(initialData)
  const abortControllerRef = useRef<AbortController | null>(null)

  const execute = useCallback(async (ignoreCache = false) => {
    if (!ignoreCache && cache.current) {
      setState(s => ({ ...s, data: cache.current, error: null }))
      return cache.current
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setState(s => ({ ...s, isLoading: true, error: null }))

    try {
      const result = await fetchFn(controller.signal)
      if (!controller.signal.aborted) {
        cache.current = result
        setState({ data: result, isLoading: false, error: null })
      }
      return result
    } catch (err: unknown) {
      if (!controller.signal.aborted) {
        setState(s => ({ ...s, isLoading: false, error: err instanceof Error ? err.message : 'Failed to fetch data' }))
      }
      throw err
    }
  }, [fetchFn])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const setData = useCallback((newData: T | null | ((prev: T | null) => T | null)) => {
    setState(s => {
      const updated = typeof newData === 'function' ? (newData as (prev: T | null) => T | null)(s.data) : newData
      cache.current = updated
      return { ...s, data: updated }
    })
  }, [])

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    execute,
    setData,
  }
}
