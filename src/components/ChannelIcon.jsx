import { getChannelIcon } from '../utils/channelIcons'

export default function ChannelIcon({ channelType, size = 32, className = '' }) {
  const src = getChannelIcon(channelType)
  const style = { width: size, height: size }

  if (!src) {
    return (
      <div className={`dc-channel-icon dc-channel-icon--default ${className}`.trim()} style={style} aria-hidden />
    )
  }

  return (
    <div className={`dc-channel-icon ${className}`.trim()} style={style}>
      <img src={src} alt="" draggable={false} />
    </div>
  )
}
