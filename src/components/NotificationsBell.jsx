import { useEffect, useState } from 'react'
import { listerNotifications, marquerNotificationLue } from '../lib/useNotifications'
import './NotificationsBell.css'

export default function NotificationsBell({ profilId }) {
  const [notifications, setNotifications] = useState([])
  const [ouvert, setOuvert] = useState(false)

  async function charger() {
    const data = await listerNotifications(profilId)
    setNotifications(data)
  }

  useEffect(() => {
    charger()
  }, [profilId])

  const nonLues = notifications.filter((n) => !n.lu).length

  async function handleOuvrir() {
    setOuvert((o) => !o)
  }

  async function handleClicNotification(n) {
    if (!n.lu) {
      await marquerNotificationLue(n.id)
      charger()
    }
  }

  return (
    <div className="notifications-bell">
      <button className="notifications-bell-bouton" onClick={handleOuvrir}>
        🔔
        {nonLues > 0 && <span className="notifications-bell-badge">{nonLues}</span>}
      </button>

      {ouvert && (
        <div className="notifications-bell-liste">
          {notifications.length === 0 && (
            <p className="notifications-bell-vide">Aucune notification.</p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notifications-bell-item ${n.lu ? '' : 'non-lue'}`}
              onClick={() => handleClicNotification(n)}
            >
              <p>{n.contenu}</p>
              <span>{new Date(n.cree_le).toLocaleDateString('fr-FR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
