import { useState } from "react";
import { supabase } from "@/lib/supabase";
import FileUpload from "@/components/ui/FileUpload";
import CertificateUpload from "@/components/ui/CertificateUpload";



const NATIONALITY_TO_CODE: Record<string, string> = {
  "india": "+91",
  "indian": "+91",
  "united arab emirates": "+971",
  "uae": "+971",
  "united kingdom": "+44",
  "uk": "+44",
  "british": "+44",
  "canada": "+1",
  "canadian": "+1",
  "united states": "+1",
  "us": "+1",
  "american": "+1",
  "pakistan": "+92",
  "pakistani": "+92",
  "bangladesh": "+880",
  "bangladeshi": "+880",
  "philippines": "+63",
  "filipino": "+63",
  "nepal": "+977",
  "nepalese": "+977",
  "egypt": "+20",
  "egyptian": "+20"
};

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
  const getRelativeDate = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  const fillSlaMet = () => {
    setFormData({
      employeeName: "Thomas Anderson",
      nationality: "Canada",
      countryCode: "+1",
      mobileNo: "5550199",
      trade: "Civil Engineer",
      laborType: "Site Labor",
      accommodation: "Camp A",
      passportNo: "PP9876543",
      visaStatus: "Active",
      employeeStatus: "Pending",
      onboardingStatus: "In Progress",
      remarks: "Testing SLA Met Case",
      dob: "1995-05-15",
      dateOfJoining: getRelativeDate(0), // Today
      passportExpiry: getRelativeDate(365 * 4), // 4 years in future
      visaExpiry: getRelativeDate(365), // 1 year in future
      passportInLocker: true
    });
  };

  const fillSlaBreach = () => {
    setFormData({
      employeeName: "Peter Mathew",
      nationality: "United Kingdom",
      countryCode: "+44",
      mobileNo: "7700900077",
      trade: "Electrician",
      laborType: "Office Labor",
      accommodation: "Downtown Staff House",
      passportNo: "PP1234567",
      visaStatus: "Expired",
      employeeStatus: "Pending",
      onboardingStatus: "In Progress",
      remarks: "Testing SLA Breach Case",
      dob: "1990-10-25",
      dateOfJoining: getRelativeDate(-5), // 5 days ago (triggers SLA breach)
      passportExpiry: getRelativeDate(365 * 4),
      visaExpiry: getRelativeDate(2), // Expiring in 2 days (triggers compliance warning)
      passportInLocker: false
    });
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    
    if (e.target.name === 'nationality') {
      const nationalityValue = value as string;
      const cleanKey = nationalityValue.toLowerCase().trim();
      const matchedCode = NATIONALITY_TO_CODE[cleanKey] || formData.countryCode;
      
      setFormData({ 
        ...formData, 
        nationality: nationalityValue, 
        countryCode: matchedCode 
      });
    } else {
      setFormData({ ...formData, [e.target.name]: value });
    }
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id: data[0].id, 
              ...formData,
              passportScanUrisJson,
              employeePhotoUrisJson,
              consentFormUrisJson,
              drivingLicenseUrisJson,
              certificatesJson
            })
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
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex gap-4 p-4 bg-gray-950 border border-gray-900 rounded-2xl">
          <button type="button" onClick={fillSlaMet} className="flex-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 px-4 py-3 rounded-xl text-sm font-bold transition-all">
            ⚡ Quick Fill (SLA Met)
          </button>
          <button type="button" onClick={fillSlaBreach} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-3 rounded-xl text-sm font-bold transition-all">
            ⚡ Quick Fill (SLA Breach)
          </button>
        </div>
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
          <FileUpload bucketName="new-assets" folderPath="onboarding/photos" onUploadComplete={setEmployeePhotoUrisJson} multiple={false} accept="image/*" capture={true} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Passport Scan</label>
          <FileUpload bucketName="new-assets" folderPath="onboarding/passports" onUploadComplete={setPassportScanUrisJson} multiple={true} capture={true} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Driving License</label>
          <FileUpload bucketName="new-assets" folderPath="onboarding/licenses" onUploadComplete={setDrivingLicenseUrisJson} multiple={true} capture={true} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Consent Form</label>
          <FileUpload bucketName="new-assets" folderPath="onboarding/consent" onUploadComplete={setConsentFormUrisJson} multiple={true} capture={true} />
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
