'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  Pill,
  Users,
  Loader2,
  AlertCircle,
  X,
  Stethoscope,
} from 'lucide-react';

interface BrandItem {
  brandName: string;
  units: number;
}

interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  clinicHospital?: string;
  cityLocation: string;
  phone?: string;
  legacyCode?: string;
  pcode?: string;
}

interface MRUser {
  _id: string;
  name: string;
  email: string;
  employeeId?: string;
  location?: string;
  region?: string;
}

interface VisitItem {
  _id: string;
  mr: MRUser;
  doctor: Doctor;
  visitDate: string;
  brands: BrandItem[];
  remarks?: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [mrs, setMrs] = useState<MRUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedMrId, setSelectedMrId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [searchDoctor, setSearchDoctor] = useState('');

  // Export loading state
  const [isExporting, setIsExporting] = useState<'xlsx' | 'csv' | null>(null);

  // Fetch MR list for filter
  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.mrs) setMrs(data.mrs);
      })
      .catch(() => {});
  }, []);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedMrId) params.append('mrId', selectedMrId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (brandFilter) params.append('brand', brandFilter);

      const res = await fetch(`/api/visits?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch entries');
      }
      setVisits(data.visits || []);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedMrId, startDate, endDate, brandFilter]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleClearFilters = () => {
    setSelectedMrId('');
    setStartDate('');
    setEndDate('');
    setBrandFilter('');
    setSearchDoctor('');
  };

  const handleExport = async (format: 'xlsx' | 'csv') => {
    setIsExporting(format);
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (selectedMrId) params.append('mrId', selectedMrId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (brandFilter) params.append('brand', brandFilter);

      const response = await fetch(`/api/visits/export?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to generate export file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateTag = new Date().toISOString().split('T')[0];
      a.download = `Erdosteine_RCPA_Entries_${dateTag}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      alert((err as Error).message || 'Export error');
    } finally {
      setIsExporting(null);
    }
  };

  // Client-side text filter for doctor search in current results
  const filteredVisits = visits.filter((v) => {
    if (!searchDoctor) return true;
    const docName = v.doctor?.name?.toLowerCase() || '';
    const legacyCode = v.doctor?.legacyCode?.toLowerCase() || '';
    const city = v.doctor?.cityLocation?.toLowerCase() || '';
    const q = searchDoctor.toLowerCase();
    return docName.includes(q) || legacyCode.includes(q) || city.includes(q);
  });

  // Calculate Metrics
  const totalVisits = filteredVisits.length;
  const uniqueDoctorsCount = new Set(filteredVisits.map((v) => v.doctor?._id)).size;
  let totalUnitsPromoted = 0;
  let erdosteineUnits = 0;

  filteredVisits.forEach((v) => {
    v.brands?.forEach((b) => {
      const units = Number(b.units) || 0;
      totalUnitsPromoted += units;
      if (b.brandName.toLowerCase().includes('erdosteine')) {
        erdosteineUnits += units;
      }
    });
  });

  return (
    <div className="space-y-5">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            RCPA Entries & Reporting
          </h1>
          <p className="text-xs text-slate-500">
            Field representative submissions and doctor prescription units
          </p>
        </div>

        {/* Clean Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('xlsx')}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-300 rounded-md transition disabled:opacity-50"
          >
            {isExporting === 'xlsx' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            )}
            Excel (.xlsx)
          </button>

          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-300 rounded-md transition disabled:opacity-50"
          >
            {isExporting === 'csv' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-slate-600" />
            )}
            CSV
          </button>

          <button
            onClick={fetchVisits}
            className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-md transition"
            title="Refresh entries"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards - Clean & Nominal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-3.5">
          <div className="text-xs font-medium text-slate-500">Total Entries</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalVisits}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Recorded RCPA forms</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3.5">
          <div className="text-xs font-medium text-slate-500">Doctors Reached</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{uniqueDoctorsCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Unique healthcare providers</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3.5">
          <div className="text-xs font-medium text-slate-500">Total RCPA Units</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalUnitsPromoted}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">All brand units combined</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3.5">
          <div className="text-xs font-medium text-slate-500">Erdosteine Units</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{erdosteineUnits}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {totalUnitsPromoted > 0
              ? `${Math.round((erdosteineUnits / totalUnitsPromoted) * 100)}% of total units`
              : 'Primary brand units'}
          </div>
        </div>
      </div>

      {/* Nominal Filter Box */}
      <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            Filter Entries
          </div>
          {(selectedMrId || startDate || endDate || brandFilter || searchDoctor) && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* MR Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Field Employee
            </label>
            <select
              value={selectedMrId}
              onChange={(e) => setSelectedMrId(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            >
              <option value="">All Field Employees</option>
              {mrs.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.employeeId ? `[${m.employeeId}] ` : ''}{m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Brand Keyword
            </label>
            <input
              type="text"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              placeholder="e.g. Erdosteine"
              className="block w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          {/* Search Doctor in Results */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Search Doctor / Code
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchDoctor}
                onChange={(e) => setSearchDoctor(e.target.value)}
                placeholder="Doctor name or code..."
                className="block w-full pl-7 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Nominal Clean Entries Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Recorded Entries ({filteredVisits.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            Live submissions
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            <p className="text-xs">Loading entries...</p>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <p className="text-sm font-medium text-slate-700">No entries found matching filters</p>
            <p className="text-xs text-slate-400 mt-0.5">Try clearing filter criteria above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Field Employee</th>
                  <th className="py-2.5 px-3">Doctor Details</th>
                  <th className="py-2.5 px-3">Brands & Units Reported</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisits.map((v) => {
                  const dateStr = v.visitDate
                    ? new Date(v.visitDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr key={v._id} className="hover:bg-slate-50/70 transition">
                      {/* Date */}
                      <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Employee */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {v.mr?.name || 'N/A'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {v.mr?.employeeId ? `Emp ID: ${v.mr.employeeId}` : v.mr?.email}
                        </div>
                        {v.mr?.location && (
                          <div className="text-[10px] text-slate-400">
                            {v.mr.location}
                          </div>
                        )}
                      </td>

                      {/* Doctor */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{v.doctor?.name || 'Unknown Doctor'}</span>
                          {v.doctor?.legacyCode && (
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200">
                              {v.doctor.legacyCode}
                            </span>
                          )}
                          {v.doctor?.specialty && (
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({v.doctor.specialty})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {v.doctor?.cityLocation || v.doctor?.clinicHospital}
                        </div>
                      </td>

                      {/* Brands & Units */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {v.brands?.map((b, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-slate-50 text-slate-700 border border-slate-200"
                            >
                              <span>{b.brandName}:</span>
                              <strong className="font-semibold text-slate-900">{b.units}</strong>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                        {v.remarks || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
