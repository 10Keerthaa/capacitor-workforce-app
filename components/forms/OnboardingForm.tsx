import { useState } from "react";
import { supabase } from "@/lib/supabase";
import FileUpload from "@/components/ui/FileUpload";
import CertificateUpload from "@/components/ui/CertificateUpload";
import { Beaker } from "lucide-react";

export default function OnboardingForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: "", nationality: "", countryCode: "", mobileNo: "", trade: "", laborType: "", accommodation: "", passportNo: "", visaStatus: "", employeeStatus: "", onboardingStatus: "", remarks: "", dob: "", dateOfJoining: "", passportExpiry: "", visaExpiry: "", passportInLocker: false
  });
  
  const [passportScanUrisJson, setPassportScanUrisJson] = useState<string[]>([]);
  const [employeePhotoUrisJson, setEmployeePhotoUrisJson] = useState<string[]>([]);
  const [consentFormUrisJson, setConsentFormUrisJson] = useState<string[]>([]);
  const [drivingLicenseUrisJson, setDrivingLicenseUrisJson] = useState<string[]>([]);
  const [certificatesJson, setCertificatesJson] = useState<{name: string; urls: string[]}[]>([]);

  const handleQuickFill = () => {
    setFormData({
      employeeName: "Alex Mercer",
      nationality: "American",
      countryCode: "+971",
      mobileNo: "509988776",
      trade: "Welder",
      laborType: "Direct",
      accommodation: "City Center Premium Camp",
      passportNo: "W11223344",
      visaStatus: "Processing",
      employeeStatus: "Active",
      onboardingStatus: "Pending Medical",
      remarks: "Urgent NEW hire for Metro Station Alpha night shift welding.",
      dob: "1992-11-05",
      dateOfJoining: new Date().toISOString().split('T')[0],
      passportExpiry: "2032-11-05",
      visaExpiry: "2028-11-05",
      passportInLocker: false
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.from('employee_onboarding').insert([{ 
      ...formData, 
      passportScanUrisJson, 
      employeePhotoUrisJson, 
      consentFormUrisJson, 
      drivingLicenseUrisJson, 
      certificatesJson 
    }]).select();
    
    if (error) {
      alert("Error saving record: " + error.message);
    } else { 
      try {
        if (data && data.length > 0) {
          await fetch('/api/agents/onboarding', {
            method: 'POST',
            body: JSON.stringify({ id: data[0].id, ...formData })
          });
        }
      } catch (err) {
        console.error("Agent execution failed:", err);
      }
      alert("Record saved! Sent to AI for compliance check."); 
      setFormData({
        employeeName: "", nationality: "", countryCode: "", mobileNo: "", trade: "", laborType: "", accommodation: "", passportNo: "", visaStatus: "", employeeStatus: "", onboardingStatus: "", remarks: "", dob: "", dateOfJoining: "", passportExpiry: "", visaExpiry: "", passportInLocker: false
      });
      setPassportScanUrisJson([]);
      setEmployeePhotoUrisJson([]);
      setConsentFormUrisJson([]);
      setDrivingLicenseUrisJson([]);
      setCertificatesJson([]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button type="button" onClick={handleQuickFill} className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-500/30 transition-colors shadow-lg">
          <Beaker className="w-4 h-4" /> Quick Fill (Standard Hire)
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Details */}
        <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Personal Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-medium text-gray-300">Employee Name</label>
            <input required name="employeeName" value={formData.employeeName} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Date of Birth</label>
            <input type="date" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required name="dob" value={formData.dob} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Nationality</label>
            <input required name="nationality" value={formData.nationality} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Country Code</label>
            <input required name="countryCode" value={formData.countryCode} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+971" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Mobile No</label>
            <input required name="mobileNo" value={formData.mobileNo} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>
      </div>

      {/* Employment Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Employment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Trade</label>
            <input required name="trade" value={formData.trade} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Date of Joining</label>
            <input type="date" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required name="dateOfJoining" value={formData.dateOfJoining} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Office/Site Labor</label>
            <input required name="laborType" value={formData.laborType} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Accommodation</label>
            <input required name="accommodation" value={formData.accommodation} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>
      </div>

      {/* Documents & Visa */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Documents & Visa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Passport No</label>
            <input required name="passportNo" value={formData.passportNo} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Passport Expiry</label>
            <input type="date" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required name="passportExpiry" value={formData.passportExpiry} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Visa Status</label>
            <input required name="visaStatus" value={formData.visaStatus} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">EID & Visa Expiry</label>
            <input type="date" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required name="visaExpiry" value={formData.visaExpiry} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-300">Passport in Locker?</label>
            <select name="passportInLocker" value={formData.passportInLocker ? "true" : "false"} onChange={(e) => setFormData({...formData, passportInLocker: e.target.value === 'true'})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
        </div>
      </div>

      {/* File Uploads */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Attachments</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Employee Photo</label>
          <FileUpload bucketName="new-assets" folderPath="onboarding/photos" onUploadComplete={setEmployeePhotoUrisJson} multiple={false} accept="image/*" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Passport Scan</label>
          <FileUpload bucketName="new-assets" folderPath="onboarding/passports" onUploadComplete={setPassportScanUrisJson} multiple={true} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Driving License</label>
          <FileUpload bucketName="new-assets" folderPath="onboarding/licenses" onUploadComplete={setDrivingLicenseUrisJson} multiple={true} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Consent Form</label>
          <FileUpload bucketName="new-assets" folderPath="onboarding/consent" onUploadComplete={setConsentFormUrisJson} multiple={true} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Certificates</label>
          <CertificateUpload onCertificatesChange={setCertificatesJson} />
        </div>
      </div>
      
        <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
          {loading ? "Saving..." : "Save Record"}
        </button>
      </form>
    </div>
  );
}
