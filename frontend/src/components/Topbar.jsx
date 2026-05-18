import { NavLink } from 'react-router-dom'

export default function Topbar() {
  return (
    <div className="topbar">
      <span className="logo">☁ CloudSov</span>
      <nav className="topbar-nav">
        <NavLink
          to="/sovscore"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
        >
          SovScore
        </NavLink>
        <NavLink
          to="/readiness"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
        >
          Readiness
        </NavLink>
      </nav>
    </div>
  )
}
