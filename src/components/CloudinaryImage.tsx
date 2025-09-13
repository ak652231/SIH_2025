"use client"

import type React from "react"
import { AdvancedImage, placeholder, responsive } from "@cloudinary/react"
import { Cloudinary } from "@cloudinary/url-gen"
import { quality, format } from "@cloudinary/url-gen/actions/delivery"
import { auto as autoQuality } from "@cloudinary/url-gen/qualifiers/quality"
import { auto as autoFormat } from "@cloudinary/url-gen/qualifiers/format"
import { scale } from "@cloudinary/url-gen/actions/resize"

interface CloudinaryImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  transformations?: ((image: any) => void)[]
}

const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  src,
  alt,
  width,
  height,
  className = "",
  transformations = [],
}) => {
  const getPublicId = (url: string): string => {
    if (!url.includes("cloudinary.com")) return url
    const regex = /\/image\/upload\/(?:v\d+\/)?([^/.]+)(?:\.\w+)?$/
    const match = url.match(regex)
    return match ? match[1] : url
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ""
  if (!cloudName) {
    console.error("Cloudinary cloud name is missing. Check your environment variables.")
    return null
  }

  const cld = new Cloudinary({ cloud: { cloudName } })
  const publicId = getPublicId(src)
  const myImage = cld.image(publicId)

  myImage.delivery(quality(autoQuality())).delivery(format(autoFormat()))

  if (width) myImage.resize(scale().width(width))
  if (height) myImage.resize(scale().height(height))

  transformations.forEach((transformation) => transformation(myImage))

  return (
    <AdvancedImage
      cldImg={myImage}
      plugins={[responsive({ steps: 100 }), placeholder({ mode: "blur" })]}
      className={className}
      alt={alt}
    />
  )
}

export default CloudinaryImage
