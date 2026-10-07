import { useEffect, useReducer, useState } from 'react'
import './App.css'

const phases = [
  { name: 'North / South green', short: 'N/S GO', duration: 8, ns: 'green', ew: 'red', color: '#53d68a' },
  { name: 'North / South amber', short: 'N/S WARN', duration: 3, ns: 'amber', ew: 'red', color: '#f4b942' },
  { name: 'East / West green', short: 'E/W GO', duration: 8, ns: 'red', ew: 'green', color: '#53d68a' },
  { name: 'East / West amber', short: 'E/W WARN', duration: 3, ns: 'red', ew: 'amber', color: '#f4b942' },
]

const ioPoints = [
  { address: 'I0.0', name: 'System start', type: 'INPUT', state: 'ON', on: true },
  { address: 'I0.1', name: 'Emergency stop', type: 'INPUT', state: 'OK', on: true },
  { address: 'Q0.0', name: 'N/S green lamp', type: 'OUTPUT', state: 'OFF', on: false },
  { address: 'Q0.1', name: 'N/S amber lamp', type: 'OUTPUT', state: 'OFF', on: false },
  { address: 'Q0.2', name: 'N/S red lamp', type: 'OUTPUT', state: 'ON', on: true },
  { address: 'Q0.3', name: 'E/W green lamp', type: 'OUTPUT', state: 'OFF', on: false },
  { address: 'Q0.4', name: 'E/W amber lamp', type: 'OUTPUT', state: 'OFF', on: false },
  { address: 'Q0.5', name: 'E/W red lamp', type: 'OUTPUT', state: 'ON', on: true },
]

function controllerReducer(state, action) {
  if (action === 'tick') {
    if (state.remaining > 1) return { ...state, remaining: state.remaining - 1 }
    const phaseIndex = (state.phaseIndex + 1) % phases.length
    return { phaseIndex, remaining: phases[phaseIndex].duration }
  }
  if (action === 'reset') return { phaseIndex: 0, remaining: phases[0].duration }
  return state
}

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    ladder: <><path d="M5 3v18M19 3v18M5 7h14M5 12h14M5 17h14" /><path d="M10 5v4M14 10v4M9 15v4" /></>,
    pins: <><path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M3 15v4a2 2 0 0 0 2 2h4M21 15v4a2 2 0 0 1-2 2h-4" /><circle cx="12" cy="12" r="3" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
    play: <path d="m8 5 12 7-12 7z" />,
    pause: <><path d="M8 5h3v14H8zM15 5h3v14h-3z" /></>,
    reset: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function BrandMark() {
  return <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
}

function TrafficSignal({ direction, position, active }) {
  return (
    <div className={`signal ${direction.toLowerCase()} ${position}`} aria-label={`${direction} signal`}>
      <span className={`lamp red ${active === 'red' ? 'lit' : ''}`} />
      <span className={`lamp amber ${active === 'amber' ? 'lit' : ''}`} />
      <span className={`lamp green ${active === 'green' ? 'lit' : ''}`} />
    </div>
  )
}

function Intersection({ phase }) {
  return (
    <div className="intersection" role="img" aria-label={`Traffic intersection: North and South ${phase.ns}, East and West ${phase.ew}`}>
      <div className="road road-horizontal" />
      <div className="road road-vertical" />
      <div className="road-center center-top" />
      <div className="road-center center-bottom" />
      <div className="road-center center-left" />
      <div className="road-center center-right" />
      <div className="crosswalk crosswalk-top" />
      <div className="crosswalk crosswalk-bottom" />
      <div className="crosswalk crosswalk-left" />
      <div className="crosswalk crosswalk-right" />
      <span className="direction-label direction-n">N</span>
      <span className="direction-label direction-e">E</span>
      <span className="direction-label direction-s">S</span>
      <span className="direction-label direction-w">W</span>
      <TrafficSignal direction="NS" position="north" active={phase.ns} />
      <TrafficSignal direction="EW" position="east" active={phase.ew} />
      <TrafficSignal direction="NS" position="south" active={phase.ns} />
      <TrafficSignal direction="EW" position="west" active={phase.ew} />
    </div>
  )
}

