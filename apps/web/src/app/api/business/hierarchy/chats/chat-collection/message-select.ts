export const MESSAGE_WITH_SENDER_SELECT = `
  *,
  sender:users!hierarchy_chat_messages_sender_id_fkey(
    id,
    display_name,
    first_name,
    last_name,
    email,
    profile_picture_url
  )
`
