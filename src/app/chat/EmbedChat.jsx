import { useParams, useSearchParams } from 'react-router-dom'
import ConversationPage from '../chat/ConversationPage'

export default function EmbedChat() {
  const { conversationId } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  return <ConversationPage conversationId={conversationId} embedToken={token} />
}