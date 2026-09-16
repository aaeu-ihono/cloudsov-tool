export default function LoadingSpinner({
  message = 'Loading…',
  detail = "If this hasn't been visited in a while, the backend may take up to a minute or two to wake back up — this is normal, not an error.",
}) {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      <div className="loading-msg">{message}</div>
      {detail && <div className="loading-detail">{detail}</div>}
    </div>
  )
}
