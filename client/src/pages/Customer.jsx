import { useState, useEffect } from "react";
import api from "../api/axios";

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
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No customers found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Customer;