import React, { forwardRef, useState } from "react";
import { PiX } from "react-icons/pi";
import { SlCloudUpload } from "react-icons/sl";
import { getAlert } from "~/services/get-alert";

type ImageValue = {
  img: string | null;
  file: File | null;
};

type Props = {
  image: ImageValue;
  setImage: (val: ImageValue) => void;
  error?: string;
  title: string;
  removeImage: () => void;
};

const SingleFileUpload = forwardRef<HTMLInputElement, Props>(
  ({ image, setImage, error, title, removeImage }, ref) => {
    const [isDragging, setIsDragging] = useState(false);

    const validateAndSet = (file: File) => {
      if (!file.type.startsWith("image/")) {
        return getAlert("Upload a valid image", "error");
      }

      if (file.size > 3000000) {
        return getAlert("File cannot exceed 3MB", "error");
      }

      setImage({
        img: URL.createObjectURL(file),
        file,
      });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSet(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) validateAndSet(file);
    };

    return (
      <div className="w-full">
        <div className="text-sm mb-1 font-medium text-gray-700">
          {title}
        </div>

        <div className="relative">
          {image.img && (
            <div className="absolute top-0 left-0 w-full bg-black/60 flex justify-end p-2 rounded-t-lg text-white z-10">
              <PiX
                className="cursor-pointer text-xl"
                onClick={removeImage}
              />
            </div>
          )}

          <label
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={`block cursor-pointer transition ${
              isDragging
                ? "border-primary bg-primary/10 scale-[1.02]"
                : ""
            }`}
          >
            {!image.img ? (
              <div
                className={`border-2 rounded-xl flex flex-col items-center justify-center gap-3 py-6 px-3 transition
                  ${
                    error
                      ? "border-red-500"
                      : "border-gray-300 hover:bg-gray-100 bg-gray-50"
                  }`}
              >
                <SlCloudUpload className="text-3xl text-gray-500" />

                <div className="text-sm text-gray-500 text-center">
                  <span className="font-semibold text-primary">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </div>

                <div className="text-xs text-gray-400 text-center">
                  PNG, JPG, GIF up to 3MB
                </div>
              </div>
            ) : (
              <img
                src={image.img}
                alt="Preview"
                className="w-full h-60 object-cover rounded-lg"
              />
            )}

            <input
              ref={ref}
              type="file"
              hidden
              accept="image/*"
              onChange={handleChange}
            />
          </label>

          {error && (
            <div className="text-sm text-red-600 mt-1">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default SingleFileUpload;