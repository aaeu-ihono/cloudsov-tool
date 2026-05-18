import { useState, useEffect } from 'react'

const API = 'http://localhost:8000'

export function useFramework() {
  const [framework, setFramework] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/framework`)
      .then(r => r.json())
      .then(setFramework)
      .catch(e => setError(e.message))
  }, [])

  return { framework, error }
}

export function useProviders() {
  const [providers, setProviders] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/providers`)
      .then(r => r.json())
      .then(setProviders)
      .catch(e => setError(e.message))
  }, [])

  return { providers, error }
}

export async function postScore(answers, minSeals) {
  const r = await fetch(`${API}/api/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, min_seals: minSeals }),
  })
  return r.json()
}
