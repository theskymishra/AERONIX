'use client';

import React, { useEffect, useState } from 'react';
import {
  Archive,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  Search,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function DocumentsPage() {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'org' | 'employee'>('org');

  const [orgDocs, setOrgDocs] = useState<any[]>([]);
  const [empDocs, setEmpDocs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [isUploadOrgOpen, setIsUploadOrgOpen] = useState(false);
  const [isUploadEmpOpen, setIsUploadEmpOpen] = useState(false);

  // Upload forms
  const [uploadOrgForm, setUploadOrgForm] = useState({
    title: '',
    category: 'POLICY',
    description: '',
  });
  const [selectedOrgFile, setSelectedOrgFile] = useState<File | null>(null);

  const [uploadEmpForm, setUploadEmpForm] = useState({
    name: '',
    type: 'CONTRACT',
    description: '',
  });
  const [selectedEmpFile, setSelectedEmpFile] = useState<File | null>(null);

  const fetchOrgDocs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.documents.listOrg(params).catch(() => ({ items: [], pagination: {} }));
      setOrgDocs(res.items || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.employees.list({ limit: 100 }).catch(() => ({ items: [], total: 0 }));
      setEmployees(res.items || []);
      if (res.items?.[0] && !selectedEmpId) {
        setSelectedEmpId(res.items[0]._id || res.items[0].id);
      }
    } catch {
      // fallback
    }
  };

  const fetchEmpDocs = async (empId: string) => {
    if (!empId) return;
    try {
      const res = await api.documents.listEmployee(empId).catch(() => ({ items: [], total: 0 }));
      setEmpDocs(res.items || []);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchOrgDocs();
    fetchEmployees();
  }, [categoryFilter]);

  useEffect(() => {
    if (selectedEmpId) {
      fetchEmpDocs(selectedEmpId);
    }
  }, [selectedEmpId]);

  const handleUploadOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgFile || !uploadOrgForm.title) {
      alert('Please provide a title and select a file');
      return;
    }
    try {
      await api.documents.uploadOrg(uploadOrgForm, selectedOrgFile);
      setIsUploadOrgOpen(false);
      setSelectedOrgFile(null);
      setUploadOrgForm({ title: '', category: 'POLICY', description: '' });
      fetchOrgDocs();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    }
  };

  const handleUploadEmp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpFile || !uploadEmpForm.name || !selectedEmpId) {
      alert('Please provide document name, select file, and choose employee');
      return;
    }
    try {
      await api.documents.uploadEmployee(selectedEmpId, uploadEmpForm, selectedEmpFile);
      setIsUploadEmpOpen(false);
      setSelectedEmpFile(null);
      setUploadEmpForm({ name: '', type: 'CONTRACT', description: '' });
      fetchEmpDocs(selectedEmpId);
    } catch (err: any) {
      alert(err.message || 'Employee document upload failed');
    }
  };

  const handleArchiveOrg = async (id: string) => {
    if (!confirm('Are you sure you want to archive this document?')) return;
    try {
      await api.documents.archiveOrg(id);
      fetchOrgDocs();
    } catch (err: any) {
      alert(err.message || 'Archive failed');
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Document Vault</h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              Encrypted & Compliant
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Store organizational policies, compliance documentation, and employee personnel files.
          </p>
        </div>

        <div>
          {activeTab === 'org' ? (
            <button
              onClick={() => setIsUploadOrgOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition"
            >
              <Upload className="size-4" />
              <span>Upload Org Document</span>
            </button>
          ) : (
            <button
              onClick={() => setIsUploadEmpOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition"
            >
              <Upload className="size-4" />
              <span>Attach Employee File</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('org')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            activeTab === 'org'
              ? 'bg-accent text-accent-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Organization Policies & Documents ({orgDocs.length})
        </button>
        <button
          onClick={() => setActiveTab('employee')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            activeTab === 'employee'
              ? 'bg-accent text-accent-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Employee Personnel Records
        </button>
      </div>

      {activeTab === 'org' ? (
        <>
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm pl-2">
              <Filter className="size-4" />
              <span>Category Filter:</span>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Categories</option>
              <option value="POLICY">Policy</option>
              <option value="COMPLIANCE">Compliance</option>
              <option value="BENEFIT">Benefit</option>
              <option value="TAX">Tax</option>
              <option value="OTHER">Other</option>
            </select>

            {categoryFilter && (
              <button
                onClick={() => setCategoryFilter('')}
                className="text-xs text-muted-foreground hover:text-foreground transition underline ml-auto pr-2"
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Org Documents Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {loading ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                Loading organizational documents...
              </div>
            ) : orgDocs.length === 0 ? (
              <div className="py-20 text-center">
                <FileCheck2 className="mx-auto size-10 text-muted-foreground/40 mb-3" />
                <h3 className="text-base font-semibold">No organization documents found</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload company handbooks, compliance guidelines, or tax documentation.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3.5">Document Title</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">File Format</th>
                      <th className="px-6 py-3.5">Size</th>
                      <th className="px-6 py-3.5">Uploaded</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-border">
                    {orgDocs.map((doc) => (
                      <tr key={doc._id || doc.id} className="hover:bg-muted/20">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">{doc.title}</div>
                          {doc.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{doc.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                            {doc.category || 'POLICY'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs uppercase text-muted-foreground">
                          {doc.fileExtension || doc.mimeType?.split('/')[1] || 'PDF'}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          {formatBytes(doc.fileSize)}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={api.documents.downloadOrgUrl(doc._id || doc.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition"
                            >
                              <Download className="size-3" />
                              <span>Download</span>
                            </a>
                            <button
                              onClick={() => handleArchiveOrg(doc._id || doc.id)}
                              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-rose-400 transition"
                              title="Archive Document"
                            >
                              <Archive className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Employee Documents Tab */
        <div className="space-y-6">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select Employee:
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary max-w-md"
            >
              {employees.map((emp) => (
                <option key={emp._id || emp.id} value={emp._id || emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.workEmail})
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {empDocs.length === 0 ? (
              <div className="py-20 text-center">
                <FileText className="mx-auto size-10 text-muted-foreground/40 mb-3" />
                <h3 className="text-base font-semibold">No personal documents attached</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload identity, contract, tax or education records for this employee.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3.5">Document Name</th>
                      <th className="px-6 py-3.5">Type</th>
                      <th className="px-6 py-3.5">File Format</th>
                      <th className="px-6 py-3.5">Size</th>
                      <th className="px-6 py-3.5 text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-border">
                    {empDocs.map((doc) => (
                      <tr key={doc._id || doc.id} className="hover:bg-muted/20">
                        <td className="px-6 py-4 font-semibold text-foreground">{doc.name}</td>
                        <td className="px-6 py-4">
                          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                            {doc.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs uppercase text-muted-foreground">
                          {doc.mimeType?.split('/')[1] || 'PDF'}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          {formatBytes(doc.size)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={api.documents.downloadEmployeeUrl(selectedEmpId, doc._id || doc.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition"
                          >
                            <Download className="size-3" />
                            <span>Download</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Upload Org Document */}
      {isUploadOrgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">Upload Organization Document</h2>
              <button
                onClick={() => setIsUploadOrgOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleUploadOrg} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Employee Code of Conduct 2026"
                  value={uploadOrgForm.title}
                  onChange={(e) => setUploadOrgForm({ ...uploadOrgForm, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Category *</label>
                <select
                  value={uploadOrgForm.category}
                  onChange={(e) => setUploadOrgForm({ ...uploadOrgForm, category: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="POLICY">POLICY</option>
                  <option value="COMPLIANCE">COMPLIANCE</option>
                  <option value="BENEFIT">BENEFIT</option>
                  <option value="TAX">TAX</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Select File (PDF, DOCX, etc.) *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedOrgFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2 text-sm text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  rows={2}
                  value={uploadOrgForm.description}
                  onChange={(e) => setUploadOrgForm({ ...uploadOrgForm, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsUploadOrgOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Employee Document */}
      {isUploadEmpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">Attach Employee Personnel File</h2>
              <button
                onClick={() => setIsUploadEmpOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleUploadEmp} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Document Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Signed Offer Letter, ID Verification"
                  value={uploadEmpForm.name}
                  onChange={(e) => setUploadEmpForm({ ...uploadEmpForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Document Type *</label>
                <select
                  value={uploadEmpForm.type}
                  onChange={(e) => setUploadEmpForm({ ...uploadEmpForm, type: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="CONTRACT">CONTRACT</option>
                  <option value="ID_PROOF">ID_PROOF</option>
                  <option value="TAX_FORM">TAX_FORM</option>
                  <option value="RESUME">RESUME</option>
                  <option value="CERTIFICATE">CERTIFICATE</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Select File *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedEmpFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2 text-sm text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary-foreground"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsUploadEmpOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Attach to Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
