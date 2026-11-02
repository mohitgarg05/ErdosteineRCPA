'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  Plus,
  Trash2,
  Calendar,
  Building2,
  MapPin,
  Stethoscope,
  Phone,
  Save,
  Check,
  RotateCcw,
  History,
  AlertCircle,
  Loader2,
  Pill,
} from 'lucide-react';

interface DoctorItem {
  _id: string;
  name: string;
  specialty: string;
  clinicHospital?: string;
  cityLocation: string;
  phone?: string;
  legacyCode?: string;
  pcode?: string;
}

interface BrandItem {
  _id?: string;
  name: string;
  isOwnProduct?: boolean;
}

interface BrandUnitRow {
  brandName: string;
  units: number | string;
}

export default function NewVisitPage() {
  const router = useRouter();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DoctorItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorItem | null>(null);

  // Available brands list for quick selection
  const [availableBrands, setAvailableBrands] = useState<BrandItem[]>([]);

  // Form state
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [brandRows, setBrandRows] = useState<BrandUnitRow[]>([
    { brandName: '', units: '' },
  ]);
  const [remarks, setRemarks] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedSummary, setSavedSummary] = useState<{ doctorName: string; brandsCount: number } | null>(null);

  // Fetch available brands on mount
  useEffect(() => {
    fetch('/api/brands')
      .then((res) => res.json())
      .then((data) => {
        if (data.brands) {
          setAvailableBrands(data.brands);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch initial assigned doctors or search within mapped doctors
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/doctors?q=${encodeURIComponent(searchQuery)}&limit=100`)
        .then((res) => res.json())
        .then((data) => {
          if (data.doctors) {
            setSearchResults(data.doctors);
          }
        })
        .catch(() => {})
        .finally(() => setIsSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddBrandRow = () => {
    if (brandRows.length >= 5) return;
    setBrandRows([...brandRows, { brandName: '', units: '' }]);
  };

  const handleRemoveBrandRow = (index: number) => {
    if (brandRows.length <= 1) return;
    setBrandRows(brandRows.filter((_, idx) => idx !== index));
  };

  const handleBrandChange = (index: number, field: keyof BrandUnitRow, value: string) => {
    const updated = [...brandRows];
    if (field === 'units') {
      updated[index].units = value === '' ? '' : Math.max(1, parseInt(value, 10) || 1);
    } else {
      updated[index].brandName = value;
    }
    setBrandRows(updated);
  };

  const handleSubmitVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedDoctor) {
      setErrorMessage('Please select a doctor to record this visit');
      return;
    }

    // Validate brand rows
    for (let i = 0; i < brandRows.length; i++) {
      const row = brandRows[i];
      if (!row.brandName.trim()) {
        setErrorMessage(`Please enter a brand name for entry #${i + 1}`);
        return;
      }
      if (!row.units || Number(row.units) <= 0) {
        setErrorMessage(`Please enter valid units (minimum 1) for entry #${i + 1}`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor._id,
          visitDate,
          brands: brandRows.map((r) => ({
            brandName: r.brandName.trim(),
            units: Number(r.units),
          })),
          remarks: remarks.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save visit entry');
      }

      setSavedSummary({
        doctorName: selectedDoctor.name,
        brandsCount: brandRows.length,
      });
      setSavedSuccess(true);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForNextDoctor = () => {
    setSelectedDoctor(null);
    setSearchQuery('');
    setBrandRows([{ brandName: 'Erdosteine 300mg Capsules', units: '' }]);
    setRemarks('');
    setSavedSuccess(false);
    setSavedSummary(null);
    setErrorMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Doctor RCPA Entry
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Select an assigned doctor from your list and record prescription audit units
        </p>
      </div>

      {/* Success Modal / Banner */}
      {savedSuccess && savedSummary && (
        <div className="bg-emerald-50 border-2 border-emerald-500/80 rounded-2xl p-6 shadow-md shadow-emerald-500/10 text-center animate-fade-in">
          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white mx-auto mb-3 shadow-md">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-emerald-900">
            Entry Successfully Recorded!
          </h2>
          <p className="text-sm text-emerald-700 mt-1 max-w-md mx-auto">
            RCPA entry recorded for <span className="font-semibold">{savedSummary.doctorName}</span> with{' '}
            <span className="font-semibold">{savedSummary.brandsCount} brand entries</span>. It is now live in the Admin Portal.
          </p>

          <div className="mt-5 flex items-center justify-center">
            <button
              type="button"
              onClick={handleResetForNextDoctor}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-xs transition"
            >
              <RotateCcw className="w-4 h-4" />
              Log Next Doctor Entry
            </button>
          </div>
        </div>
      )}

      {/* Main Entry Form (hidden when success is displayed) */}
      {!savedSuccess && (
        <form onSubmit={handleSubmitVisit} className="space-y-6">
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SECTION 1: Doctor Selection */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Doctor Selection
                </h2>
              </div>
              {selectedDoctor && (
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-800 transition"
                >
                  Change Doctor
                </button>
              )}
            </div>

            {/* If doctor already selected */}
            {selectedDoctor ? (
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">
                      {selectedDoctor.name}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-100 text-teal-800">
                      {selectedDoctor.specialty}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    {selectedDoctor.legacyCode && (
                      <span className="flex items-center gap-1 font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded text-[11px]">
                        ID: {selectedDoctor.legacyCode}
                      </span>
                    )}
                    {selectedDoctor.clinicHospital && selectedDoctor.clinicHospital !== selectedDoctor.cityLocation && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {selectedDoctor.clinicHospital}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedDoctor.cityLocation}
                    </span>
                    {selectedDoctor.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {selectedDoctor.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-lg self-start sm:self-auto">
                  <Check className="w-3.5 h-3.5" /> Selected
                </div>
              </div>
            ) : (
              /* Doctor Search Box & Results */
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search within your mapped doctors by name, specialty, or code..."
                    className="block w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {/* Results dropdown list */}
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-64 overflow-y-auto bg-slate-50/50">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No doctors found matching &ldquo;{searchQuery}&rdquo;. Try another name or specialty.
                    </div>
                  ) : (
                    searchResults.map((doc) => (
                      <button
                        key={doc._id}
                        type="button"
                        onClick={() => setSelectedDoctor(doc)}
                        className="w-full text-left p-3 hover:bg-teal-50/60 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 group"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-900 group-hover:text-teal-700">
                            {doc.name}
                          </div>
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                            <span className="flex items-center gap-1 text-teal-600 font-medium">
                              <Stethoscope className="w-3 h-3" />
                              {doc.specialty}
                            </span>
                            {doc.legacyCode && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-600">{doc.legacyCode}</span>
                              </>
                            )}
                            {doc.clinicHospital && doc.clinicHospital !== doc.cityLocation && (
                              <>
                                <span>•</span>
                                <span>{doc.clinicHospital}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{doc.cityLocation}</span>
                          </div>
                        </div>

                        <span className="text-xs font-semibold text-teal-600 bg-white border border-teal-200 group-hover:bg-teal-600 group-hover:text-white px-2.5 py-1 rounded-lg self-start sm:self-auto transition shadow-2xs">
                          Select
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Visit Date */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Visit Details
              </h2>
            </div>

            <div className="max-w-xs">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date of Visit
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Up to 5 Brand/Unit Combinations */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Brand & RCPA Units
                </h2>
              </div>

              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {brandRows.length} of 5 Entries
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Enter promotional or competitor brands and reported units (up to 5 brands per visit entry)
            </p>

            <div className="space-y-3">
              {brandRows.map((row, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                >
                  <div className="text-xs font-bold text-slate-500 sm:w-8 shrink-0 flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5 text-teal-600" />
                    #{index + 1}
                  </div>

                  {/* Brand selector / input */}
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        list={`brands-list-${index}`}
                        value={row.brandName}
                        onChange={(e) => handleBrandChange(index, 'brandName', e.target.value)}
                        placeholder="Select or type brand name..."
                        className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                      />
                      <datalist id={`brands-list-${index}`}>
                        {availableBrands.map((b) => (
                          <option key={b._id || b.name} value={b.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Units input */}
                  <div className="w-full sm:w-36">
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={row.units}
                        onChange={(e) => handleBrandChange(index, 'units', e.target.value)}
                        placeholder="Units (e.g. 10)"
                        className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-slate-900 placeholder:text-slate-400 text-right font-semibold"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 pointer-events-none">
                        qty
                      </span>
                    </div>
                  </div>

                  {/* Delete button (if more than 1 row) */}
                  {brandRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBrandRow(index)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition self-end sm:self-center"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add row button (up to 5) */}
            {brandRows.length < 5 ? (
              <button
                type="button"
                onClick={handleAddBrandRow}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Brand ({brandRows.length}/5)
              </button>
            ) : (
              <div className="mt-3 text-xs text-slate-400 italic">
                Maximum 5 brand/unit entries reached for this entry.
              </div>
            )}
          </div>

          {/* SECTION 4: Remarks / Feedback */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">
                4
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Doctor Feedback / Remarks
              </h2>
            </div>

            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter doctor response, clinical discussion notes, sample request, or next follow-up plan..."
              className="block w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-base rounded-xl shadow-md shadow-teal-600/20 disabled:opacity-50 transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting RCPA Entry...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Submit RCPA Entry
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
