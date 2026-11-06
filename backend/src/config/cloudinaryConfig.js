import dotenv from "dotenv"

import cloudinaryV2 from 'cloudinary'
import path from "path"
import sharp from "sharp"
import CustomError from "../middleware/custom-error.js"
import logger from "../middleware/logger.js"

const cloudinary = cloudinaryV2.v2

dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET
});

// Longest side of a stored image. Full-size phone photos made multi-image uploads slow enough for the
// hosting proxy to drop the request, which the browser reports as "Failed to fetch"
const MAX_IMAGE_SIDE = 2000
const UPLOAD_CONCURRENCY = 4

/** Uploads an express-fileupload file; images are auto-rotated and downsized first, other files (PDF slips) go as they are */
export const UploadImage = async (image) => {
    try {
        if (!image?.data) return { status: 404, message: `Upload a valid image` }
        const data = String(image.mimetype).startsWith("image/")
            ? await sharp(image.data).rotate().resize({ width: MAX_IMAGE_SIDE, height: MAX_IMAGE_SIDE, fit: "inside", withoutEnlargement: true }).toBuffer()
            : image.data

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream({ resource_type: 'auto', invalidate: true, overwrite: true }, (error, uploaded) => error ? reject(error) : resolve(uploaded))
                .end(data)
        })
        return { status: 200, media: result.secure_url }
    } catch (error) {
        const reason = error?.message ?? String(error)
        logger.error(`[upload] ${image?.name ?? "file"} failed: ${reason}`)
        return { status: 500, message: `Unable to upload ${image?.name ?? "the file"}: ${reason}` }
    }
}


export const DeleteImage = async (name) => {
    try {
        const splitImage = name.split('/')
        const getLastItem = splitImage[splitImage.length - 1]
        const removeExt = getLastItem.split('.')[0]

        await cloudinary.api.delete_resources([removeExt], { type: 'upload' })
        return { status: 200, message: "Deleted" }
    } catch (error) {
        return { status: 500, message: error }
    }
}

export const uploadMultipleImages = async (images) => {
  const validExtensions = [
    '.png',
    '.jpg',
    '.webp',
    '.jpeg',
  ]

  if (!images) throw new CustomError(400, `Upload a minimum of one image`)
  const imagesArray = Array.isArray(images) ? images : [images]
  // Check every file before uploading any
  for (const image of imagesArray) {
    const fileExtension = path.extname(image.name)
    if (!validExtensions.includes(fileExtension.toLowerCase())) {
      throw new CustomError(400, `${fileExtension} file type is not allowed`)
    }
  }

  // A few at a time, keeping the original order
  const results = []
  for (let i = 0; i < imagesArray.length; i += UPLOAD_CONCURRENCY) {
    results.push(...await Promise.all(imagesArray.slice(i, i + UPLOAD_CONCURRENCY).map((image) => UploadImage(image))))
  }

  const failed = results.filter((result) => result.status !== 200)
  if (failed.length) {
    // Don't leave the uploads that did succeed orphaned in Cloudinary
    await Promise.all(results.filter((result) => result.status === 200).map((result) => DeleteImage(result.media)))
    throw new CustomError(502, failed[0].message)
  }
  return results.map((result) => result.media)
}