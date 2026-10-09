'use client';

import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Plus,
  Search,
  Star,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function RecruitmentPage() {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'openings' | 'candidates' | 'applications' | 'interviews'>('openings');

  // Data states
  const [openings, setOpenings] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);

  // Forms
  const [openingForm, setOpeningForm] = useState({
    title: '',
    department: 'Engineering',
    location: 'Remote',
    employmentType: 'FULL_TIME',
    vacancies: 1,
    description: '',
  });

  const [candidateForm, setCandidateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentCompany: '',
    currentRole: '',
    yearsOfExperience: 3,
  });

  const [appForm, setAppForm] = useState({
    jobOpeningId: '',
    candidateId: '',
    coverLetter: '',
  });

  const [interviewForm, setInterviewForm] = useState({
    applicationId: '',
    type: 'TECHNICAL',
    scheduledAt: '',
    durationMinutes: 45,
    location: 'Google Meet',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [opRes, canRes, appRes, intRes] = await Promise.all([
        api.recruitment.getOpenings().catch(() => ({ items: [], total: 0 })),
        api.recruitment.getCandidates().catch(() => ({ items: [], total: 0 })),
        api.recruitment.getApplications().catch(() => ({ items: [], total: 0 })),
        api.recruitment.getInterviews().catch(() => ({ items: [], pagination: {} })),
      ]);

      setOpenings(opRes.items || []);
      setCandidates(canRes.items || []);
      setApplications(appRes.items || []);
      setInterviews(intRes.items || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Openings actions
  const handleCreateOpening = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recruitment.createOpening(openingForm);
      setIsOpeningModalOpen(false);
      setOpeningForm({
        title: '',
        department: 'Engineering',
        location: 'Remote',
        employmentType: 'FULL_TIME',
        vacancies: 1,
        description: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create opening');
    }
  };

  const handlePublishOpening = async (id: string) => {
    try {
      await api.recruitment.publishOpening(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to publish opening');
    }
  };

  const handleCloseOpening = async (id: string) => {
    try {
      await api.recruitment.closeOpening(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to close opening');
    }
  };

  // Candidates actions
  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recruitment.createCandidate({
        ...candidateForm,
        yearsOfExperience: Number(candidateForm.yearsOfExperience) || 0,
      });
      setIsCandidateModalOpen(false);
      setCandidateForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        currentCompany: '',
        currentRole: '',
        yearsOfExperience: 3,
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create candidate');
    }
  };

  // Applications actions
  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appForm.jobOpeningId || !appForm.candidateId) {
      alert('Please select both a job opening and candidate');
      return;
    }
    try {
      await api.recruitment.createApplication(appForm.jobOpeningId, {
        candidateId: appForm.candidateId,
        coverLetter: appForm.coverLetter,
      });
      setIsApplicationModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit application');
    }
  };

  const handleAppTransition = async (id: string, action: string) => {
    try {
      if (action === 'screen') await api.recruitment.screenApplication(id);
      if (action === 'shortlist') await api.recruitment.shortlistApplication(id);
      if (action === 'interview') await api.recruitment.interviewApplication(id);
      if (action === 'offer') await api.recruitment.offerApplication(id);
      if (action === 'hire') await api.recruitment.hireApplication(id);
      if (action === 'reject') {
        const reason = prompt('Rejection reason (optional):') || undefined;
        await api.recruitment.rejectApplication(id, reason);
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || `Failed to transition application to ${action}`);
    }
  };

  // Interviews actions
  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewForm.applicationId) {
      alert('Please select an application');
      return;
    }
    try {
      await api.recruitment.scheduleInterview(interviewForm.applicationId, {
        type: interviewForm.type,
        scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),
        durationMinutes: Number(interviewForm.durationMinutes) || 45,
        location: interviewForm.location,
        notes: interviewForm.notes,
      });
      setIsInterviewModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule interview');
    }
  };

  const handleInterviewAction = async (id: string, action: 'confirm' | 'complete' | 'cancel') => {
    try {
      if (action === 'confirm') await api.recruitment.confirmInterview(id);
      if (action === 'complete') {
        const ratingStr = prompt('Interview rating (1-5):', '4');
        const rating = Number(ratingStr) || 4;
        const notes = prompt('Interviewer recommendation / feedback:', 'Strong candidate fit');
        await api.recruitment.completeInterview(id, {
          rating,
          recommendation: 'STRONG_HIRE',
          feedback: notes || '',
        });
      }
      if (action === 'cancel') {
        const reason = prompt('Cancellation reason:') || 'Rescheduled';
        await api.recruitment.cancelInterview(id, reason);
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || `Failed to update interview`);
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Talent Acquisition</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Recruitment Suite
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Job openings, candidate pipelines, interview workflows, and automated hiring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'openings' && (
            <button
              onClick={() => setIsOpeningModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
            >
              <Plus className="size-4" />
              <span>Post Job Opening</span>
            </button>
          )}
          {activeTab === 'candidates' && (
            <button
              onClick={() => setIsCandidateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
            >
              <UserPlus className="size-4" />
              <span>Add Candidate</span>
            </button>
          )}
          {activeTab === 'applications' && (
            <button
              onClick={() => setIsApplicationModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
            >
              <Plus className="size-4" />
              <span>New Application</span>
            </button>
          )}
          {activeTab === 'interviews' && (
            <button
              onClick={() => setIsInterviewModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
            >
              <Calendar className="size-4" />
              <span>Schedule Interview</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Active Openings</span>
            <Briefcase className="size-4" />
          </div>
          <div className="mt-3 text-2xl font-bold">
            {openings.filter((o) => o.status === 'PUBLISHED').length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Open requisitions</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Candidate Pool</span>
            <Users className="size-4 text-blue-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-blue-400">{candidates.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Registered profiles</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">In Pipeline</span>
            <UserCheck className="size-4 text-purple-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-purple-400">{applications.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Active applications</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Interviews</span>
            <Calendar className="size-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">{interviews.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Scheduled sessions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('openings')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            activeTab === 'openings'
              ? 'bg-accent text-accent-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Job Openings ({openings.length})
        </button>
        <button
          onClick={() => setActiveTab('candidates')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            activeTab === 'candidates'
              ? 'bg-accent text-accent-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Candidates ({candidates.length})
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            activeTab === 'applications'
              ? 'bg-accent text-accent-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Applications Pipeline ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('interviews')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            activeTab === 'interviews'
              ? 'bg-accent text-accent-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Interviews & Rounds ({interviews.length})
        </button>
      </div>

      {/* Tab 1: Openings */}
      {activeTab === 'openings' && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {openings.length === 0 ? (
            <div className="py-20 text-center">
              <Briefcase className="mx-auto size-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-semibold">No job openings yet</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Post an opening to start recruiting talent.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5">Position</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Vacancies</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border">
                  {openings.map((op) => (
                    <tr key={op._id || op.id} className="hover:bg-muted/20">
                      <td className="px-6 py-4 font-semibold text-foreground">{op.title}</td>
                      <td className="px-6 py-4 text-xs">{op.department}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{op.location}</td>
                      <td className="px-6 py-4 text-xs">{op.employmentType}</td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold">{op.vacancies || 1}</td>
                      <td className="px-6 py-4">
                        {op.status === 'PUBLISHED' ? (
                          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">Published</span>
                        ) : op.status === 'CLOSED' ? (
                          <span className="rounded-md bg-zinc-500/10 px-2 py-0.5 text-xs font-semibold text-zinc-400">Closed</span>
                        ) : (
                          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">Draft</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {op.status === 'DRAFT' && (
                            <button
                              onClick={() => handlePublishOpening(op._id || op.id)}
                              className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                            >
                              Publish
                            </button>
                          )}
                          {op.status === 'PUBLISHED' && (
                            <button
                              onClick={() => handleCloseOpening(op._id || op.id)}
                              className="rounded-lg bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Candidates */}
      {activeTab === 'candidates' && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {candidates.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="mx-auto size-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-semibold">No candidates registered</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Add candidates manually or review applications from job portals.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5">Candidate</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Phone</th>
                    <th className="px-6 py-3.5">Current Role</th>
                    <th className="px-6 py-3.5">Experience</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border">
                  {candidates.map((c) => (
                    <tr key={c._id || c.id} className="hover:bg-muted/20">
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {c.firstName} {c.lastName}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{c.email}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{c.phone || '—'}</td>
                      <td className="px-6 py-4 text-xs">
                        {c.currentRole ? `${c.currentRole} at ${c.currentCompany || 'N/A'}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-medium">{c.yearsOfExperience ?? 0} yrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Applications Pipeline */}
      {activeTab === 'applications' && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {applications.length === 0 ? (
            <div className="py-20 text-center">
              <UserCheck className="mx-auto size-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-semibold">No active applications</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Create an application linking a candidate to an open position.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5">Candidate</th>
                    <th className="px-6 py-3.5">Target Opening</th>
                    <th className="px-6 py-3.5">Stage Status</th>
                    <th className="px-6 py-3.5 text-right">Pipeline Workflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border">
                  {applications.map((app) => {
                    const candidateObj = candidates.find((c) => (c._id || c.id) === (app.candidateId?._id || app.candidateId));
                    const candidateName = candidateObj
                      ? `${candidateObj.firstName} ${candidateObj.lastName}`
                      : app.candidateId?.firstName
                      ? `${app.candidateId.firstName} ${app.candidateId.lastName}`
                      : 'Candidate';

                    const openingObj = openings.find((o) => (o._id || o.id) === (app.jobOpeningId?._id || app.jobOpeningId));
                    const openingTitle = openingObj?.title || app.jobOpeningId?.title || 'Job Opening';

                    return (
                      <tr key={app._id || app.id} className="hover:bg-muted/20">
                        <td className="px-6 py-4 font-semibold text-foreground">{candidateName}</td>
                        <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{openingTitle}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-400">
                            {app.status || 'APPLIED'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {app.status === 'APPLIED' && (
                              <button
                                onClick={() => handleAppTransition(app._id || app.id, 'screen')}
                                className="rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-500/20"
                              >
                                Screen
                              </button>
                            )}
                            {app.status === 'SCREENING' && (
                              <button
                                onClick={() => handleAppTransition(app._id || app.id, 'shortlist')}
                                className="rounded-lg bg-purple-500/10 px-2 py-1 text-xs font-semibold text-purple-400 hover:bg-purple-500/20"
                              >
                                Shortlist
                              </button>
                            )}
                            {app.status === 'SHORTLISTED' && (
                              <button
                                onClick={() => handleAppTransition(app._id || app.id, 'interview')}
                                className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/20"
                              >
                                Interview
                              </button>
                            )}
                            {app.status === 'INTERVIEWING' && (
                              <button
                                onClick={() => handleAppTransition(app._id || app.id, 'offer')}
                                className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                              >
                                Make Offer
                              </button>
                            )}
                            {app.status === 'OFFERED' && (
                              <button
                                onClick={() => handleAppTransition(app._id || app.id, 'hire')}
                                className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Hire
                              </button>
                            )}
                            {app.status !== 'HIRED' && app.status !== 'REJECTED' && (
                              <button
                                onClick={() => handleAppTransition(app._id || app.id, 'reject')}
                                className="rounded-lg bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Interviews */}
      {activeTab === 'interviews' && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {interviews.length === 0 ? (
            <div className="py-20 text-center">
              <Calendar className="mx-auto size-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-semibold">No interviews scheduled</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Schedule technical, behavioral, or executive interview rounds.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5">Interview Round</th>
                    <th className="px-6 py-3.5">Date & Time</th>
                    <th className="px-6 py-3.5">Platform / Location</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border">
                  {interviews.map((iv) => (
                    <tr key={iv._id || iv.id} className="hover:bg-muted/20">
                      <td className="px-6 py-4 font-semibold text-foreground">
                        <span className="rounded bg-muted px-2 py-0.5 text-xs mr-2 font-mono">
                          {iv.type}
                        </span>
                        {iv.durationMinutes || 45} mins
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                        {new Date(iv.scheduledAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{iv.location || 'Google Meet'}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                          {iv.status || 'SCHEDULED'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {iv.status === 'SCHEDULED' && (
                            <button
                              onClick={() => handleInterviewAction(iv._id || iv.id, 'confirm')}
                              className="rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-500/20"
                            >
                              Confirm
                            </button>
                          )}
                          {iv.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleInterviewAction(iv._id || iv.id, 'complete')}
                              className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                            >
                              Complete
                            </button>
                          )}
                          {iv.status !== 'CANCELLED' && iv.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleInterviewAction(iv._id || iv.id, 'cancel')}
                              className="rounded-lg bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Job Opening */}
      {isOpeningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">Post Job Opening</h2>
              <button
                onClick={() => setIsOpeningModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOpening} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Position Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staff Distributed Systems Engineer"
                  value={openingForm.title}
                  onChange={(e) => setOpeningForm({ ...openingForm, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <input
                    type="text"
                    value={openingForm.department}
                    onChange={(e) => setOpeningForm({ ...openingForm, department: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Location</label>
                  <input
                    type="text"
                    value={openingForm.location}
                    onChange={(e) => setOpeningForm({ ...openingForm, location: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Employment Type</label>
                  <select
                    value={openingForm.employmentType}
                    onChange={(e) => setOpeningForm({ ...openingForm, employmentType: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Vacancies</label>
                  <input
                    type="number"
                    min={1}
                    value={openingForm.vacancies}
                    onChange={(e) => setOpeningForm({ ...openingForm, vacancies: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Job Description</label>
                <textarea
                  rows={3}
                  value={openingForm.description}
                  onChange={(e) => setOpeningForm({ ...openingForm, description: e.target.value })}
                  placeholder="Responsibilities, requirements, stack..."
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsOpeningModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Create Opening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Candidate */}
      {isCandidateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">Add Candidate</h2>
              <button
                onClick={() => setIsCandidateModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCandidate} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">First Name *</label>
                  <input
                    type="text"
                    required
                    value={candidateForm.firstName}
                    onChange={(e) => setCandidateForm({ ...candidateForm, firstName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={candidateForm.lastName}
                    onChange={(e) => setCandidateForm({ ...candidateForm, lastName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Email *</label>
                  <input
                    type="email"
                    required
                    value={candidateForm.email}
                    onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <input
                    type="tel"
                    value={candidateForm.phone}
                    onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Current Role</label>
                  <input
                    type="text"
                    value={candidateForm.currentRole}
                    onChange={(e) => setCandidateForm({ ...candidateForm, currentRole: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Current Company</label>
                  <input
                    type="text"
                    value={candidateForm.currentCompany}
                    onChange={(e) => setCandidateForm({ ...candidateForm, currentCompany: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Application */}
      {isApplicationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">New Candidate Application</h2>
              <button
                onClick={() => setIsApplicationModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateApplication} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Job Opening *</label>
                <select
                  required
                  value={appForm.jobOpeningId}
                  onChange={(e) => setAppForm({ ...appForm, jobOpeningId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select job position...</option>
                  {openings.map((op) => (
                    <option key={op._id || op.id} value={op._id || op.id}>
                      {op.title} ({op.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Candidate *</label>
                <select
                  required
                  value={appForm.candidateId}
                  onChange={(e) => setAppForm({ ...appForm, candidateId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select candidate...</option>
                  {candidates.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.firstName} {c.lastName} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Cover Letter / Notes</label>
                <textarea
                  rows={2}
                  value={appForm.coverLetter}
                  onChange={(e) => setAppForm({ ...appForm, coverLetter: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsApplicationModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Interview */}
      {isInterviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">Schedule Interview Round</h2>
              <button
                onClick={() => setIsInterviewModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleScheduleInterview} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Application *</label>
                <select
                  required
                  value={interviewForm.applicationId}
                  onChange={(e) => setInterviewForm({ ...interviewForm, applicationId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select candidate application...</option>
                  {applications.map((app) => (
                    <option key={app._id || app.id} value={app._id || app.id}>
                      App #{String(app._id || app.id).slice(-6)} - Stage: {app.status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Interview Type</label>
                  <select
                    value={interviewForm.type}
                    onChange={(e) => setInterviewForm({ ...interviewForm, type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="SCREENING">Screening</option>
                    <option value="TECHNICAL">Technical</option>
                    <option value="BEHAVIORAL">Behavioral</option>
                    <option value="EXECUTIVE">Executive / Culture</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Duration (mins)</label>
                  <input
                    type="number"
                    value={interviewForm.durationMinutes}
                    onChange={(e) => setInterviewForm({ ...interviewForm, durationMinutes: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewForm.scheduledAt}
                  onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Meeting Link / Room</label>
                <input
                  type="text"
                  value={interviewForm.location}
                  onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsInterviewModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
