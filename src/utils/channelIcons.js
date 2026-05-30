import iconWhatsapp from '../assets/messengers/whatsapp-BtCgz4Tn.png'
import iconTelegram from '../assets/messengers/telegram-BwLyKQnC.png'
import iconWaba from '../assets/messengers/free-icon-whatsapp-4782351.png'
import iconVk from '../assets/messengers/icons8-vk-480.png'
import iconTgBot from '../assets/messengers/communication_16210663.png'

export const CHANNEL_ICON_MAP = {
  whatsapp_green: iconWhatsapp,
  telegram_user: iconTelegram,
  telegram_bot: iconTgBot,
  waba: iconWaba,
  vk: iconVk,
}

export const CHANNEL_TYPES = [
  { value: 'telegram_bot', label: 'Telegram Bot' },
  { value: 'telegram_user', label: 'Telegram User' },
  { value: 'whatsapp_green', label: 'WhatsApp Green' },
  { value: 'waba', label: 'WhatsApp Business' },
  { value: 'vk', label: 'VK' },
]

export function channelLabel(type) {
  switch (type) {
    case 'telegram_bot':   return 'Telegram Bot'
    case 'telegram_user':  return 'Telegram User'
    case 'whatsapp_green': return 'WhatsApp'
    case 'waba':           return 'WhatsApp Business'
    case 'vk':             return 'VK'
    default:               return type || 'Канал'
  }
}

export function getChannelIcon(type) {
  return CHANNEL_ICON_MAP[type] || null
}
