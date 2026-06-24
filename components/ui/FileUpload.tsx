import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, X, Loader2 } from "lucide-react";

interface FileUploadProps {
  bucketName: string;
  folderPath: string;
  onUploadComplete: (urls: string[]) => void;
  accept?: string;
  multiple?: boolean;
}

export default function FileUpload({ bucketName, folderPath, onUploadComplete, accept = "*/*", multiple = true }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);

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
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-800 border-dashed rounded-xl cursor-pointer bg-gray-950/50 hover:bg-gray-900 transition-colors">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
          )}
          <p className="mb-2 text-sm text-gray-400 font-medium">
            <span className="text-indigo-400">Click to upload</span> or drag and drop
          </p>
        </div>
        <input type="file" className="hidden" onChange={handleUpload} accept={accept} multiple={multiple} disabled={uploading} />
      </label>

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
