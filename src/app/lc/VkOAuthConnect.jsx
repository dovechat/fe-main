import { useEffect, useState } from 'react'
import Button from './Button'
import { startVkOAuth, confirmVkOAuth, mockConnectVk } from '../../api/lines'


export default function VkOAuthConnect({ tenantId, lineId, onDone }) {
  const [groups, setGroups] = useState(null)
  const [payload, setPayload] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get('payload')
    const err = params.get('error')
    if (err) setError(err)
    if (p) {
      setPayload(p)
      const gs = params.getAll('g').map(item => {
        const [id, name] = item.split(':')
        return { id: Number(id), name }
      })
      setGroups(gs)
    }
  }, [])

  /*
  const handleConnect = async () => {
    const { authorize_url } = await startVkOAuth(tenantId, lineId)
    window.location.href = authorize_url
  }
  */

  const handleConnect = async () => {
    await mockConnectVk(tenantId, lineId)  // вместо startVkOAuth/redirect
    onDone()
  }

  const handleSelectGroup = async (groupId) => {
    await confirmVkOAuth(payload, groupId)
    onDone()
  }

  if (error) {
    return <p className="dc-muted-xs">Ошибка подключения VK: {error}</p>
  }

  if (groups) {
    return (
      <div className="dc-fe-stack">
        <p>Выберите сообщество:</p>
        {groups.map(g => (
          <Button type="button" key={g.id} onClick={() => handleSelectGroup(g.id)}>
            {g.name}
          </Button>
        ))}
      </div>
    )
  }

  return <Button type="button" onClick={handleConnect}>Подключить VK</Button>
}