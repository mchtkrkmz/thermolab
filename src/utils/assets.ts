export const BASE_URL = import.meta.env.BASE_URL || '/'

export const getAssetUrl = (path: string): string => {
  const base = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${base}${cleanPath}`
}
