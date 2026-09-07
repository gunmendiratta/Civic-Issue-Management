import { v2 as cloudinary } from 'cloudinary'

const configured = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
if (configured) cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true })

export async function uploadImages(files = []) {
  if (!files.length) return []
  if (!configured) throw new Error('Cloudinary storage is not configured.')
  return Promise.all(files.map((file) => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'civicconnect/issues', resource_type: 'image' }, (error, result) => {
      if (error) return reject(error)
      resolve({ url: result.secure_url, publicId: result.public_id })
    })
    stream.end(file.buffer)
  })))
}
