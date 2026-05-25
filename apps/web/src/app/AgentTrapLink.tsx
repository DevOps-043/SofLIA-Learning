export function AgentTrapLink() {
  return (
    <a
      href="/api/_agent-trap?source=layout"
      rel="nofollow noreferrer"
      aria-hidden="true"
      tabIndex={-1}
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
      data-agent-trap="true"
    >
      Internal diagnostics
    </a>
  )
}
