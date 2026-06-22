import { useState, useEffect, useRef, useCallback } from 'react'
import { useFramework, useProviders } from '../hooks/useApi'
import { computeResults } from '../hooks/scoring'

// ── Country flags ──────────────────────────────────────────────────────────
const PROVIDER_COUNTRY = {
  // Germany
  'Hetzner':                          'de',
  'IONOS':                            'de',
  'STACKIT':                          'de',
  'STACKIT (Schwarz Group)':          'de',
  'T-Systems OTC':                    'de',
  'T-Systems (T Cloud Public)':       'de',
  'Arvato Systems':                   'de',
  'noris network':                    'de',
  'Noris Network':                    'de',
  'plusserver':                       'de',
  'PlusServer':                       'de',
  // France
  'OVHcloud':                         'fr',
  'OVHcloud / Gridscale':             'fr',
  'Scaleway':                         'fr',
  // Sweden
  'Cleura':                           'se',
  'Elastx':                           'se',
  // Switzerland
  'Exoscale':                         'ch',
  'Infomaniak':                       'ch',
  'nine':                             'ch',
  'Nine':                             'ch',
  // Netherlands
  'Fuga Cloud':                       'nl',
  'Cyso Cloud':                       'nl',
  'Cyso Cloud (formerly Fuga Cloud)': 'nl',
  // Finland
  'UpCloud':                          'fi',
  // USA
  'AWS':                              'us',
}
function flagFor(p) {
  const code = PROVIDER_COUNTRY[p] ?? null
  return code ? <span className={`fi fi-${code} provider-flag`} /> : null
}

// ── Popover ────────────────────────────────────────────────────────────────
function Popover({ content, pos }) {
  if (!content || !pos) return null
  return (
    <div
      className="popover"
      style={{ left: pos.x + 14, top: pos.y - 10 }}
    >
      {content.question && (
        <div className="popover-question">{content.question}</div>
      )}
      {content.note && (
        <div className="popover-note">{content.note}</div>
      )}
      {content.source && (
        <div className="popover-source">Source: {content.source}</div>
      )}
    </div>
  )
}

