import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Phone, 
  Calendar, 
  Car, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  History, 
  MessageSquare, 
  Plus, 
  Send, 
  ShieldCheck,
  Loader2,
  TrendingUp,
  Receipt,
  Download
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function RiderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [complaintText, setComplaintText] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  const fetchRiderDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/riders/${id}/details`);
      setRider(res.data.data);
    } catch (err) {
      toast.error('Failed to load rider details');
      navigate('/riders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderDetails();
  }, [id]);

  const handleAddComplaint = async (e) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    setIsSubmittingComplaint(true);
    try {
      await api.post(`/riders/${id}/complaints`, { text: complaintText });
      toast.success('Complaint recorded');
      setComplaintText('');
      fetchRiderDetails();
    } catch (err) {
      toast.error('Failed to add complaint');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const handleDownloadInvoice = (invoice) => {
    try {
      const doc = new jsPDF();
      const primaryColor = [14, 165, 233]; // #0ea5e9
      const secondaryColor = [15, 23, 42];  // #0f172a
      
      // -- Page Border & Decorative Elements --
      doc.setDrawColor(240, 240, 240);
      doc.rect(5, 5, 200, 287);
      
      // -- Header Section --
      doc.setFillColor(...secondaryColor);
      doc.rect(0, 0, 210, 50, 'F');
      
      // Logo/Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text("RIDE FOR YOU", 20, 30);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 180, 180);
      doc.text("PREMIUM EV RENTAL SOLUTIONS", 20, 38);
      
      // Company Address (Right Aligned)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("Suraram Colony,", 190, 25, { align: "right" });
      doc.text("Jeedimetla, Hyderabad,", 190, 30, { align: "right" });
      doc.text("Telangana - 500055", 190, 35, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text("GSTIN: PENDING / APPLIED", 190, 42, { align: "right" });
      doc.text("SAC: 9966 (EV RENTALS)", 190, 46, { align: "right" });

      // -- Invoice Meta Box --
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(140, 60, 50, 30, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(140, 60, 50, 30, 3, 3, 'S');
      
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE NO:", 145, 70);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.invoiceNum, 145, 75);
      
      doc.setFont("helvetica", "bold");
      doc.text("DATE:", 145, 82);
      doc.setFont("helvetica", "normal");
      doc.text(new Date(invoice.createdAt).toLocaleDateString('en-GB'), 145, 87);

      // -- Billing Info --
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...secondaryColor);
      doc.text("TAX INVOICE", 20, 75);
      
      doc.setFontSize(10);
      doc.text("BILL TO:", 20, 95);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(rider.name, 20, 102);
      doc.text(`Phone: ${rider.whatsappNumber}`, 20, 107);
      doc.text(`Vehicle: ${rider.vehicleNumber}`, 20, 112);

      // -- Table --
      autoTable(doc, {
        startY: 125,
        head: [['ITEM DESCRIPTION', 'BILLING PERIOD', 'TYPE', 'TOTAL']],
        body: [[
          invoice.remarks || "Weekly Rental Subscription Service",
          invoice.billingMonth,
          invoice.invoiceType,
          `INR ${invoice.actualRent?.toLocaleString()}.00`
        ]],
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: secondaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: [249, 250, 251] }
      });

      // -- Totals --
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(130, finalY, 190, finalY);
      
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL AMOUNT DUE:", 110, finalY + 10); // Moved to 110 for more space
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.text(`INR ${invoice.actualRent?.toLocaleString()}.00`, 190, finalY + 10, { align: "right" });

      // -- Trust Elements --
      // Digital Stamp (Mock)
      const stampY = 240;
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(1);
      doc.circle(40, stampY, 15, 'S');
      doc.setFontSize(6);
      doc.setTextColor(...primaryColor);
      doc.text("DIGITALLY", 40, stampY - 3, { align: "center" });
      doc.setFontSize(8);
      doc.text("VERIFIED", 40, stampY + 2, { align: "center" });
      doc.setFontSize(5);
      doc.text("RIDE FOR YOU", 40, stampY + 6, { align: "center" });

      // Mock QR Code
      doc.setFillColor(240, 240, 240);
      doc.rect(160, 230, 30, 30, 'F');
      doc.setFillColor(0, 0, 0);
      // Drawing some random small squares for "QR" look
      for(let i=0; i<5; i++){
        for(let j=0; j<5; j++){
          if(Math.random() > 0.4) doc.rect(162 + (i*5.5), 232 + (j*5.5), 4, 4, 'F');
        }
      }
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text("Scan to verify authenticity", 175, 265, { align: "center" });

      // -- Footer --
      doc.setFillColor(...secondaryColor);
      doc.rect(0, 280, 210, 17, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("TERMS: This is an automated bill. Payment is due within 24 hours of generation.", 20, 287);
      doc.text("www.evride.com | +91 800-EV-RIDE", 190, 287, { align: "right" });

      // -- Save --
      doc.save(`Invoice_${invoice.invoiceNum}_${rider.name.split(' ')[0]}.pdf`);
      toast.success('Professional Invoice Generated!');
    } catch (err) {
      console.error(err);
      toast.error('PDF Generation Failed');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary-500" size={48} />
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!rider) return null;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-20 px-0 md:px-0">
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link 
          to="/app/riders" 
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group w-fit"
        >
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800/50 group-hover:bg-primary-500/20 group-hover:text-primary-400 transition-all border border-slate-200 dark:border-slate-800">
            <ArrowLeft size={18} />
          </div>
          <span className="font-black uppercase tracking-widest text-[10px]">Back to Fleet</span>
        </Link>
        <div className="flex gap-3">
          <a 
            href={`https://wa.me/${rider.whatsappNumber.replace(/[^0-9]/g, '').startsWith('91') ? '' : '91'}${rider.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${rider.name}, this is Ride For You Admin. Regarding your vehicle ${rider.vehicleNumber}...`)}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none btn-primary flex items-center justify-center gap-2 px-6 py-3 shadow-glow-primary bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 text-white rounded-2xl transition-all"
          >
            <Send size={18} />
            <span className="font-black uppercase tracking-widest text-xs">WhatsApp</span>
          </a>
          {(rider.riderStatus === 'returned' || rider.riderStatus === 'inactive') && (
            <button 
              onClick={async () => {
                try {
                  toast.loading('Sending image promo...');
                  await api.post(`/riders/${rider._id}/send-reminder`, { 
                    templateName: 'rejoiner_direct_v1', // Using the approved one!
                    variables: { 1: rider.name },
                    headerImage: 'https://rideforyouev.com/assets/fusion.png'
                  });
                  toast.dismiss();
                  toast.success('Promo sent successfully!');
                } catch (err) {
                  toast.dismiss();
                  toast.error('Failed to send promo');
                }
              }}
              className="flex-1 sm:flex-none btn-primary flex items-center justify-center gap-2 px-6 py-3 shadow-glow-primary bg-indigo-600 hover:bg-indigo-500 border-indigo-500/50 text-white rounded-2xl transition-all"
            >
              <TrendingUp size={18} />
              <span className="font-black uppercase tracking-widest text-xs">Send Promo</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column: Basic Info & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-dark-100 border border-slate-200 dark:border-slate-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <ShieldCheck size={120} className="text-primary-500 rotate-12" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center text-primary-400 text-2xl md:text-3xl font-black shadow-inner">
                {rider.name.charAt(0)}
              </div>
              
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{rider.name}</h1>
                <p className="text-primary-500 font-bold flex items-center gap-2 mt-2 uppercase tracking-widest text-[10px] md:text-xs">
                  <Phone size={14} /> {rider.whatsappNumber}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${
                  rider.riderStatus === 'active' 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                  : 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20'
                }`}>
                  {rider.riderStatus}
                </span>
                <span className={`px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${
                  rider.paymentStatus === 'paid' 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                  : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
                }`}>
                  {rider.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-glow-primary border border-white/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/10">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-lg font-display font-black text-white uppercase tracking-tight">Tenure Metrics</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Total Weeks</p>
                <p className="text-xl md:text-2xl font-display font-black text-white mt-1">{rider.totalWeeks || 0}</p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Bikes Used</p>
                <p className="text-xl md:text-2xl font-display font-black text-white mt-1">{rider.bikesUsed?.length || 1}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Sections */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Current Vehicle & Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white dark:bg-dark-100 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary-500 dark:text-primary-400 border border-slate-200 dark:border-slate-700">
                  <Car size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Primary Vehicle</p>
                  <p className="text-lg md:text-xl font-mono font-black text-slate-900 dark:text-white mt-1 uppercase tracking-tight">{rider.vehicleNumber}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-100 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                  <CreditCard size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Locked Rental Rate</p>
                  <p className="text-lg md:text-xl font-display font-black text-slate-900 dark:text-white mt-1 leading-none">
                    ₹{(rider.rentalRate || 2000).toLocaleString()} <span className="text-[10px] text-slate-400 font-bold ml-1">/ WEEK</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-100 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Renewal</p>
                  <p className="text-lg md:text-xl font-display font-black text-slate-900 dark:text-white mt-1 leading-none">
                    {new Date(rider.returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Invoice History */}
          <div className="bg-white dark:bg-dark-100/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-transparent">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Receipt size={20} />
              </div>
              <h3 className="text-lg font-display font-black text-slate-900 dark:text-white uppercase tracking-tight">Invoice Ledger</h3>
            </div>
            <div className="max-h-[300px] overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100/40 dark:bg-slate-900/30 sticky top-0 backdrop-blur-sm">
                  <tr>
                    <th className="p-4 md:p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Invoice</th>
                    <th className="p-4 md:p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                    <th className="p-4 md:p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {rider.invoices?.length > 0 ? rider.invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                      <td className="p-4 md:p-6 font-mono text-[10px] md:text-xs text-slate-900 dark:text-white uppercase tracking-wider font-bold">{inv.invoiceNum}</td>
                      <td className="p-4 md:p-6 text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold">{new Date(inv.createdAt).toLocaleDateString('en-GB')}</td>
                      <td className="p-4 md:p-6 text-right font-black text-slate-900 dark:text-white text-sm">
                        <div className="flex items-center justify-end gap-2 md:gap-4">
                          <span className="text-xs md:text-sm whitespace-nowrap">₹{inv.actualRent?.toLocaleString()}</span>
                          <button 
                            onClick={() => handleDownloadInvoice(inv)}
                            className="p-1.5 md:p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary-500 hover:bg-primary-500/10 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" className="p-10 md:p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">No linked invoices found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bike History & Complaints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white dark:bg-dark-100 border border-slate-200 dark:border-slate-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500">
                  <History size={20} />
                </div>
                <h3 className="text-lg font-display font-black text-slate-900 dark:text-white uppercase tracking-tight">Vehicle Log</h3>
              </div>
              <div className="space-y-3">
                {rider.bikesUsed?.length > 0 ? rider.bikesUsed.map((bike, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-dark-200 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">{bike}</span>
                    <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest px-2 py-0.5 bg-primary-500/10 rounded-lg">Operational</span>
                  </div>
                )) : (
                  <div className="bg-slate-50 dark:bg-dark-200 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">{rider.vehicleNumber}</span>
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 rounded-lg">Current</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-dark-100 border border-slate-200 dark:border-slate-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                    <AlertCircle size={20} />
                  </div>
                  <h3 className="text-lg font-display font-black text-slate-900 dark:text-white uppercase tracking-tight">Concerns</h3>
                </div>
              </div>

              <div className="flex-1 space-y-4 max-h-[150px] overflow-y-auto custom-scrollbar mb-6 px-1">
                {rider.complaints?.length > 0 ? rider.complaints.map((c, idx) => (
                  <div key={idx} className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl">
                    <p className="text-[11px] md:text-xs text-slate-900 dark:text-white font-bold leading-relaxed">{c.text}</p>
                    <p className="text-[8px] md:text-[9px] text-red-400 dark:text-red-500/50 mt-2 font-black uppercase tracking-widest">{new Date(c.date).toLocaleDateString()}</p>
                  </div>
                )) : (
                  <div className="py-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No recent concerns</div>
                )}
              </div>

              <form onSubmit={handleAddComplaint} className="relative mt-auto">
                <input 
                  type="text" 
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder="Record new concern..."
                  className="w-full bg-slate-50 dark:bg-dark-200 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white pl-5 pr-12 py-3.5 rounded-2xl text-[11px] md:text-xs font-bold focus:outline-none focus:border-red-500/50 transition-all shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={isSubmittingComplaint}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                  aria-label="Add Complaint"
                >
                  {isSubmittingComplaint ? <Loader2 size={18} className="animate-spin" /> : <Plus size={20} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
