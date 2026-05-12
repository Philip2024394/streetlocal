/**
 * imageCompress.js — Compress images before uploading to Supabase
 * Resizes to max 800px width and compresses to 70% JPEG quality
 * Reduces ~500KB photos to ~50-80KB
 */

/**
 * Compress an image file
 * @param {File} file — original image file from input
 * @param {object} options — { maxWidth, maxHeight, quality }
 * @returns {Promise<Blob>} — compressed image blob
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.7,
    type = 'image/jpeg',
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      // Draw to canvas
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Canvas toBlob failed'))
          }
        },
        type,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }

    img.src = url
  })
}

/**
 * Compress and return as File object (keeps filename)
 * @param {File} file — original file
 * @param {object} options
 * @returns {Promise<File>}
 */
export async function compressImageFile(file, options = {}) {
  // Skip non-images
  if (!file.type.startsWith('image/')) return file

  // Skip already small files (under 100KB)
  if (file.size < 100 * 1024) return file

  try {
    const blob = await compressImage(file, options)

    // Only use compressed if it's actually smaller
    if (blob.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, '.jpg')
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file // fallback to original on error
  }
}
