export function trimMsg(msg: JSON | void): string | void {
  if (!msg) return undefined
  return Buffer.from(JSON.stringify(msg)).toString('base64')
}