function DiagramContact({ x, y, label, normallyClosed = false }) {
  return (
    <g>
      <line x1={x} y1={y - 17} x2={x} y2={y + 17} className="diagram-contact" />
      <line x1={x + 28} y1={y - 17} x2={x + 28} y2={y + 17} className="diagram-contact" />
      {normallyClosed && <line x1={x - 3} y1={y + 18} x2={x + 31} y2={y - 18} className="diagram-contact" />}
      <text x={x + 14} y={y - 25} textAnchor="middle" className="diagram-label">{label}</text>
    </g>
  )
}

function CircuitDiagram({ activePhase }) {
  const rungs = [
    { input: 'M0.0', output: 'Q0.0  N/S GREEN', phases: [0] },
    { input: 'M0.1', output: 'Q0.1  N/S AMBER', phases: [1] },
    { input: 'M0.2 ∨ M0.3', output: 'Q0.2  N/S RED', phases: [2, 3] },
    { input: 'M0.2', output: 'Q0.3  E/W GREEN', phases: [2] },
    { input: 'M0.3', output: 'Q0.4  E/W AMBER', phases: [3] },
    { input: 'M0.0 ∨ M0.1', output: 'Q0.5  E/W RED', phases: [0, 1] },
  ]
  return (
    <svg id="circuit-diagram" className="circuit-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 580" role="img" aria-labelledby="diagram-title diagram-description">
      <title id="diagram-title">PLC traffic-light ladder logic circuit</title>
      <desc id="diagram-description">Six PLC output rungs decode four interlocked traffic phases. Four on-delay timers determine each phase duration.</desc>
      <style>{`.diagram-background{fill:#f6f6f0;stroke:#e9eae1}.diagram-title{fill:#344439;font:700 13px Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:1.5px}.diagram-subtitle,.diagram-footer,.diagram-rail-label{fill:#8b958a;font:700 8px Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:1px}.diagram-chip{fill:#eaf1e8;stroke:#dce8db}.diagram-chip-dot{fill:#57ac70}.diagram-chip-text{fill:#618066;font:700 8px Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.7px}.diagram-rail{stroke:#98a299;stroke-width:1.3}.diagram-wire{stroke:#aeb6ac;stroke-width:1.4}.diagram-contact{stroke:#78867a;stroke-width:1.8}.diagram-label{fill:#727f73;font:600 8px Inter,ui-sans-serif,system-ui,sans-serif}.diagram-timer{fill:#f1f3ec;stroke:#cfd6ca;stroke-width:1}.diagram-timer-title{fill:#556558;font:700 9px Inter,ui-sans-serif,system-ui,sans-serif}.diagram-timer-time{fill:#879186;font:7px Inter,ui-sans-serif,system-ui,sans-serif}.diagram-coil{fill:#f6f6f0;stroke:#748276;stroke-width:1.5}.diagram-output{fill:#536155;font:600 8px Inter,ui-sans-serif,system-ui,sans-serif}.diagram-rung.active .diagram-wire,.diagram-rung.active .diagram-contact{stroke:#48a56a}.diagram-rung.active .diagram-timer{fill:#e5f1e5;stroke:#8fc39a}.diagram-rung.active .diagram-coil{fill:#79d395;stroke:#41975d}.diagram-rung.active .diagram-output{fill:#2e7a48;font-weight:700}.diagram-rung-number{fill:#9ba397;font:600 9px Inter,ui-sans-serif,system-ui,sans-serif}.diagram-divider{stroke:#e4e6dc}.diagram-legend-live{fill:#65c780}`}</style>
      <rect width="1040" height="560" rx="18" className="diagram-background" />
      <text x="44" y="53" className="diagram-title">INTERSECTION SEQUENCE</text>
      <text x="44" y="78" className="diagram-subtitle">PLC LADDER LOGIC · 24 V DC · CYCLE TIME 22 SEC</text>
      <rect x="822" y="28" width="172" height="34" rx="17" className="diagram-chip" />
      <circle cx="842" cy="45" r="4" className="diagram-chip-dot" />
      <text x="855" y="49" className="diagram-chip-text">IEC 61131-3 · LD</text>
      <text x="142" y="111" className="diagram-timer-time">PHASE TIMER SEQUENCE</text>
      {['T1 · 8s', 'T2 · 3s', 'T3 · 8s', 'T4 · 3s'].map((timer, index) => (
        <g key={timer}>
          <rect x={313 + index * 145} y="96" width="91" height="26" rx="5" className="diagram-timer" />
          <text x={358 + index * 145} y="113" textAnchor="middle" className="diagram-timer-title">{timer}</text>
        </g>
      ))}
      <line x1="142" y1="146" x2="142" y2="487" className="diagram-rail" />
      <line x1="842" y1="146" x2="842" y2="487" className="diagram-rail" />
      <text x="117" y="138" className="diagram-rail-label">L+</text>
      <text x="834" y="138" className="diagram-rail-label">M</text>
      {rungs.map((rung, index) => {
        const y = 174 + index * 52
        const isActive = rung.phases.includes(activePhase)
        return (
          <g key={rung.input} className={isActive ? 'diagram-rung active' : 'diagram-rung'}>
            <text x="58" y={y + 5} className="diagram-rung-number">{String(index + 1).padStart(2, '0')}</text>
            <line x1="142" y1={y} x2="290" y2={y} className="diagram-wire" />
            <DiagramContact x={290} y={y} label={rung.input} />
            <line x1="318" y1={y} x2="842" y2={y} className="diagram-wire" />
            <circle cx="842" cy={y} r="7" className="diagram-coil" />
            <text x="858" y={y + 5} className="diagram-output">{rung.output}</text>
          </g>
        )
      })}
      <line x1="44" y1="505" x2="996" y2="505" className="diagram-divider" />
      <circle cx="56" cy="534" r="4" className="diagram-legend-live" />
      <text x="69" y="538" className="diagram-footer">GREEN = CURRENTLY ACTIVE OUTPUT</text>
      <text x="995" y="538" textAnchor="end" className="diagram-footer">PROJECT 01 / TRAFFIC CONTROL</text>
    </svg>
  )
}

