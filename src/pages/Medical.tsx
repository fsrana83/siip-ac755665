import { useState } from 'react';
import { Search, Stethoscope, Calendar, MapPin, MoreHorizontal, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';
import { MedicalExam } from '@/lib/types';

const statusStyles: Record<string, string> = {
  Pending: 'status-pending',
  Booked: 'bg-info/15 text-info border border-info/20',
  Completed: 'status-active',
  Waived: 'status-draft',
};

const statusIcons: Record<string, typeof Clock> = {
  Pending: Clock,
  Booked: Calendar,
  Completed: CheckCircle,
  Waived: AlertTriangle,
};

const Medical = () => {
  const [search, setSearch] = useState('');
  const { medicalExams, setMedicalExams } = useData();
  const { toast } = useToast();

  const [bookingDialog, setBookingDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState<MedicalExam | null>(null);
  const [medicalCenter, setMedicalCenter] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingRemarks, setBookingRemarks] = useState('');

  const [resultsDialog, setResultsDialog] = useState(false);
  const [resultsText, setResultsText] = useState('');

  const filtered = medicalExams.filter(m =>
    m.clientName.toLowerCase().includes(search.toLowerCase()) ||
    m.proposalNo.toLowerCase().includes(search.toLowerCase())
  );

  const openBooking = (exam: MedicalExam) => {
    setSelectedExam(exam);
    setMedicalCenter(exam.medicalCenter);
    setBookingDate(exam.bookingDate);
    setBookingTime(exam.bookingTime);
    setBookingRemarks(exam.bookingRemarks);
    setBookingDialog(true);
  };

  const handleSaveBooking = () => {
    if (!selectedExam) return;
    setMedicalExams(prev => prev.map(m => m.id === selectedExam.id ? {
      ...m,
      medicalCenter,
      bookingDate,
      bookingTime,
      bookingRemarks,
      status: bookingDate ? 'Booked' as const : m.status,
    } : m));
    setBookingDialog(false);
    toast({ title: 'Booking updated', description: `${selectedExam.proposalNo} — ${medicalCenter || 'No center'}` });
  };

  const openResults = (exam: MedicalExam) => {
    setSelectedExam(exam);
    setResultsText(exam.results || '');
    setResultsDialog(true);
  };

  const handleCompleteExam = () => {
    if (!selectedExam) return;
    setMedicalExams(prev => prev.map(m => m.id === selectedExam.id ? {
      ...m,
      status: 'Completed' as const,
      results: resultsText,
    } : m));
    setResultsDialog(false);
    toast({ title: 'Medical exam completed', description: selectedExam.proposalNo });
  };

  const handleWaive = (exam: MedicalExam) => {
    setMedicalExams(prev => prev.map(m => m.id === exam.id ? { ...m, status: 'Waived' as const } : m));
    toast({ title: 'Medical exam waived', description: exam.proposalNo });
  };

  const inputClass = "w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  const pendingCount = medicalExams.filter(m => m.status === 'Pending').length;
  const bookedCount = medicalExams.filter(m => m.status === 'Booked').length;
  const completedCount = medicalExams.filter(m => m.status === 'Completed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Medical Examinations</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and manage medical exam requirements for proposals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Cases', value: medicalExams.length, color: 'text-foreground' },
          { label: 'Pending', value: pendingCount, color: 'text-amber-600' },
          { label: 'Booked', value: bookedCount, color: 'text-info' },
          { label: 'Completed', value: completedCount, color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search by client or proposal..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Stethoscope className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No medical exam cases yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Medical exams are created automatically when a proposal's Sum Assured exceeds the product's medical threshold.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">Proposal</th>
                  <th className="text-left px-4 py-3">Client</th>
                  <th className="text-left px-4 py-3">Product</th>
                  <th className="text-right px-4 py-3">Sum Assured</th>
                  <th className="text-left px-4 py-3">Medical Center</th>
                  <th className="text-left px-4 py-3">Booking</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const StatusIcon = statusIcons[m.status] || Clock;
                  return (
                    <tr key={m.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-primary">{m.proposalNo}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{m.clientName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{m.productName}</td>
                      <td className="px-4 py-3 text-sm text-foreground text-right font-medium">OMR {m.sumAssured.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {m.medicalCenter || <span className="text-muted-foreground/50 italic">Not assigned</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {m.bookingDate ? `${m.bookingDate} ${m.bookingTime}` : <span className="text-muted-foreground/50 italic">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[m.status]}`}>
                          <StatusIcon className="w-3 h-3" /> {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-muted/50 transition-colors">
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(m.status === 'Pending' || m.status === 'Booked') && (
                              <DropdownMenuItem onClick={() => openBooking(m)} className="gap-2">
                                <MapPin className="w-4 h-4" /> {m.status === 'Pending' ? 'Add Booking' : 'Edit Booking'}
                              </DropdownMenuItem>
                            )}
                            {m.status === 'Booked' && (
                              <DropdownMenuItem onClick={() => openResults(m)} className="gap-2">
                                <CheckCircle className="w-4 h-4" /> Record Results
                              </DropdownMenuItem>
                            )}
                            {(m.status === 'Pending' || m.status === 'Booked') && (
                              <DropdownMenuItem onClick={() => handleWaive(m)} className="gap-2 text-amber-600">
                                <AlertTriangle className="w-4 h-4" /> Waive Medical
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingDialog} onOpenChange={setBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Medical Booking — {selectedExam?.proposalNo}
            </DialogTitle>
          </DialogHeader>
          {selectedExam && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 border border-border rounded-lg text-sm space-y-1">
                <p><span className="text-muted-foreground">Client:</span> <span className="text-foreground font-medium">{selectedExam.clientName}</span></p>
                <p><span className="text-muted-foreground">Product:</span> <span className="text-foreground">{selectedExam.productName}</span></p>
                <p><span className="text-muted-foreground">Sum Assured:</span> <span className="text-foreground font-medium">OMR {selectedExam.sumAssured.toLocaleString()}</span></p>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Medical Center (Optional)</label>
                <input value={medicalCenter} onChange={e => setMedicalCenter(e.target.value)} className={inputClass} placeholder="e.g. Al Raffah Hospital, Muscat" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Booking Date</label>
                  <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Booking Time</label>
                  <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Remarks</label>
                <textarea value={bookingRemarks} onChange={e => setBookingRemarks(e.target.value)} rows={2}
                  className={`${inputClass} resize-none`} placeholder="Any special instructions..." />
              </div>
              <button onClick={handleSaveBooking}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90">
                Save Booking
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={resultsDialog} onOpenChange={setResultsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" /> Record Results — {selectedExam?.proposalNo}
            </DialogTitle>
          </DialogHeader>
          {selectedExam && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 border border-border rounded-lg text-sm space-y-1">
                <p><span className="text-muted-foreground">Client:</span> <span className="text-foreground font-medium">{selectedExam.clientName}</span></p>
                <p><span className="text-muted-foreground">Center:</span> <span className="text-foreground">{selectedExam.medicalCenter || 'N/A'}</span></p>
                <p><span className="text-muted-foreground">Booking:</span> <span className="text-foreground">{selectedExam.bookingDate} {selectedExam.bookingTime}</span></p>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Medical Examination Results</label>
                <textarea value={resultsText} onChange={e => setResultsText(e.target.value)} rows={4}
                  className={`${inputClass} resize-none`} placeholder="Enter examination results, findings, and recommendations..." />
              </div>
              <button onClick={handleCompleteExam}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700">
                Mark as Completed
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Medical;
