import { useState } from "react";
import FileUpload from "./FileUpload";

interface CertificateUploadProps {
  onCertificatesChange: (certs: { name: string; urls: string[] }[]) => void;
}

export default function CertificateUpload({ onCertificatesChange }: CertificateUploadProps) {
  const [certificates, setCertificates] = useState<{ name: string; urls: string[] }[]>([]);
  const [currentName, setCurrentName] = useState("");

  const handleUploadComplete = (urls: string[]) => {
    if (!currentName.trim() || urls.length === 0) return;
    
    const newCerts = [...certificates, { name: currentName, urls }];
    setCertificates(newCerts);
    onCertificatesChange(newCerts);
    setCurrentName(""); // reset for next
  };

  const removeCertificate = (index: number) => {
    const newCerts = [...certificates];
    newCerts.splice(index, 1);
    setCertificates(newCerts);
    onCertificatesChange(newCerts);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-300">Certificate Name</label>
          <input 
            value={currentName} 
            onChange={(e) => setCurrentName(e.target.value)} 
            placeholder="e.g. Safety Training 2026" 
            className="mt-1 w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" 
          />
        </div>
        {currentName.trim().length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Upload Files for {currentName}</label>
            <FileUpload bucketName="new-assets" folderPath="certificates" onUploadComplete={handleUploadComplete} multiple={true} />
          </div>
        )}
      </div>

      {certificates.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Uploaded Certificates</h4>
          {certificates.map((cert, idx) => (
            <div key={idx} className="flex justify-between items-start p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <div>
                <p className="text-white font-medium">{cert.name}</p>
                <p className="text-xs text-indigo-400 mt-1">{cert.urls.length} file(s) attached</p>
              </div>
              <button type="button" onClick={() => removeCertificate(idx)} className="text-red-400 hover:text-red-300 text-sm font-medium px-2 py-1 bg-red-400/10 rounded-lg">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
