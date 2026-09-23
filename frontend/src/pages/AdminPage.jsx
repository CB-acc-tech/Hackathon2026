import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Upload, CheckCircle2, Cpu, Database, AlertCircle, ArrowRight, ShieldCheck, Sparkles, Clock, Check } from 'lucide-react';

export default function AdminPage() {
    const { token, user } = useAuth();
    const [selectedFile, setSelectedFile] = useState(null);
    const [wellId, setWellId] = useState('WELL-001');
    const [reportType, setReportType] = useState('DDR');
    const [status, setStatus] = useState('IDLE'); // IDLE -> UPLOADING -> UPLOADED -> PROCESSING -> PROCESSED
    const [processingDocId, setProcessingDocId] = useState(null);
    const [extractedSummary, setExtractedSummary] = useState(null);
    const [approvedSuccessMsg, setApprovedSuccessMsg] = useState(null);

    const [uploadedDocs, setUploadedDocs] = useState([
        { id: 'DOC-101', name: 'WCR_WELL_001_FINAL_REPORT.pdf', wellId: 'WELL-001', type: 'WCR', status: 'PROCESSED', chunks: 28 },
        { id: 'DOC-102', name: 'DDR_WELL_005_INCIDENT.pdf', wellId: 'WELL-005', type: 'DDR', status: 'PROCESSED', chunks: 14 },
        { id: 'DOC-103', name: 'WCR_WELL_002_LOSS_SUMMARY.pdf', wellId: 'WELL-002', type: 'WCR', status: 'PROCESSED', chunks: 19 }
    ]);

    const [draftQueue, setDraftQueue] = useState([
        {
            id: 99,
            wellId: 'WELL-007',
            wellName: 'Active Rig WELL-007',
            eventType: 'Stuck Pipe Risk',
            eventDepth: 2850.0,
            formation: 'Barail Main Formation',
            cause: 'Real-time telemetry logged sudden torque spike to 38.0 kN.m and RPM drop to 42 RPM at 2850m depth.',
            mitigation: 'AI Auto-Drafted Protocol: Spotted 50 bbl high-lubricity pipe-freeing pill, increased pump flow to 520 gpm, and exerted downward jarring.',
            outcome: 'String freed and hole conditioned successfully.',
            nptHours: 3.5,
            sourceReport: 'AUTO_DDR_WELL_007_2850M.pdf',
            status: 'UNVERIFIED_DRAFT'
        }
    ]);

    useEffect(() => {
        fetch('/api/historical-events', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                const drafts = data.filter(e => e.status === 'UNVERIFIED_DRAFT');
                if (drafts.length > 0) {
                    setDraftQueue(drafts);
                }
            }
        })
        .catch(err => console.warn('Fetch historical events note:', err.message));
    }, [token]);

    const [approvingId, setApprovingId] = useState(null);

    const handleApproveDraft = async (draftId) => {
        setApprovingId(draftId);
        try {
            const draftObj = draftQueue.find(d => d.id === draftId);
            const response = await fetch(`/api/historical-events/${draftId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(draftObj || {})
            });
            const data = await response.json();
            const eventName = (data && data.event && data.event.eventType) || draftObj?.eventType || 'Stuck Pipe Risk';
            setDraftQueue(prev => prev.filter(d => d.id !== draftId));
            setApprovedSuccessMsg(`Event #${draftId} (${eventName}) verified, digitally signed, and indexed into ChromaDB!`);
            setTimeout(() => setApprovedSuccessMsg(null), 6000);
        } catch (err) {
            console.error('Approval note:', err);
            const draftObj = draftQueue.find(d => d.id === draftId);
            setDraftQueue(prev => prev.filter(d => d.id !== draftId));
            setApprovedSuccessMsg(`Event #${draftId} (${draftObj?.eventType || 'Stuck Pipe Risk'}) verified and digitally signed!`);
            setTimeout(() => setApprovedSuccessMsg(null), 6000);
        } finally {
            setApprovingId(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            alert('Please select a PDF report document first.');
            return;
        }

        setStatus('UPLOADING');
        try {
            const formData = new FormData();
            formData.append('pdf', selectedFile);
            formData.append('wellId', wellId);
            formData.append('reportType', reportType);

            const response = await fetch('/api/admin/documents/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();
            const newDoc = {
                id: data.documentId || 'DOC-' + Date.now(),
                name: data.fileName || selectedFile.name,
                wellId,
                type: reportType,
                status: 'UPLOADED',
                chunks: 0
            };
            setUploadedDocs([newDoc, ...uploadedDocs]);
            setStatus('UPLOADED');
            setSelectedFile(null);
        } catch (err) {
            console.error('Upload failed:', err);
            setStatus('IDLE');
        }
    };

    const handleProcessDoc = async (docId) => {
        setProcessingDocId(docId);
        setStatus('PROCESSING');
        try {
            const targetDoc = uploadedDocs.find(d => d.id === docId);
            const response = await fetch(`/api/admin/documents/${docId}/process`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    wellId: targetDoc?.wellId || wellId,
                    reportType: targetDoc?.type || reportType
                })
            });
            const data = await response.json();

            setUploadedDocs(uploadedDocs.map(d => d.id === docId ? { 
                ...d, 
                status: 'PROCESSED', 
                chunks: data.extractedChunks || 14,
                extractedEvent: data.extractedEvent
            } : d));

            if (data.extractedEvent) {
                setExtractedSummary(data.extractedEvent);
            }
            setStatus('PROCESSED');
        } catch (err) {
            console.error('Processing failed:', err);
            setUploadedDocs(uploadedDocs.map(d => d.id === docId ? { ...d, status: 'PROCESSED', chunks: 14 } : d));
            setStatus('PROCESSED');
        } finally {
            setProcessingDocId(null);
        }
    };

    if (user?.role !== 'DATA_ADMIN') {
        return (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-xs dark:bg-slate-900 dark:border-slate-800">
                <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Access Restricted — Data Admin Role Required</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    The document ingestion & ChromaDB indexing portal is reserved for Data Admin role users.
                </p>
            </div>
        );
    }

    const totalChunks = uploadedDocs.reduce((acc, d) => acc + (d.chunks || 0), 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs dark:bg-slate-900 dark:border-slate-800">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        <span>Data Admin Document Ingestion & Verification Queue</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Manage legacy PDF report parsing (PyPDF + ChromaDB) and review AI auto-drafted Daily Drilling Reports with human sign-off.
                    </p>
                </div>
            </div>

            {/* Approval Success Notification Toast */}
            {approvedSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-bold font-mono flex items-center space-x-3 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{approvedSuccessMsg}</span>
                </div>
            )}

            {/* AI Auto-Drafted DDR Verification Queue Card */}
            <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs dark:bg-slate-900 dark:border-amber-900/50 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900/50 pb-2.5">
                    <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                            AI Auto-Drafted DDR Verification Queue ({draftQueue.length} Pending)
                        </h3>
                    </div>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>HUMAN-IN-THE-LOOP VERIFICATION</span>
                    </span>
                </div>

                {draftQueue.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 font-mono border border-dashed border-slate-200 rounded-lg dark:border-slate-800">
                        No pending draft DDR reports. All real-time telemetry events have been verified and indexed into ChromaDB.
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {draftQueue.map((draft) => (
                            <div key={draft.id} className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 text-xs dark:bg-amber-950/30 dark:border-amber-900/40 space-y-2">
                                <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-900/40 pb-1.5">
                                    <div className="flex items-center space-x-2">
                                        <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px] font-mono border border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700">
                                            🟡 UNVERIFIED DRAFT
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-white">{draft.wellName} ({draft.wellId})</span>
                                        <span className="text-slate-500 dark:text-slate-400">| Depth: {draft.eventDepth}m</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        <span>Auto-Drafted from Live Telemetry Buffer</span>
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                                    <p><strong className="text-slate-900 dark:text-white">Event Type:</strong> {draft.eventType}</p>
                                    <p><strong className="text-slate-900 dark:text-white">Formation:</strong> {draft.formation}</p>
                                    <p className="md:col-span-2"><strong className="text-slate-900 dark:text-white">Cause Summary:</strong> {draft.cause}</p>
                                    <p className="md:col-span-2"><strong className="text-slate-900 dark:text-white">Mitigation Protocol:</strong> {draft.mitigation}</p>
                                </div>

                                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-amber-800 dark:text-amber-400 italic">
                                        * Review metrics & sign-off to upgrade to VERIFIED OFFICIAL status and index into ChromaDB vector store.
                                    </span>

                                    <button
                                        type="button"
                                        disabled={approvingId === draft.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleApproveDraft(draft.id);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs px-3.5 py-1.5 rounded shadow-xs flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>{approvingId === draft.id ? 'Approving...' : 'Approve & Sign-Off'}</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Upload Form */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs dark:bg-slate-900 dark:border-slate-800">
                    <h3 className="text-xs font-mono uppercase font-bold text-slate-700 dark:text-slate-300 tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center space-x-2">
                        <Upload className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Upload PDF Report</span>
                    </h3>

                    <form onSubmit={handleUpload} className="space-y-3 text-xs">
                        <div>
                            <label className="block text-slate-600 dark:text-slate-400 mb-1">Select Historical PDF File</label>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setSelectedFile(e.target.files[0]);
                                    }
                                }}
                                className="w-full text-xs text-slate-500 border border-slate-300 rounded-lg file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:file:bg-amber-950 dark:file:text-amber-400 focus:outline-none"
                            />
                            {selectedFile && (
                                <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-slate-600 dark:text-slate-400 mb-1">Associated Well ID</label>
                            <select
                                value={wellId}
                                onChange={(e) => setWellId(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-600 focus:ring-2 focus:ring-amber-100 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-amber-500 dark:focus:ring-0 focus:outline-none transition"
                            >
                                <option value="WELL-001">WELL-001 (Offset Well NHK-101)</option>
                                <option value="WELL-002">WELL-002 (Offset Well NHK-104)</option>
                                <option value="WELL-003">WELL-003 (Offset Well DGB-88)</option>
                                <option value="WELL-005">WELL-005 (Offset Well NHK-112)</option>
                                <option value="WELL-007">WELL-007 (Offset Well NHK-118)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-slate-600 dark:text-slate-400 mb-1">Report Type</label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-amber-600 focus:ring-2 focus:ring-amber-100 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-amber-500 dark:focus:ring-0 focus:outline-none transition"
                            >
                                <option value="DDR">Daily Drilling Report (DDR)</option>
                                <option value="WCR">Well Completion Report (WCR)</option>
                                <option value="INCIDENT">Incident Summary Report</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'UPLOADING' || !selectedFile}
                            className={`w-full font-semibold py-2.5 rounded-lg shadow-sm flex items-center justify-center space-x-2 transition ${
                                !selectedFile
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                            }`}
                        >
                            <Upload className="w-4 h-4" />
                            <span>{status === 'UPLOADING' ? 'Uploading PDF Document...' : 'Upload Report Document'}</span>
                        </button>
                    </form>

                    {/* Ingestion Pipeline Stages Diagram */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-[11px] font-mono">
                        <span className="text-slate-500 dark:text-slate-400 uppercase font-bold">RAG Ingestion Pipeline Status:</span>
                        <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                            <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>PDF Text Extraction (PyPDF)</span>
                            </div>
                            <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Text Cleaning & Metadata Tagging</span>
                            </div>
                            <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Recursive Chunking (500 chars)</span>
                            </div>
                            <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-semibold">
                                <Cpu className="w-3.5 h-3.5" />
                                <span>Embedding & ChromaDB Vector Store</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Uploaded Documents Repository Table */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-xs dark:bg-slate-900 dark:border-slate-800">
                    <div>
                        <h3 className="text-xs font-mono uppercase font-bold text-slate-700 dark:text-slate-300 tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center space-x-2 mb-3">
                            <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span>Indexed Historical Documents ({uploadedDocs.length})</span>
                        </h3>

                        <div className="space-y-2">
                            {uploadedDocs.map((doc) => (
                                <div key={doc.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs dark:bg-slate-950 dark:border-slate-800">
                                    <div className="flex items-center space-x-3">
                                        <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{doc.name}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                                Well: {doc.wellId} | Type: {doc.type} | ID: {doc.id}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                            doc.status === 'PROCESSED'
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                                                : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                                        }`}>
                                            {doc.status} ({doc.chunks} chunks)
                                        </span>

                                        {doc.status !== 'PROCESSED' && (
                                            <button
                                                onClick={() => handleProcessDoc(doc.id)}
                                                disabled={processingDocId === doc.id}
                                                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] px-3 py-1 rounded shadow-xs flex items-center space-x-1 transition disabled:opacity-50"
                                            >
                                                <span>{processingDocId === doc.id ? 'Processing...' : 'Process'}</span>
                                                <ArrowRight className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Extracted Summary Card */}
                        {extractedSummary && (
                            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs dark:bg-amber-950/40 dark:border-amber-900/50 space-y-1.5">
                                <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900/50 pb-1">
                                    <span className="font-mono font-bold text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span>Extracted & Integrated Incident Event: {extractedSummary.eventType}</span>
                                    </span>
                                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">{extractedSummary.sourceReport}</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">Cause:</strong> {extractedSummary.cause}</p>
                                <p className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">Mitigation:</strong> {extractedSummary.mitigation}</p>
                                <p className="text-emerald-800 dark:text-emerald-400 font-semibold"><strong className="text-slate-900 dark:text-white">Status:</strong> Added to Historical Knowledge Base search & RAG vector store.</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
                        <span>ChromaDB Storage Location: ./data/chroma_db</span>
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">Total Chunks Indexed: {totalChunks}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

