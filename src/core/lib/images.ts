import manifest from '../../../public/img/manifest.json'

export type ImageAsset = { src: string; w: number; h: number }

/**
 * Manifest de imagenes migradas del prototipo (public/img/manifest.json).
 * El acceso por slug es literal: un slug mal escrito falla en `tsc`.
 */
export const IMAGES = manifest satisfies Record<string, ImageAsset>