// ── Seal chip ──────────────────────────────────────────────────────────────
function SealChip({ seal }) {
  return <span className={`seal-chip seal-${seal}`}>SEAL-{seal}</span>
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function SovScore() {
  const { framework, error: fwErr } = useFramework()
  const { providers: initialProviders, error: pvErr } = useProviders()

  // answers: { provider: { qid: 'Y'|'P'|'N' } }
  const [answers, setAnswers] = useState({})
  // evidence: { provider: { qid: { note, source } } } — from JSON, read-only
  const [evidence, setEvidence] = useState({})
  // summaryNotes: { provider: string }
  const [summaryNotes, setSummaryNotes] = useState({})
  // provider list (ordered)
  const [providerList, setProviderList] = useState([])
  // min seals: { sov_id: int }
  const [minSeals, setMinSeals] = useState({})
  // computed results
  const [results, setResults] = useState({})
  // new provider input
  const [newName, setNewName] = useState('')
  // popover state
  const [popover, setPopover] = useState({ content: null, pos: null })
  // legend open/closed
  const [legendOpen, setLegendOpen] = useState(true)
  // score column sort
  const [sortOrder, setSortOrder] = useState(null) // null | 'desc' | 'asc'

  // Initialise state once both fetches resolve
  useEffect(() => {
    if (!framework || !initialProviders) return

    const initAnswers = {}
    const initEvidence = {}
    const initSummary = {}
    const names = Object.keys(initialProviders)

    for (const name of names) {
      initAnswers[name] = { ...initialProviders[name].answers }
      initEvidence[name] = initialProviders[name].evidence ?? {}
      initSummary[name] = initialProviders[name].summary_note ?? null
    }

    setAnswers(initAnswers)
    setEvidence(initEvidence)
    setSummaryNotes(initSummary)
    setProviderList(names)
    setMinSeals({ ...framework.default_min_seals })
  }, [framework, initialProviders])

  // Recompute whenever answers or minSeals change
  useEffect(() => {
    if (!framework || Object.keys(answers).length === 0) return
    const r = computeResults(answers, minSeals, framework.objectives)
    setResults(r)
  }, [answers, minSeals, framework])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleToggle = useCallback((provider, qid, val) => {
    setAnswers(prev => ({
      ...prev,
      [provider]: { ...prev[provider], [qid]: val },
    }))
  }, [])

  const handleMinSeal = useCallback((sovId, val) => {
    setMinSeals(prev => ({ ...prev, [sovId]: Number(val) }))
  }, [])

  const handleAddProvider = useCallback(() => {
    const name = newName.trim()
    if (!name || providerList.includes(name)) return
    setProviderList(prev => [...prev, name])
    setAnswers(prev => ({ ...prev, [name]: {} }))
    setEvidence(prev => ({ ...prev, [name]: {} }))
    setNewName('')
  }, [newName, providerList])

  const handleRemoveProvider = useCallback((name) => {
    if (!window.confirm(`Remove "${name}"?`)) return
    setProviderList(prev => prev.filter(p => p !== name))
    setAnswers(prev => { const n = { ...prev }; delete n[name]; return n })
    setEvidence(prev => { const n = { ...prev }; delete n[name]; return n })
  }, [])

  const handleClearProvider = useCallback((name) => {
    setAnswers(prev => ({ ...prev, [name]: {} }))
  }, [])

  const handleSortScore = useCallback(() => {
    setSortOrder(prev => prev === null ? 'desc' : prev === 'desc' ? 'asc' : null)
  }, [])

  const handleResetAll = useCallback(() => {
    if (!window.confirm('Reset all answers and providers to initial state?')) return
    if (!framework || !initialProviders) return
    const initAnswers = {}
    const initEvidence = {}
    const names = Object.keys(initialProviders)
    for (const name of names) {
      initAnswers[name] = { ...initialProviders[name].answers }
      initEvidence[name] = initialProviders[name].evidence ?? {}
    }
    setAnswers(initAnswers)
    setEvidence(initEvidence)
    setProviderList(names)
    setMinSeals({ ...framework.default_min_seals })
  }, [framework, initialProviders])

  // ── Popover handlers ──────────────────────────────────────────────────────

  const showPopover = useCallback((content, e) => {
    setPopover({ content, pos: { x: e.clientX, y: e.clientY } })
  }, [])

  const movePopover = useCallback((e) => {
    setPopover(prev => prev.content ? { ...prev, pos: { x: e.clientX, y: e.clientY } } : prev)
  }, [])

  const hidePopover = useCallback(() => {
    setPopover({ content: null, pos: null })
  }, [])

  // ── Loading / error states ─────────────────────────────────────────────────
  if (fwErr || pvErr) return (
    <div className="content" style={{ color: '#dc2626' }}>
      API error: {fwErr || pvErr}. Is the FastAPI server running on port 8000?
    </div>
  )
  if (!framework || !initialProviders || providerList.length === 0) return (
    <div className="content" style={{ color: '#6b7280' }}>Loading…</div>
  )

  const objectives = framework.objectives
  const sealDescs = framework.seal_descriptions
  const sovIds = Object.keys(objectives)

  // Sorted display list (original order preserved in providerList state)
  const displayList = sortOrder === null
    ? providerList
    : [...providerList].sort((a, b) => {
        const sa = results[a]?._score ?? -1
        const sb = results[b]?._score ?? -1
        return sortOrder === 'desc' ? sb - sa : sa - sb
      })

  // Flatten all questions in order for column rendering
  const allQuestions = sovIds.flatMap(sovId =>
    objectives[sovId].questions.map((q, qi) => ({ sovId, q, qi }))
  )
  const totalQCols = allQuestions.length

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="content" onMouseMove={movePopover}>
      <Popover content={popover.content} pos={popover.pos} />

      {/* Header */}
      <div className="ss-header">
        <div>
          <div className="ss-title">SovScore</div>
          <div className="ss-sub">
            EU Cloud Sovereignty Assessment · EC DG DIGIT Cloud Sovereignty Framework v1.2.1 – Oct. 2025
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
          <select
            className="ctrl-select"
            defaultValue=""
            onChange={e => { if (e.target.value) handleClearProvider(e.target.value); e.target.value = '' }}
          >
            <option value="">Clear a provider…</option>
            {providerList.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="ctrl-btn ctrl-danger" onClick={handleResetAll}>Reset all</button>
        </div>
      </div>

      {/* Grid */}
      <div className="table-wrap">
        <table className="grid">
          <thead>
            {/* Row 1: SOV group headers */}
            <tr>
              <th className="th-provider" rowSpan={2}>Provider</th>
              {sovIds.map(sovId => {
                const sov = objectives[sovId]
                return (
                  <th key={sovId} className="th-sov" colSpan={sov.questions.length}>
                    <div className="sov-label">{sovId}</div>
                    <div className="sov-name">{sov.name}</div>
                    <div className="sov-weight">{Math.round(sov.weight * 100)}%</div>
                    <div className="sov-min-wrap">
                      <span className="sov-min-label">min</span>
                      <select
                        className="min-seal-select"
                        value={minSeals[sovId] ?? sov.default_min_seal}
                        onChange={e => handleMinSeal(sovId, e.target.value)}
                      >
                        {[0, 1, 2, 3, 4].map(i => (
                          <option key={i} value={i}>SEAL-{i}</option>
                        ))}
                      </select>
                      {sov.min_seal_reason && (
                        <span
                          className="sov-reason-icon"
                          onMouseEnter={e => showPopover({
                            question: `${sovId}: ${sov.name} — why SEAL-${minSeals[sovId] ?? sov.default_min_seal} minimum?`,
                            note: sov.min_seal_reason,
                          }, e)}
                          onMouseLeave={hidePopover}
                        >ⓘ</span>
                      )}
                    </div>
                  </th>
                )
              })}
              <th
                className={`th-score th-score-sort${sortOrder ? ' th-score-active' : ''}`}
                rowSpan={2}
                onClick={handleSortScore}
                title="Click to sort by score"
              >
                Score
                <span className="score-sort-icon">
                  {sortOrder === 'desc' ? ' ↓' : sortOrder === 'asc' ? ' ↑' : ' ↕'}
                </span>
              </th>
            </tr>

            {/* Row 2: Q column headers */}
            <tr>
              {allQuestions.map(({ sovId, q, qi }) => (
                <th
                  key={q.id}
                  className={'th-q' + (qi === 0 ? ' sov-group-start' : '')}
                  onMouseEnter={e => showPopover({ question: q.text }, e)}
                  onMouseLeave={hidePopover}
                >
                  Q{qi + 1}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {displayList.map(provider => {
              const pAnswers = answers[provider] ?? {}
              const pEvidence = evidence[provider] ?? {}
              const pResults = results[provider] ?? {}
              const score = pResults['_score']
              const pass = pResults['_pass']

              return (
                <>
                  {/* Provider answer row */}
                  <tr key={`row-${provider}`} className="provider-row">
                    <td className="td-provider">
                      <span 
                        className="provider-name"
                        onMouseEnter={e => showPopover({ question: provider, note: summaryNotes[provider] }, e)}
                        onMouseLeave={hidePopover}
                      >{flagFor(provider)}{provider}</span>
                      <button
                        className="remove-btn"
                        title="Remove"
                        onClick={() => handleRemoveProvider(provider)}
                      >×</button>
                    </td>

                    {allQuestions.map(({ sovId, q, qi }) => {
                      const current = pAnswers[q.id] ?? ''
                      const ev = pEvidence[q.id]
                      const hasEvidence = ev && (ev.note || ev.source)

                      return (
                        <td
                          key={q.id}
                          className={'td-ans' + (qi === 0 ? ' sov-group-start' : '')}
                          onMouseEnter={hasEvidence
                            ? e => showPopover({ question: q.text, note: ev.note, source: ev.source }, e)
                            : e => showPopover({ question: q.text }, e)
                          }
                          onMouseLeave={hidePopover}
                        >
                          <div className="tog-group">
                            {['Y', 'P', 'N'].map(val => (
                              <button
                                key={val}
                                className={`tog tog-${val.toLowerCase()}${current === val ? ' active' : ''}`}
                                onClick={() => handleToggle(provider, q.id, val)}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </td>
                      )
                    })}

                    <td className="td-score">
                      {score !== undefined
                        ? <span className={`score-val ${pass ? 'score-pass' : 'score-fail'}`}>{score}%</span>
                        : '—'}
                    </td>
                  </tr>

                  {/* SEAL sub-row */}
                  <tr key={`seal-${provider}`} className="seal-subrow">
                    <td className="td-seal-sublabel">SEAL</td>
                    {sovIds.map(sovId => {
                      const r = pResults[sovId]
                      return (
                        <td
                          key={sovId}
                          className={'td-seal-sub' + (r ? (r.pass ? ' seal-sub-pass' : ' seal-sub-fail') : '')}
                          colSpan={objectives[sovId].questions.length}
                        >
                          {r
                            ? <><SealChip seal={r.seal} /><span className="seal-min-note">/ min {r.min_seal}</span></>
                            : '—'}
                        </td>
                      )
                    })}
                    <td className="td-seal-sub" />
                  </tr>
                </>
              )
            })}

            {/* Add provider row */}
            <tr className="add-row">
              <td className="td-provider td-add">
                <input
                  className="new-provider-input"
                  placeholder="New provider…"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddProvider()}
                />
                <button className="add-provider-btn" onClick={handleAddProvider}>+ Add</button>
              </td>
              <td className="td-add-spacer" colSpan={totalQCols} />
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="legend">
        <div
          className={`legend-title${legendOpen ? '' : ' collapsed'}`}
          onClick={() => setLegendOpen(o => !o)}
        >
          Legend
        </div>
        <div className={`legend-body${legendOpen ? '' : ' hidden'}`}>
          <div className="legend-grid">
            <div className="legend-section">
              <p className="legend-heading">SEAL levels</p>
              {Object.entries(sealDescs).map(([i, desc]) => (
                <div key={i} className="legend-row">
                  <SealChip seal={Number(i)} />
                  <span className="legend-desc">{desc}</span>
                </div>
              ))}
            </div>
            <div className="legend-section">
              <p className="legend-heading">Answer values</p>
              {[
                { val: 'Y', cls: 'tog-y', label: 'Yes — fully meets the criterion (2 pts)' },
                { val: 'P', cls: 'tog-p', label: 'Partial — partly meets the criterion (1 pt)' },
                { val: 'N', cls: 'tog-n', label: 'No — does not meet the criterion (0 pts)' },
              ].map(({ val, cls, label }) => (
                <div key={val} className="legend-row">
                  <span className={`tog ${cls} active leg-tog`}>{val}</span>
                  <span className="legend-desc">{label}</span>
                </div>
              ))}

              <p className="legend-heading" style={{ marginTop: '1.2rem' }}>Sovereignty score formula</p>
              <p className="legend-desc">Score = Σ (SEAL<sub>n</sub> ÷ 4) × Weight<sub>n</sub> · expressed as % (0–100)</p>
              <p className="legend-desc" style={{ marginTop: '0.3rem' }}>
                SOV-1 15% · SOV-2 10% · SOV-3 10% · SOV-4 15% · SOV-5 20% · SOV-6 15% · SOV-7 10% · SOV-8 5%
              </p>

              <p className="legend-heading" style={{ marginTop: '1.2rem' }}>SOV objectives</p>
              {sovIds.map(sovId => (
                <div key={sovId} className="legend-row">
                  <span className="sov-tag">{sovId}</span>
                  <span className="legend-desc">
                    {objectives[sovId].name} ({Math.round(objectives[sovId].weight * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="legend-source">
            Source: European Commission DG DIGIT, <em>Cloud Sovereignty Framework v1.2.1</em>, October 2025.{' '}
            <a href="https://commission.europa.eu/document/download/09579818-64a6-4dd5-9577-446ab6219113_en" target="_blank" rel="noreferrer">
              View document ↗
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
