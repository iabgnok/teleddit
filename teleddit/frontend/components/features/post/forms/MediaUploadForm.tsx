import { useRef, useState } from "react";
import { Upload, X, Video as VideoIcon } from "lucide-react";
import { uploadFile } from "@/lib/api/client";

interface MediaUploadFormProps {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  coverIndex: number;
  setCoverIndex: React.Dispatch<React.SetStateAction<number>>;
  richContent: string;
  setRichContent: React.Dispatch<React.SetStateAction<string>>;
}

export default function MediaUploadForm({
  images,
  setImages,
  coverIndex,
  setCoverIndex,
  richContent,
  setRichContent
}: MediaUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setIsUploading(true);
    const files = Array.from(e.target.files);
    const newUrls: string[] = [];
    
    try {
      // Limit to max 9 items
      const remainingSlots = 9 - images.length;
      if (remainingSlots <= 0) return;
      
      const filesToUpload = files.slice(0, remainingSlots);
      
      // Upload in parallel
      const uploadPromises = filesToUpload.map(file => uploadFile(file));
      const results = await Promise.all(uploadPromises);
      
      results.forEach(res => {
        if (res.url) newUrls.push(res.url);
      });
      
      setImages(prev => [...prev, ...newUrls]);
    } catch (err) {
      console.error(err);
      alert("上传失败，请重试");
    } finally {
      setIsUploading(false);
      // Reset input value to allow selecting same file again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="community-y-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="grid grid-cols-4 gap-3">
        {images.map((img, idx) => {
          const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(img);
          return (
            <div key={idx} onClick={() => setCoverIndex(idx)}
              className={`relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer
                transition-all
                ${coverIndex === idx
                  ? "border-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.3)] scale-[0.97]"
                  : "border-white/8 hover:border-white/25"}`}>
              {isVideo ? (
                <video src={img} className="w-full h-full object-cover" muted autoPlay loop playsInline />
              ) : (
                <img src={img} className="w-full h-full object-cover" alt="" />
              )}
              {isVideo && (
                <div className="absolute top-2 left-2 bg-black/50 p-1 rounded-full">
                  <VideoIcon size={12} className="text-white" />
                </div>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const n = images.filter((_, i) => i !== idx);
                  setImages(n);
                  if (coverIndex >= n.length) setCoverIndex(0);
                }}
                className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/70 rounded-full
                  flex items-center justify-center hover:bg-red-600 transition-colors z-10">
                <X size={10} className="text-white" />
              </button>
              <div className={`absolute bottom-0 inset-x-0 text-[9px] text-center py-0.5 font-black
                ${coverIndex === idx ? "bg-blue-500 text-white" : "bg-black/60 text-slate-400"}`}>
                {coverIndex === idx ? "封面" : `图 ${idx + 1}`}
              </div>
            </div>
          );
        })}
        {images.length < 9 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-2xl border-2 border-dashed border-white/8
              flex flex-col items-center justify-center text-slate-600
              hover:border-white/20 hover:text-slate-400 hover:bg-white/2 transition-all group disabled:opacity-50 disabled:cursor-not-allowed">
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin mb-1.5" />
            ) : (
              <Upload size={18} className="group-hover:scale-110 transition-transform mb-1.5" />
            )}
            <span className="text-[10px] font-bold uppercase">{isUploading ? "上传中" : "上传"}</span>
            <span className="text-[9px] text-slate-700">{images.length}/9</span>
          </button>
        )}
      </div>
      <textarea placeholder="图片说明（可选）" value={richContent}
        onChange={(e) => setRichContent(e.target.value)} rows={2}
        className="w-full bg-white/3 rounded-xl px-4 py-3 text-[13px] text-slate-300
          placeholder:text-slate-600 border border-white/5
          focus:outline-none focus:border-white/12 resize-none transition-all mt-3" />
    </div>
  );
}
