import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from 'react-hot-toast';

const Customer = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) {
        return <div className="p-4 text-center">Loading customers...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500">Error: {error.message}</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Customers</h1>
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requirements</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {customers.length > 0 ? (
                            customers.map((customer) => (
                                <tr key={customer._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{customer.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{customer.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{customer.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{customer.city}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.message || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select 
                                            value={customer.leadStatus || 'New'}
                                            onChange={(e) => handleUpdate(customer._id, 'leadStatus', e.target.value)}
                                            className="text-sm border border-gray-300 rounded-lg bg-gray-50 p-1.5 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        >
                                            <option value="New">New</option>
                                            <option value="Contacted">Contacted</option>
                                            <option value="Interested">Interested</option>
                                            <option value="Not Interested">Not Interested</option>
                                            <option value="Converted">Converted</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap w-64">
                                        <input 
                                            type="text" 
                                            defaultValue={customer.notes || ''}
                                            onBlur={(e) => {
                                                if (e.target.value !== customer.notes) {
                                                    handleUpdate(customer._id, 'notes', e.target.value);
                                                }
                                            }}
                                            placeholder="Click to add note..."
                                            className="text-sm border border-gray-300 rounded-lg bg-gray-50 p-1.5 w-full focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-gray-500 font-medium">No customers found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Customer;