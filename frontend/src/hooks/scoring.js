const ANSWER_SCORES = { Y: 2, P: 1, N: 0 }

function scoreToSeal(score, maxScore) {
  if (maxScore === 0) return 0
  const pct = score / maxScore
  if (pct <= 0.20) return 0
  if (pct <= 0.40) return 1
  if (pct <= 0.60) return 2
  if (pct <= 0.80) return 3
  return 4
}

/**
 * answers:   { provider: { qid: 'Y'|'P'|'N' } }
 * minSeals:  { sov_id: int }
 * objectives: from /api/framework
 * returns:   { provider: { SOV-1: { seal, min_seal, pass, score, max }, _score, _pass } }
 */
export function computeResults(answers, minSeals, objectives) {
  const results = {}

  for (const [provider, pans] of Object.entries(answers)) {
    results[provider] = {}
    const sovSeals = {}

    for (const [sovId, sov] of Object.entries(objectives)) {
      const qs = sov.questions
      const maxS = qs.length * 2
      const score = qs.reduce((acc, q) => acc + (ANSWER_SCORES[pans[q.id]] ?? 0), 0)
      const seal = scoreToSeal(score, maxS)
      const minSeal = minSeals[sovId] ?? sov.default_min_seal

      results[provider][sovId] = {
        seal,
        min_seal: minSeal,
        pass: seal >= minSeal,
        score,
        max: maxS,
      }
      sovSeals[sovId] = seal
    }

    const total = Object.entries(objectives).reduce((acc, [sovId, sov]) => {
      return acc + (sovSeals[sovId] / 4) * sov.weight
    }, 0)

    results[provider]['_score'] = Math.round(total * 1000) / 10
    results[provider]['_pass'] = Object.keys(objectives).every(s => results[provider][s].pass)
  }
  
  return results
}
