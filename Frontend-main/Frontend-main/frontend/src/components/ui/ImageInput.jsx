import { useRef, useState } from "react";
import axios from "axios";
import { Upload, ImageOff } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Reusable image field that accepts BOTH a pasted image URL and a file upload.
 * The value is always a string (a remote URL or an uploaded /resources/... path);
 * `onChange(nextString)` fires for either input method.
 *
 *   <ImageInput label="Course image" value={imageUrl} onChange={setImageUrl} />
 */
export default function ImageInput({
  value,
  onChange,
  label = "Image",
  placeholder = "Paste an image link (https://…) or upload →",
  className = "",
  previewClass = "h-24 w-24",
}) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [broken, setBroken] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${BACKEND_URL}/utility/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setBroken(false);
      onChange(res.data?.url || "");
    } catch (e) {
      console.error("Image upload failed:", e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ""}
          onChange={(e) => {
            setBroken(false);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files[0] && upload(e.target.files[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 rounded-md text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
        >
          <Upload size={15} /> {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>
      {value ? (
        broken ? (
          <p className="mt-2 flex items-center gap-1 text-xs text-red-500">
            <ImageOff size={13} /> This image link could not be loaded.
          </p>
        ) : (
          <img
            src={value}
            alt="preview"
            onError={() => setBroken(true)}
            className={`mt-2 rounded-md object-cover border border-gray-200 ${previewClass}`}
          />
        )
      ) : null}
    </div>
  );
}
