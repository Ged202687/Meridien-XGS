import { useEffect, useRef, useState } from 'react'
import { listerNotifications, marquerNotificationLue } from '../lib/useNotifications'
import { IconeCloche } from './Icones'
import './NotificationsBell.css'

export default function NotificationsBell({ profilId }) {
  const [notifications, setNotifications] = useState([])
  const [ouvert, setOuvert] = useState(false)
  const zone = useRef(null)

  async function charger() {
    const data = await listerNotifications(profilId)
    setNotifications(data)
  }

  useEffect(() => {
    charger()
  }, [profilId])

  // Un clic ailleurs ou Échap referme la liste.
  useEffect(() => {
    if (!ouvert) return
    const clic = (e) => { if (!zone.current?.contains(e.target)) setOuvert(false) }
    const touche = (e) => { if (e.key === 'Escape') setOuvert(false) }
    document.addEventListener('mousedown', clic)
    document.addEventListener('keydown', touche)
    return () => {
      document.removeEventListener('mousedown', clic)
      document.removeEventListener('keydown', touche)
    }
  }, [ouvert])

  const nonLues = notifications.filter((n) => !n.lu).length

  async function handleClicNotification(n) {
    if (!n.lu) {
      await marquerNotificationLue(n.id)
      charger()
    }
  }

  return (
    <div className="notifications-bell" ref={zone}>
      <button
        type="button"
        className="notifications-bell-bouton"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-label={nonLues > 0 ? `Notifications, ${nonLues} non lue${nonLues > 1 ? 's' : ''}` : 'Notifications'}
      >
        <IconeCloche taille={18} />
        {nonLues > 0 && <span className="notifications-bell-badge" aria-hidden="true">{nonLues}</span>}
      </button>

      {ouvert && (
        <div className="notifications-bell-liste">
          {notifications.length === 0 && (
            <p className="notifications-bell-vide">Aucune notification.</p>
          )}
          {notifications.map((n) => (
            <button
              type="button"
              key={n.id}
              className={`notifications-bell-item ${n.lu ? '' : 'non-lue'}`}
              onClick={() => handleClicNotification(n)}
            >
              <p>{n.contenu}</p>
              <span>{new Date(n.cree_le).toLocaleDateString('fr-FR')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
