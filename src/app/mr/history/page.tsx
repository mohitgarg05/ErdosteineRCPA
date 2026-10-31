'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Building2,
  MapPin,
  Pill,
  PlusCircle,
  MessageSquare,
  Loader2,
  AlertCircle,
  Stethoscope,
  RefreshCw,
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

interface VisitItem {
  _id: string;
  doctor: Doctor;
  visitDate: string;
  brands: BrandItem[];
  remarks?: string;
  createdAt: string;
}

export default function MRHistoryPage() {
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVisits = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/visits');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch your logged visits');
      }
      setVisits(data.visits || []);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Logged Doctor Visits
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Review all doctor interaction and RCPA records submitted by you
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchVisits}
            className="p-2 text-slate-600 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-50 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/mr/new-visit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg shadow-xs hover:bg-teal-700 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Record New Visit
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-sm">Loading your visits...</p>
        </div>
      ) : visits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 mx-auto mb-3">
            <Pill className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base">No Visits Recorded Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            You haven&apos;t entered any doctor visits yet. Log your first visit to see it listed here.
          </p>
          <Link
            href="/mr/new-visit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            Log Doctor Visit Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 font-medium">
            Showing {visits.length} recorded {visits.length === 1 ? 'visit' : 'visits'}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {visits.map((v) => {
              const formattedDate = v.visitDate
                ? new Date(v.visitDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'N/A';

              const totalUnits = v.brands?.reduce((sum, b) => sum + (Number(b.units) || 0), 0) || 0;

              return (
                <div
                  key={v._id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-teal-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          {v.doctor?.name || 'Unknown Doctor'}
                        </span>
                        {v.doctor?.specialty && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200/60">
                            {v.doctor.specialty}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-500">
                        {v.doctor?.clinicHospital && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {v.doctor.clinicHospital}
                          </span>
                        )}
                        {v.doctor?.cityLocation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {v.doctor.cityLocation}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 self-start sm:self-auto">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700">{formattedDate}</span>
                    </div>
                  </div>

                  {/* Brands Promoted & Units */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Reported Brands & Units</span>
                      <span className="text-[11px] font-medium text-slate-500">
                        Total Units: <strong className="text-teal-700">{totalUnits}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {v.brands?.map((b, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
                        >
                          <span className="font-medium text-slate-800">{b.brandName}</span>
                          <span className="font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded text-[11px]">
                            {b.units} units
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Remarks */}
                  {v.remarks && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-lg">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="italic">{v.remarks}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
