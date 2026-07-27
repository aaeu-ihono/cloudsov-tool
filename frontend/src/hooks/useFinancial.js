import { useState, useEffect } from 'react'

export function useFinancial() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('http://localhost:8000/api/financial')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setError(String(e)))
  }, [])

  return { data, error }
}
