import React from 'react';
import { Zap, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-primary-500/30">
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
            TERMS & <span className="text-primary-400">CONDITIONS</span>
          </h1>
          
          <div className="space-y-8 text-slate-400 leading-relaxed text-lg font-medium">
            <section className="bg-white/5 border border-white/10 p-8 rounded-3xl">
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">1. Acceptance of Terms</h2>
              <p>
                By using the services of Ride For You EV, you agree to comply with and be bound by the following terms and conditions. These terms apply to all riders and users of our electric vehicle fleet.
              </p>
            </section>

            <section className="p-4">
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">2. Eligibility & Documentation</h2>
              <ul className="list-disc ml-6 mt-2 space-y-2">
                <li>Riders must be at least 18 years of age.</li>
                <li>A valid Driving License and Aadhar Card are mandatory for all rentals.</li>
                <li>The vehicle is for personal use only and cannot be sub-rented or used for illegal activities.</li>
              </ul>
            </section>

            <section className="bg-white/5 border border-white/10 p-8 rounded-3xl">
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">3. Rental Payments & Security Deposit</h2>
              <p>
                Rental fees are charged on a weekly basis as specified in your agreement.
              </p>
              <ul className="list-disc ml-6 mt-4 space-y-2">
                <li>Payments must be made in advance via our official payment links.</li>
                <li>A non-refundable platform fee and booking fee apply to new registrations.</li>
                <li>Failure to pay the weekly rental on time may result in vehicle immobilization or retrieval.</li>
              </ul>
            </section>

            <section className="p-4">
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">4. Vehicle Maintenance & Damage</h2>
              <p>
                Riders are responsible for the vehicle during the rental period.
              </p>
              <ul className="list-disc ml-6 mt-4 space-y-2">
                <li>Normal wear and tear is expected, but any accidental damage is the responsibility of the rider.</li>
                <li>Theft or total loss must be reported to the police and Ride For You EV immediately.</li>
                <li>Unauthorized modifications to the EV are strictly prohibited.</li>
              </ul>
            </section>

            <section className="bg-white/5 border border-white/10 p-8 rounded-3xl">
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">5. Limitation of Liability</h2>
              <p>
                Ride For You EV shall not be liable for any indirect, incidental, or consequential damages arising out of the use or inability to use our vehicles. Riders operate the vehicles at their own risk.
              </p>
            </section>

            <section className="bg-primary-500/10 border border-primary-500/20 p-8 rounded-3xl">
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">6. Termination</h2>
              <p>
                We reserve the right to terminate your rental agreement and retrieve the vehicle if any of these terms are violated.
              </p>
              <div className="mt-6 text-sm opacity-70 italic">Last Updated: April 24, 2026</div>
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

export default TermsAndConditions;
