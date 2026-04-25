import React from 'react';
import { Zap, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-primary-500/30">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-slate-900/90 backdrop-blur-xl border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
              <Zap className="text-white w-5 h-5 fill-white" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase font-display">
              Ride <span className="text-primary-400">For You</span>
            </span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl lg:text-6xl font-black tracking-tighter font-display mb-8">
            PRIVACY <span className="text-primary-400">POLICY</span>
          </h1>
          
          <div className="space-y-8 text-slate-400 leading-relaxed text-lg font-medium">
            <section className="bg-white/5 border border-white/10 p-8 rounded-3xl">
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">1. Information We Collect</h2>
              <p>
                At Ride For You EV, we collect information to provide better services to our riders. This includes:
              </p>
              <ul className="list-disc ml-6 mt-4 space-y-2">
                <li>Personal identification (Name, email address, phone number).</li>
                <li>Documentation for vehicle rental (Aadhar card, Driving License).</li>
                <li>Payment information (Processed securely via our payment partners).</li>
                <li>Vehicle usage and location data for safety and maintenance.</li>
              </ul>
            </section>

            <section className="p-4">
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">2. How We Use Information</h2>
              <p>
                We use the information we collect to:
              </p>
              <ul className="list-disc ml-6 mt-4 space-y-2">
                <li>Manage your vehicle rental and provide customer support.</li>
                <li>Process your payments and issue invoices.</li>
                <li>Send important notifications regarding your rental status via WhatsApp or SMS.</li>
                <li>Improve our fleet management and urban mobility services.</li>
              </ul>
            </section>

            <section className="bg-white/5 border border-white/10 p-8 rounded-3xl">
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">3. Data Security</h2>
              <p>
                We implement a variety of security measures to maintain the safety of your personal information. Your data is stored on secure servers and access is limited to authorized personnel only. We use industry-standard encryption for all financial transactions.
              </p>
            </section>

            <section className="p-4">
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">4. Third-Party Sharing</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except for:
              </p>
              <ul className="list-disc ml-6 mt-4 space-y-2">
                <li>Payment gateways (Cashfree/Razorpay) to process transactions.</li>
                <li>Communication services (Twilio) to send rental updates.</li>
                <li>Legal authorities if required by law.</li>
              </ul>
            </section>

            <section className="bg-white/5 border border-white/10 p-8 rounded-3xl">
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">5. Your Data Rights</h2>
              <p>
                As a user, you have the following rights regarding your personal data:
              </p>
              <ul className="list-disc ml-6 mt-4 space-y-2">
                <li><strong>Right to Access:</strong> You can request a copy of the data we hold about you.</li>
                <li><strong>Right to Correction:</strong> You can ask us to update or fix any inaccurate information.</li>
                <li><strong>Right to Erasure:</strong> You can request that we delete your personal data (subject to legal retention requirements).</li>
                <li><strong>Right to Withdraw Consent:</strong> You can opt-out of marketing communications at any time.</li>
              </ul>
            </section>

            <section className="p-4">
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">6. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active or as needed to provide you services. We will also retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section className="bg-primary-500/10 border border-primary-500/20 p-8 rounded-3xl">
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">7. Grievance Officer</h2>
              <p className="text-white">
                In accordance with Information Technology Act 2000 and rules made there under, the name and contact details of the Grievance Officer are provided below:
              </p>
              <div className="mt-4 space-y-1">
                <p className="font-bold">Grievance Officer: Pasireddy Balram Kumar</p>
                <p>Ride For You EV (YS Manpower Solutions)</p>
                <p>Email: rideforyouev@gmail.com</p>
                <p>Address: Plot No. 12, Phase 1, Jeedimetla Industrial Area, Hyderabad, TS 500055</p>
                <p className="mt-2 text-sm opacity-70 italic">Last Updated: April 25, 2026</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">© 2026 Ride For You EV. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