function Header({ selectedTab, running, onToggle, onReset }) {
  const title = selectedTab === 'overview' ? 'Intersection overview' : selectedTab === 'ladder' ? 'Ladder logic' : 'I/O map'
  return (
    <header className="topbar">
      <div className="breadcrumbs"><span>PROJECTS</span><Icon name="chevron" size={14} /><span>TRAFFIC CONTROL</span><Icon name="chevron" size={14} /><strong>{title}</strong></div>
      <div className="topbar-actions">
        <span className={`plc-status ${running ? 'online' : ''}`}><span className="status-dot" />{running ? 'PLC ONLINE' : 'PLC STANDBY'}</span>
        <button className="icon-button" type="button" onClick={onReset} aria-label="Reset sequence" title="Reset sequence"><Icon name="reset" /></button>
        <button className="button button-run" type="button" onClick={onToggle}><Icon name={running ? 'pause' : 'play'} size={16} />{running ? 'Pause' : 'Run simulation'}</button>
      </div>
    </header>
  )
}

function Overview({ phase, phaseIndex, remaining, running, onToggle, onOpenLadder }) {
  return (
    <>
      <section className="welcome-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" />PLC TRAINING SIMULATOR</div>
          <h1>Make the intersection <span>flow.</span></h1>
          <p className="intro">A live, timer-driven traffic controller built with programmable logic.</p>
        </div>
        <div className="project-tag"><span className="project-tag-icon"><BrandMark /></span><span><strong>Intersection A</strong><small>PLC-01 · 24V DC</small></span><span className="tag-divider" /><span className="tag-live"><i />LIVE</span></div>
      </section>
      <section className="metric-row">
        <article className="metric-card">
          <span className="metric-label">ACTIVE PHASE <span className="metric-index">0{phaseIndex + 1} / 04</span></span>
          <div className="metric-phase"><span className="phase-indicator" style={{ '--phase-color': phase.color }} />{phase.short}</div>
          <div className="metric-foot">{phase.name}<span className="live-copy">{running ? 'SEQUENCE RUNNING' : 'SEQUENCE PAUSED'}</span></div>
        </article>
        <article className="metric-card countdown-card">
          <span className="metric-label">TIME REMAINING <span className="timer-caption">SEC</span></span>
          <div className="countdown">{String(remaining).padStart(2, '0')}<span>s</span></div>
          <div className="countdown-track"><span style={{ width: `${(remaining / phase.duration) * 100}%` }} /></div>
        </article>
        <article className="metric-card cycle-card">
          <span className="metric-label">CYCLE DURATION <span className="metric-index">AUTO</span></span>
          <div className="cycle-total">22 <span>sec</span></div>
          <div className="cycle-stages"><i className="stage-green" /><i className="stage-amber" /><i className="stage-green" /><i className="stage-amber" /></div>
          <div className="metric-foot">4 phases · continuous loop</div>
        </article>
      </section>
      <section className="workspace-grid">
        <article className="panel intersection-panel">
          <div className="panel-heading">
            <div><span className="section-kicker">FIELD VIEW</span><h2>Live intersection</h2></div>
            <span className="live-badge"><i />SIMULATING</span>
          </div>
          <Intersection phase={phase} />
          <div className="intersection-legend"><span><i className="legend-ns" />NORTH / SOUTH</span><span><i className="legend-ew" />EAST / WEST</span><button type="button" className="text-button" onClick={onToggle}>{running ? 'Pause sequence' : 'Resume sequence'} <Icon name="chevron" size={14} /></button></div>
        </article>
        <article className="panel sequence-panel">
          <div className="panel-heading"><div><span className="section-kicker">PLC SEQUENCE</span><h2>Phase timeline</h2></div><span className="sequence-loop">↻ LOOP</span></div>
          <div className="phase-list">
            {phases.map((item, index) => (
              <div key={item.short} className={`phase-row ${phaseIndex === index ? 'selected' : ''}`}>
                <span className={`phase-number ${phaseIndex === index ? 'current' : ''}`}>{String(index + 1).padStart(2, '0')}</span>
                <span className="phase-description"><strong>{item.name}</strong><small>{item.ns === 'green' ? 'N/S green · E/W red' : item.ns === 'amber' ? 'N/S amber · E/W red' : item.ew === 'green' ? 'E/W green · N/S red' : 'E/W amber · N/S red'}</small></span>
                <span className="phase-duration">{item.duration}<small>s</small></span>
              </div>
            ))}
          </div>
          <div className="sequence-note"><span className="note-icon">i</span><span>Interlocked phases prevent conflicting green signals.</span></div>
        </article>
      </section>
      <section className="panel logic-preview">
        <div className="panel-heading"><div><span className="section-kicker">CONTROL PROGRAM</span><h2>Ladder logic preview</h2></div><span className="logic-meta">6 RUNGS <i /> IEC 61131-3</span></div>
        <CircuitDiagram activePhase={phaseIndex} />
        <div className="logic-bottom"><span><i className="legend-active" />Highlighted rung follows the active traffic phase</span><button type="button" onClick={onOpenLadder}>View full circuit <Icon name="chevron" size={14} /></button></div>
      </section>
    </>
  )
}

