import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, X, Loader2 } from "lucide-react";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface FileUploadProps {
  bucketName: string;
  folderPath: string;
  onUploadComplete: (urls: string[]) => void;
  accept?: string;
  multiple?: boolean;
  capture?: "user" | "environment" | boolean;
}

export default function FileUpload({ bucketName, folderPath, onUploadComplete, accept = "*/*", multiple = true, capture }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = async () => {
    if (capture && Capacitor.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Prompt
        });
        
        if (image.webPath) {
          setUploading(true);
          const response = await fetch(image.webPath);
          const blob = await response.blob();
          
          const fileExt = image.format || 'jpeg';
          const fileName = `camera_capture_${Date.now()}.${fileExt}`;
          const filePath = `${folderPath}/${fileName}`;

          const { error } = await supabase.storage.from(bucketName).upload(filePath, blob, {
             contentType: `image/${fileExt}`
          });

          if (!error) {
            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
            const newFiles = [...files, { url: data.publicUrl, name: fileName }];
            setFiles(newFiles);
            onUploadComplete(newFiles.map(f => f.url));
          }
          setUploading(false);
        }
      } catch (err) {
        console.error("Camera error:", err);
        setUploading(false);
      }
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    const uploadedUrls: string[] = [];
    const newFiles = [...files];

    for (const file of Array.from(e.target.files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      const { error } = await supabase.storage.from(bucketName).upload(filePath, file);

      if (!error) {
        const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
        newFiles.push({ url: data.publicUrl, name: file.name });
      }
    }

    setFiles(newFiles);
    onUploadComplete(newFiles.map(f => f.url));
    setUploading(false);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onUploadComplete(newFiles.map(f => f.url));
  };

  return (
    <div className="space-y-4">
      <div 
        onClick={!uploading ? handleContainerClick : undefined}
        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-800 border-dashed rounded-xl bg-gray-950/50 transition-colors ${!uploading ? 'cursor-pointer hover:bg-gray-900' : 'cursor-not-allowed opacity-70'}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
          )}
          <p className="mb-2 text-sm text-gray-400 font-medium text-center">
            <span className="text-indigo-400">Click to upload</span><br/>
            {!capture && "or drag and drop"}
          </p>
        </div>
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          onChange={handleUpload} 
          accept={accept} 
          multiple={multiple} 
          disabled={uploading}
          {...(capture ? { capture: capture === true ? "environment" : capture } : {})}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li key={i} className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-lg">
              <span className="text-sm text-gray-300 truncate pr-4">{file.name}</span>
              <button type="button" onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 p-1">
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
