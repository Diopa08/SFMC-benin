export interface JwtPayload {
  sub: string       // email
  roles: string[]
  iat: number
  exp: number
}

/**
 * Décode un JWT en gérant correctement le format base64url (RFC 7515).
 * atob() natif ne supporte pas les caractères '-' et '_' du base64url
 * ni l'absence de padding '=' — ce correctif est obligatoire.
 */
export function decodeJwt(token: string): JwtPayload {
  try {
    const raw = token.split('.')[1]
    // base64url → base64 standard
    const base64 = raw.replace(/-/g, '+').replace(/_/g, '/')
    // Ajouter le padding manquant
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
    const payload = JSON.parse(atob(padded))
    // Normaliser : 'roles' peut être un tableau ou une chaîne unique
    if (!Array.isArray(payload.roles)) {
      payload.roles = payload.roles ? [payload.roles] : []
    }
    return payload
  } catch {
    return { sub: '', roles: [], iat: 0, exp: 0 }
  }
}

export function isTokenExpired(token: string): boolean {
  const { exp } = decodeJwt(token)
  return Date.now() / 1000 > exp
}