function LadderPage({ phaseIndex }) {
  const [exportMessage, setExportMessage] = useState('')

  async function exportDiagram(format) {
    const svg = document.getElementById('circuit-diagram')
    if (!(svg instanceof SVGSVGElement)) {
      setExportMessage('The circuit diagram is not available to export.')
      return
    }
    const source = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const link = document.createElement('a')
    const filename = 'traffic-light-plc-circuit'
    if (format === 'svg') {
      const downloadUrl = URL.createObjectURL(svgBlob)
      link.href = downloadUrl
      link.download = `${filename}.svg`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
      setExportMessage('Circuit diagram exported as SVG.')
      return
    }
    let imageUrl
    try {
      const image = new Image()
      imageUrl = URL.createObjectURL(svgBlob)
      image.src = imageUrl
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = () => reject(new Error('The circuit diagram could not be rendered as an image.'))
      })
      const canvas = document.createElement('canvas')
      canvas.width = 2080
      canvas.height = 1120
      const context = canvas.getContext('2d')
      if (!context) throw new Error('PNG export is not supported by this browser.')
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const pngBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('The PNG image could not be created.')), 'image/png')
      })
      const downloadUrl = URL.createObjectURL(pngBlob)
      link.href = downloadUrl
      link.download = `${filename}.png`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
      setExportMessage('Circuit diagram exported as PNG.')
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : 'The circuit diagram could not be exported.')
    } finally {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }

  return (
    <section className="panel ladder-page">
      <div className="panel-heading">
        <div><span className="section-kicker">IEC 61131-3 · LADDER DIAGRAM</span><h2>Traffic-light controller</h2><p className="panel-description">Timer-driven outputs alternate traffic flow while keeping conflicting approaches interlocked.</p></div>
        <div className="export-actions"><button className="button button-outline" type="button" onClick={() => exportDiagram('svg')}><Icon name="download" size={16} />Export SVG</button><button className="button button-dark" type="button" onClick={() => exportDiagram('png')}><Icon name="download" size={16} />Export PNG</button></div>
      </div>
      <div className="diagram-wrap"><CircuitDiagram activePhase={phaseIndex} /></div>
      <div className="diagram-key"><span><i className="key-contact" />Normally open contact</span><span><i className="key-timer" />On-delay timer (TON)</span><span><i className="key-coil" />Output coil</span><span><i className="legend-active" />Active rung</span></div>
      {exportMessage && <p className="export-message" role="status">{exportMessage}</p>}
      <div className="ladder-notes"><div><span className="note-index">01</span><span><strong>Sequence bits</strong><small>M0.0–M0.3 represent the four mutually exclusive traffic phases.</small></span></div><div><span className="note-index">02</span><span><strong>On-delay timers</strong><small>TON timers hold green for 8 s and amber for 3 s before advancing.</small></span></div><div><span className="note-index">03</span><span><strong>Output coils</strong><small>Q0.0–Q0.5 drive the six signal lamps for both approaches.</small></span></div></div>
    </section>
  )
}

