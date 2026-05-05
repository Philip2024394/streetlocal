/**
 * Renders an activity icon — custom image if available, otherwise emoji.
 * Usage: <ActivityIcon activity={activityObject} size={22} />
 *        <ActivityIcon emoji="🍺" size={22} />
 */
export default function ActivityIcon({ activity, emoji, size = 22, className = '' }) {
  const img = activity?.img
  const icon = activity?.emoji ?? emoji ?? '📍'

  if (img) {
    return (
      <img
        src={img}
        alt={activity?.label ?? ''}
        width={size}
        height={size}
        style={{ objectFit: 'contain', display: 'inline-block', verticalAlign: 'middle' }}
        className={className}
      />
    )
  }

  return <span className={className}>{icon}</span>
}
