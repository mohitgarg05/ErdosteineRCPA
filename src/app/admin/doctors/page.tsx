'use client';

import React, { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  Upload,
  Search,
  Building2,
  MapPin,
  Phone,
  Stethoscope,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface DoctorItem {
  _id: string;
  name: string;
  specialty: string;
  clinicHospital: string;
  cityLocation: string;
  phone?: string;
  createdAt?: string;
}

export default function DoctorMasterPage() {
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Doctor Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newHospital, setNewHospital] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isSubmittingDoctor, setIsSubmittingDoctor] = useState(false);
  const [addDoctorError, setAddDoctorError] = useState('');

  // Bulk Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    insertedCount?: number;
    skippedCount?: number;
    message?: string;
  } | null>(null);
  const [importError, setImportError] = useState('');

  const fetchDoctors = async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/doctors?q=${encodeURIComponent(query)}&limit=100`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load doctors');
      }
      setDoctors(data.doctors || []);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoctors(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddDoctorError('');
    setIsSubmittingDoctor(true);

    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          specialty: newSpecialty,
          clinicHospital: newHospital,
          cityLocation: newLocation,
          phone: newPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add doctor');
      }

      // Reset and close
      setNewName('');
      setNewSpecialty('');
      setNewHospital('');
      setNewLocation('');
      setNewPhone('');
      setIsAddModalOpen(false);
      fetchDoctors(searchQuery);
    } catch (err: unknown) {
      setAddDoctorError((err as Error).message);
    } finally {
      setIsSubmittingDoctor(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setImportError('Please select a CSV or Excel file');
      return;
    }

    setImportError('');
    setIsImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await fetch('/api/doctors/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import doctors file');
      }

      setImportResult({
        insertedCount: data.insertedCount,
        skippedCount: data.skippedCount,
        message: data.message,
      });
      fetchDoctors(searchQuery);
    } catch (err: unknown) {
      setImportError((err as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleHeaders = 'Name,Specialty,ClinicHospital,CityLocation,Phone\n';
    const sampleRows =
      'Dr. Arvind Sharma,Pulmonologist,Apollo Hospital,New Delhi,9811002233\n' +
      'Dr. Ritu Saxena,General Physician,City Clinic,Noida,9811002244\n' +
      'Dr. Pradeep Roy,Chest Specialist,Fortis Escorts,Gurgaon,9811002255\n';

    const blob = new Blob([sampleHeaders + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Erdosteine_Doctor_Master_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users2 className="w-6 h-6 text-indigo-600" />
            Doctor Master Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Create single doctors or import bulk master lists from CSV / Excel spreadsheets
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Add Doctor
          </button>

          <button
            onClick={() => {
              setImportFile(null);
              setImportResult(null);
              setImportError('');
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Bulk CSV / Excel Import
          </button>

          <button
            onClick={downloadSampleCSV}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            title="Download CSV format template"
          >
            <Download className="w-3.5 h-3.5" />
            CSV Template
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar & Counter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Doctor Name, Specialty, Clinic or Location..."
            className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>

        <div className="text-xs font-semibold text-slate-500 self-end sm:self-center">
          Total Doctors Listed: <span className="text-indigo-700 font-bold">{doctors.length}</span>
        </div>
      </div>

      {/* Doctor Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-xs">Searching doctor directory...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No doctors found</p>
            <p className="text-xs text-slate-400 mt-1">
              Add your first doctor or import a master list from CSV above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Doctor Name</th>
                  <th className="py-3 px-4">Specialty</th>
                  <th className="py-3 px-4">Clinic / Hospital</th>
                  <th className="py-3 px-4">City / Location</th>
                  <th className="py-3 px-4">Contact Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {doc.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                        {doc.specialty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{doc.clinicHospital}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{doc.cityLocation}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {doc.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{doc.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Add Single Doctor */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Add New Doctor to Master
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addDoctorError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {addDoctorError}
              </div>
            )}

            <form onSubmit={handleCreateDoctor} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Doctor Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Gupta"
                  className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specialty *
                </label>
                <input
                  type="text"
                  required
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  placeholder="e.g. Pulmonologist / Chest Physician"
                  className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinic / Hospital Name *
                </label>
                <input
                  type="text"
                  required
                  value={newHospital}
                  onChange={(e) => setNewHospital(e.target.value)}
                  placeholder="e.g. City Chest Hospital / Apollo Clinic"
                  className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location / City *
                </label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. South Delhi / Mumbai Central"
                  className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone (Optional)
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 9811223344"
                  className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDoctor}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {isSubmittingDoctor ? 'Saving Doctor...' : 'Save Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk CSV / Excel Import */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                Bulk Import Doctors
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Upload a `.csv` or `.xlsx` spreadsheet containing doctor columns:
              <strong className="text-slate-800"> Name, Specialty, Clinic/Hospital, Location, Phone</strong>.
            </p>

            {importError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {importError}
              </div>
            )}

            {importResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Import Complete
                </div>
                <div>{importResult.message}</div>
                {importResult.skippedCount ? (
                  <div className="text-slate-500">
                    Skipped {importResult.skippedCount} incomplete rows.
                  </div>
                ) : null}
              </div>
            )}

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition bg-slate-50/50">
                <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <label className="cursor-pointer block text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                  <span>Choose CSV or Excel file</span>
                  <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="sr-only"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  {importFile ? (
                    <span className="font-semibold text-slate-700">Selected: {importFile.name}</span>
                  ) : (
                    'Supports .csv, .xlsx, .xls'
                  )}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download sample template
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={!importFile || isImporting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition disabled:opacity-50"
                  >
                    {isImporting ? 'Processing File...' : 'Upload & Import'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