function IoPage({ running, phase }) {
  const active = new Set(phase.ns === 'green' ? ['Q0.0', 'Q0.5'] : phase.ns === 'amber' ? ['Q0.1', 'Q0.5'] : phase.ew === 'green' ? ['Q0.2', 'Q0.3'] : ['Q0.2', 'Q0.4'])
  return (
    <section className="panel io-page">
      <div className="panel-heading"><div><span className="section-kicker">PLC HARDWARE</span><h2>Input / output map</h2><p className="panel-description">Live digital addresses for the intersection controller.</p></div><span className={`plc-status ${running ? 'online' : ''}`}><span className="status-dot" />{running ? 'PLC ONLINE' : 'PLC STANDBY'}</span></div>
      <div className="io-table-wrap"><table className="io-table"><thead><tr><th>ADDRESS</th><th>TAG / DEVICE</th><th>TYPE</th><th>STATE</th></tr></thead><tbody>{ioPoints.map((point) => {
        const isOn = point.type === 'OUTPUT' ? active.has(point.address) : point.on
        return <tr key={point.address}><td><code>{point.address}</code></td><td className="io-name">{point.name}</td><td><span className={`io-type ${point.type.toLowerCase()}`}>{point.type}</span></td><td><span className={`io-state ${isOn ? 'on' : ''}`}><i />{isOn ? point.type === 'INPUT' && point.address === 'I0.1' ? 'OK' : 'ON' : 'OFF'}</span></td></tr>
      })}</tbody></table></div>
      <div className="io-footnote"><span className="note-icon">i</span><span>I0.1 is normally closed and shown healthy in this simulator; real emergency-stop behavior requires hardware wiring.</span></div>
    </section>
  )
}

