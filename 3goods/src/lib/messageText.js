/**
 * The one place a chat message becomes displayable text. A system message
 * (`systemCode` + `params`) is translated for whoever is looking at it right
 * now; a user-authored message (`text`) is shown exactly as typed and never
 * routed through `t()` — see DECISIONS.md D-016. Both `ChatList` (last
 * message preview) and `ChatDetail` (full thread) use this, so the two
 * screens can never drift on how a system message renders.
 */
export function getMessageText(message, t) {
  if (message?.systemCode) return t(`systemMessages.${message.systemCode}`, message.params ?? undefined);
  return message?.text ?? "";
}
