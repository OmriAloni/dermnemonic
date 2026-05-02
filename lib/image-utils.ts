/**
 * Compress an image file before uploading
 * Resizes to max 1920px width/height and compresses to ~85% quality
 */
export async function compressImage(file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not compress image'))
              return
            }

            // Create new file from blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })

            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = () => reject(new Error('Could not load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}