export default function App() {
  const [controller, dispatch] = useReducer(controllerReducer, { phaseIndex: 0, remaining: phases[0].duration })
  const [running, setRunning] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')
  const { phaseIndex, remaining } = controller
  const phase = phases[phaseIndex]

  useEffect(() => {
    if (!running) return undefined
    const interval = window.setInterval(() => dispatch('tick'), 1000)
    return () => window.clearInterval(interval)
  }, [running])

  function resetSequence() {
    setRunning(false)
    dispatch('reset')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setSelectedTab('overview')}><BrandMark /><span>signal<span className="brand-dot">.</span><small>PLC STUDIO</small></span></a>
        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace-switcher" type="button"><span className="workspace-avatar">A</span><span><strong>Automation lab</strong><small>Personal workspace</small></span><span className="switcher-caret">⌄</span></button>
        <div className="sidebar-section-label">PROJECT</div>
        <nav className="side-nav" aria-label="Project navigation">
          <button type="button" className={`nav-item ${selectedTab === 'overview' ? 'active' : ''}`} onClick={() => setSelectedTab('overview')}><Icon name="grid" /><span>Overview</span><span className="nav-active-mark" /></button>
          <button type="button" className={`nav-item ${selectedTab === 'ladder' ? 'active' : ''}`} onClick={() => setSelectedTab('ladder')}><Icon name="ladder" /><span>Ladder logic</span><span className="nav-count">06</span></button>
          <button type="button" className={`nav-item ${selectedTab === 'io' ? 'active' : ''}`} onClick={() => setSelectedTab('io')}><Icon name="pins" /><span>I/O map</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="controller-card"><div className="controller-top"><span className="controller-icon"><BrandMark /></span><span className={`controller-connection ${running ? 'connected' : ''}`} /></div><strong>PLC-01</strong><span>Compact controller</span><div className="controller-divider" /><div className="controller-meta"><span>CPU</span><strong>SIMULATED</strong></div></div>
          <button className="help-link" type="button" onClick={() => setSelectedTab('ladder')}><span className="help-icon">?</span>How ladder logic works<Icon name="chevron" size={14} /></button>
          <div className="user-row"><span className="user-avatar">M</span><span><strong>Milan</strong><small>Student plan</small></span><span className="user-menu">•••</span></div>
        </div>
      </aside>
      <main className="main-area">
        <Header selectedTab={selectedTab} running={running} onToggle={() => setRunning((value) => !value)} onReset={resetSequence} />
        <div className="page-content">
          {selectedTab === 'overview' && <Overview phase={phase} phaseIndex={phaseIndex} remaining={remaining} running={running} onToggle={() => setRunning((value) => !value)} onOpenLadder={() => setSelectedTab('ladder')} />}
          {selectedTab === 'ladder' && <LadderPage phaseIndex={phaseIndex} />}
          {selectedTab === 'io' && <IoPage running={running} phase={phase} />}
          <footer className="page-footer"><span>Signal PLC Studio <i /> Traffic controller demo</span><span>SIMULATION ONLY · NOT FOR ROAD USE</span></footer>
        </div>
      </main>
    </div>
  )
}
