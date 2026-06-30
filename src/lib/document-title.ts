/**
 * Update the browser tab title to show unread notification count.
 */
export function setUnreadTitle(count: number) {
  document.title = count > 0 ? `(${count}) Cogent Assets` : 'Cogent Assets'
}
