import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads/properties')
const MAX_FILES = 6
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif']
])

function ensureDataUrl(dataUrl = '') {
  const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return {
    mimeType: match[1],
    base64: match[2]
  }
}

function sanitizeBaseName(name = 'property-image') {
  return String(name)
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'property-image'
}

function buildPublicUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/uploads/properties/${filename}`
}

export async function uploadPropertyImages(req, res) {
  try {
    const files = Array.isArray(req.body?.files) ? req.body.files : []

    if (!files.length) {
      return res.status(400).json({ message: 'No image files were provided for upload.' })
    }

    if (files.length > MAX_FILES) {
      return res.status(400).json({ message: `You can upload up to ${MAX_FILES} images at a time.` })
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true })

    const savedFiles = []

    for (let index = 0; index < files.length; index += 1) {
      const incomingFile = files[index]
      const parsed = ensureDataUrl(incomingFile?.dataUrl)

      if (!parsed) {
        return res.status(400).json({ message: 'One or more selected files are invalid images.' })
      }

      const extension = ALLOWED_MIME_TYPES.get(parsed.mimeType)
      if (!extension) {
        return res.status(400).json({ message: 'Only JPG, PNG, WEBP, and GIF images are allowed.' })
      }

      const buffer = Buffer.from(parsed.base64, 'base64')
      if (buffer.length > MAX_FILE_SIZE_BYTES) {
        return res.status(400).json({ message: 'Each image must be 5MB or smaller.' })
      }

      const safeName = sanitizeBaseName(incomingFile?.name)
      const filename = `${Date.now()}-${index}-${safeName}.${extension}`
      await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer)

      savedFiles.push({
        url: buildPublicUrl(req, filename),
        source: 'local-upload',
        uploadedAt: new Date().toISOString(),
        originalName: incomingFile?.name || filename
      })
    }

    res.status(201).json({
      success: true,
      files: savedFiles
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to upload property images.' })
  }
}
