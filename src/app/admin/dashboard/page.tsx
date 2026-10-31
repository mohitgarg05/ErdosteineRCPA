'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Building2,
  Calendar,
  Pill,
  Users,
  Award,
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
  clinicHospital: string;
  cityLocation: string;
  phone?: string;
}

interface MRUser {
  _id: string;
  name: string;
  email: string;
  employeeId?: string;
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
        throw new Error(data.error || 'Failed to fetch visits');
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
      a.download = `Erdosteine_RCPA_Visits_${dateTag}.${format}`;
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
    const hospital = v.doctor?.clinicHospital?.toLowerCase() || '';
    const city = v.doctor?.cityLocation?.toLowerCase() || '';
    const q = searchDoctor.toLowerCase();
    return docName.includes(q) || hospital.includes(q) || city.includes(q);
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
    <div className="space-y-6">
      {/* Page Title & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Erdosteine RCPA Visits & Reporting
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitor real-time doctor visits, brand promotions, and export RCPA data
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExport('xlsx')}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {isExporting === 'xlsx' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Export to Excel (.xlsx)
          </button>

          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {isExporting === 'csv' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Export CSV
          </button>

          <button
            onClick={fetchVisits}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-xl shadow-xs transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Visits</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalVisits}</div>
          <div className="text-[11px] text-slate-400 mt-1">Logged doctor visits</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Doctors Reached</span>
            <Users className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{uniqueDoctorsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Unique healthcare providers</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total RCPA Units</span>
            <Pill className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalUnitsPromoted}</div>
          <div className="text-[11px] text-slate-400 mt-1">All brands combined</div>
        </div>

        <div className="bg-white rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Erdosteine Focus</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-900">{erdosteineUnits}</div>
          <div className="text-[11px] text-indigo-600/80 mt-1">
            {totalUnitsPromoted > 0
              ? `${Math.round((erdosteineUnits / totalUnitsPromoted) * 100)}% of total reported units`
              : 'Primary brand units'}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            Filters & Search
          </div>
          {(selectedMrId || startDate || endDate || brandFilter || searchDoctor) && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 transition"
            >
              <X className="w-3 h-3" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* MR Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Field Person (MR)
            </label>
            <select
              value={selectedMrId}
              onChange={(e) => setSelectedMrId(e.target.value)}
              className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Field Persons</option>
              {mrs.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.employeeId || m.email})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
            >
            </input>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
            >
            </input>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Brand Keyword
            </label>
            <input
              type="text"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              placeholder="e.g. Erdosteine, Acebro..."
              className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Doctor Search in Results */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Search Doctor / Hospital
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchDoctor}
                onChange={(e) => setSearchDoctor(e.target.value)}
                placeholder="Doctor or Clinic..."
                className="block w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Visits Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Recorded Doctor Visits ({filteredVisits.length})
          </h2>
          <span className="text-xs text-slate-500">
            Showing most recent submissions
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-xs">Loading visit entries...</p>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No visits matching the current criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or checking other dates.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Field Person (MR)</th>
                  <th className="py-3 px-4">Doctor & Clinic</th>
                  <th className="py-3 px-4">Brands & Units Promoted</th>
                  <th className="py-3 px-4">Remarks / Notes</th>
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
                    <tr key={v._id} className="hover:bg-slate-50/80 transition">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* MR */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {v.mr?.name || 'N/A'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {v.mr?.employeeId ? `[${v.mr.employeeId}] ` : ''}{v.mr?.email}
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{v.doctor?.name || 'Unknown Doctor'}</span>
                          {v.doctor?.specialty && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                              <Stethoscope className="w-2.5 h-2.5 mr-0.5" />
                              {v.doctor.specialty}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{v.doctor?.clinicHospital}</span>
                          <span className="text-slate-300">•</span>
                          <span>{v.doctor?.cityLocation}</span>
                        </div>
                      </td>

                      {/* Brands & Units */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {v.brands?.map((b, idx) => {
                            const isErdosteine = b.brandName.toLowerCase().includes('erdosteine');
                            return (
                              <span
                                key={idx}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border font-medium ${
                                  isErdosteine
                                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                <span>{b.brandName}:</span>
                                <strong className={isErdosteine ? 'text-teal-700' : 'text-slate-900'}>
                                  {b.units}
                                </strong>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                        {v.remarks ? (
                          <span className="italic">{v.remarks}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
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
