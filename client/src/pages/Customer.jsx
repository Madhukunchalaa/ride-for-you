import { useState, useEffect } from "react";
import api from "../api/axios";
import Pagination from "../components/Pagination";
import { Users, Search, Loader2, ShieldCheck, Mail, Phone, MapPin, MessageSquare, Tag, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const Customer = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                // Fetch customers using relative path mapped to backend
                const response = await api.get("/customers");
                
                // response.data holds the JSON from server { success: true, data: [...] }
                if (response.data && response.data.success) {
                    setCustomers(response.data.data);
                } else {
                    setCustomers(response.data || []);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching customers:", error);
                setError(error);
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const handleUpdate = async (id, field, value) => {
        try {
            await api.patch(`/customers/${id}`, { [field]: value });
            setCustomers(prev => prev.map(c => c._id === id ? { ...c, [field]: value } : c));
            toast.success('Updated successfully');
        } catch (error) {
            console.error("Failed to update", error);
            toast.error('Failed to update');
        }
    };

    const filteredCustomers = customers.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phone?.includes(searchTerm)
    );

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const paginatedCustomers = filteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center gap-4 bg-white dark:bg-dark-100/40 rounded-[2rem] border border-slate-200 dark:border-slate-800">
               <Loader2 size={32} className="text-primary-500 animate-spin" />
               <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Customer Base...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">Customer Database</h2>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary-500/10 border border-primary-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                            <span className="text-[8px] font-black text-primary-500 uppercase tracking-widest">Leads & CRM</span>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-bold flex items-center gap-2">
                        <ShieldCheck size={16} className="text-primary-500" /> Lead Management System
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by name, email or phone..." 
                        className="input pl-12 h-14 bg-white dark:bg-dark-200/50 border-slate-200 dark:border-slate-800/50 focus:border-primary-500/50 focus:bg-white dark:focus:bg-dark-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white dark:bg-dark-100/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-dark-200/30">
                                <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Customer Details</th>
                                <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Contact</th>
                                <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Location</th>
                                <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Requirements</th>
                                <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Lead Status</th>
                                <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                            {paginatedCustomers.length > 0 ? (
                                paginatedCustomers.map((customer) => (
                                    <tr key={customer._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center text-primary-500 font-black">
                                                    {customer.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-slate-900 dark:text-white font-black uppercase tracking-tight">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 space-y-1">
                                            <p className="text-xs text-slate-500 flex items-center gap-2 font-bold">
                                                <Mail size={12} className="text-primary-500/70" /> {customer.email}
                                            </p>
                                            <p className="text-xs text-slate-500 flex items-center gap-2 font-bold">
                                                <Phone size={12} className="text-primary-500/70" /> {customer.phone}
                                            </p>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                                <MapPin size={14} className="text-primary-500" /> {customer.city || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-6 max-w-xs">
                                            <div className="flex items-start gap-2">
                                                <MessageSquare size={14} className="text-slate-400 mt-1 shrink-0" />
                                                <p className="text-xs text-slate-500 font-medium line-clamp-2">{customer.message || 'No requirements provided'}</p>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="relative w-fit">
                                                <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500 pointer-events-none" />
                                                <select 
                                                    value={customer.leadStatus || 'New'}
                                                    onChange={(e) => handleUpdate(customer._id, 'leadStatus', e.target.value)}
                                                    className="input h-10 pl-9 pr-8 text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-dark-200 border-slate-200 dark:border-slate-800"
                                                >
                                                    <option value="New">New</option>
                                                    <option value="Contacted">Contacted</option>
                                                    <option value="Interested">Interested</option>
                                                    <option value="Not Interested">Not Interested</option>
                                                    <option value="Converted">Converted</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="relative">
                                                <FileText size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                <input 
                                                    type="text" 
                                                    defaultValue={customer.notes || ''}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== customer.notes) {
                                                            handleUpdate(customer._id, 'notes', e.target.value);
                                                        }
                                                    }}
                                                    placeholder="Add note..."
                                                    className="input h-10 pl-9 text-xs font-bold bg-transparent border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:bg-white dark:focus:bg-dark-200 focus:border-primary-500/50"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">No customers found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredCustomers.length}
                itemsPerPage={itemsPerPage}
            />
        </div>
    );
};

export default Customer;