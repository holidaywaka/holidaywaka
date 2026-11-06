

import { PiPlus } from "react-icons/pi"
import { SlCloudUpload } from "react-icons/sl"
import { BsX } from "react-icons/bs"
import { useState } from "react"
import { getAlert } from "~/services/get-alert"
import Formbutton from "~/components/general/Formbutton"

type ComponentProps = {
    images: imageProps[]
    setImages: (value: any) => void
    error: string
    title: string
    removeImage: (values: string) => void
    removeAllImages: (values: string[]) => void
}

const ImageTypes = ["image/png", "image/jpeg", "image/webp"]

export type imageProps = {
    id?: number
    file?: File | null
    img?: string | null
}


export default function FileUploader({ images, setImages, error, title, removeImage, removeAllImages }: ComponentProps) {
    const [isDragging, setIsDragging] = useState(false)


    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const getFiles: FileList | null = e.target.files
        const files = Array.from(getFiles ?? [])
        validateAndSet(files)
    }

    function validateAndSet(files: File[]) {
        if (files.length < 1) return false

        // Mirrors the server's upload rule (png, jpg, jpeg, webp); check every file, not just the last
        const invalid = files.find(file => !ImageTypes.includes(file.type))
        if (invalid) return getAlert(`${invalid.name} is not allowed. Upload PNG, JPG or WEBP images`, "error")
        const oversized = files.find(file => file.size > 3000000)
        if (oversized) return getAlert(`${oversized.name} exceeds 3MB`, "error")

        const loadFiles: imageProps[] = files.map((file, i) => ({
            id: Date.now() + i,
            img: URL.createObjectURL(file),
            file,
        }))
        return setImages([...images, ...loadFiles])
    }


    function clearAllAction() {
        // Saved images are deleted from the server immediately, not on submit
        if (images.some(ele => ele.img?.startsWith("http")) && !window.confirm("Delete all saved images now? This cannot be undone.")) return
        setImages([])
        // send to backend only images with http attached
        const values: string[] = []
        images.forEach(ele => {
            if (ele.img?.startsWith("http")) values.push(ele.img)
        })
        removeAllImages(values)
    }

    function HandleRemoval(values: string) {
        if (values?.startsWith("http") && !window.confirm("Delete this saved image now? This cannot be undone.")) return
        if (values?.startsWith("blob:")) URL.revokeObjectURL(values)
        setImages(images.filter(ele => ele.img !== values))
        if (values?.startsWith("http")) return removeImage(values)
    }

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const getFiles: FileList | null = e.dataTransfer.files && e.dataTransfer.files
        const files = Array.from(getFiles ?? [])
        validateAndSet(files)
    };

    function handleDragOver(e: React.DragEvent<HTMLLabelElement>) {
        e.preventDefault()
        setIsDragging(true)
    }

    function handleDragLeave(e: React.DragEvent<HTMLLabelElement>) {
        e.preventDefault()
        setIsDragging(false)
    }

    return (
        <>
            <div className="text-sm">{title}</div>
            <div className='relative w-full mb-4'>

                {images.length < 1 &&
                    <label
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`cursor-pointer relative block transition-all duration-200
                            ${isDragging ? "border-primary-dark bg-primary-dark/10 rounded-xl scale-[1.02]" : ""}
                        `}
                    >
                        <div className={`border-2 ${error ? 'border-red-600' : 'border-gray-200'} cursor-pointer rounded-xl flex items-center justify-center flex-col gap-3 py-5`}>
                            <SlCloudUpload className="text-3xl" />
                            <div className="text-zinc-500 text-sm text-center"> <span className="text-primary-dark font-bold">Click to upload images</span> <span>or drag and drop</span> </div>
                            <div className="text-xs text-zinc-500 text-center">PNG, JPG or WEBP, max 3MB each</div>
                        </div>
                        <input type="file" multiple hidden accept={ImageTypes.join(",")} onChange={(e) => { handleImageChange(e); e.target.value = "" }} />
                    </label>}

                {images.length > 0 && <div className={`border-2 ${error ? 'border-red-600' : 'border-gray-200'} rounded-xl p-1 sm:p-3 lg:p-5`}>

                    <div className="flex flex-wrap items-center sm:justify-between gap-3">
                        <div className="text-sm flex items-center gap-2">
                            <div className="">{images.length} images uploaded</div>
                            <div className="">
                                <label>
                                    <div className="border rounded-full size-6 border-gray-300 flex items-center justify-center cursor-pointer hover:scale-95 transition-all">
                                        <PiPlus />
                                    </div>
                                    <input type="file" multiple hidden accept={ImageTypes.join(",")} onChange={(e) => { handleImageChange(e); e.target.value = "" }} />
                                </label>
                            </div>
                        </div>
                        <div className=""> <Formbutton onClick={clearAllAction} type="button" title="Remove all uploads" bg="text-red-600 py-1 border-0 px-2 !text-xs" /> </div>
                    </div>
                    <div className="w-full">
                        <div className="w-fit overflow-x-auto scrollsdown">
                            <div className="flex flex-row flex-wrap items-center gap-2 py-2">
                                {images.map((item, index) => (
                                    item.img && <div className="relative size-[4.1rem] mx-auto" key={index}>
                                        <div
                                            onClick={() => HandleRemoval(String(item.img))}
                                            className="absolute -top-2 right-0 cursor-pointer text-red-600 hover:scale-95 transition-all bg-white border border-gray-100 z-10 rounded-full size-6 flex items-center justify-center"> <BsX /> </div>
                                        <img src={item.img} className="size-[4.1rem] hover:brightness-75 transition-all" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>}
                {error && <div className="text-sm text-red-700">{error}</div>}
            </div>
        </>
    )
}
