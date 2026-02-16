'use client';

import { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft } from "react-icons/md";
import { useLanguage } from "@/src/context/LanguageContext";

interface Transaction {
  id: number;
  amount: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  status: 'pending' | 'completed' | 'failed';
  description: string;
  created_at: string;
}

interface TransactionsResponse {
  status: boolean;
  message: string;
  data: Transaction[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export default function TransactionsPage() {
  const { t, language } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token from localStorage or cookie
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/wallet/transactions?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language === 'ar' ? 'ar-EG' : 'en-US',
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: TransactionsResponse = await response.json();
      
      if (data.status) {
        setTransactions(data.data);
      } else {
        setError(data.message || t('transactions.error.fetch'));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(t('transactions.error.fetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage, language]); // Re-fetch when language changes

  // Helper function to get status text
  const getStatusText = (status: string) => {
    switch(status) {
      case 'completed':
        return t('transactions.status.completed');
      case 'pending':
        return t('transactions.status.pending');
      case 'failed':
        return t('transactions.status.failed');
      default:
        return status;
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to format date based on language
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-4">
        <button 
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-pro transition-colors"
        >
          <MdKeyboardArrowLeft size={20} />
          <span>{t('common.back')}</span>
        </button>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-slate-900">
        {t('transactions.title')}
      </h1>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-pro border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600">{t('transactions.loading')}</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={() => fetchTransactions(currentPage)}
            className="text-pro hover:text-pro-max font-semibold"
          >
            {t('common.try_again')}
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 text-lg">{t('transactions.no_transactions')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-start text-sm font-semibold text-slate-600">
                    {t('transactions.table.description')}
                  </th>
                  <th className="px-6 py-4 text-start text-sm font-semibold text-slate-600">
                    {t('transactions.table.amount')}
                  </th>
                  <th className="px-6 py-4 text-start text-sm font-semibold text-slate-600">
                    {t('transactions.table.status')}
                  </th>
                  <th className="px-6 py-4 text-start text-sm font-semibold text-slate-600">
                    {t('transactions.table.date')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {transaction.description}
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold whitespace-nowrap ${
                      transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}
                      {transaction.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {formatDate(transaction.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium text-slate-900 flex-1">
                    {transaction.description}
                  </p>
                  <p className={`text-sm font-bold whitespace-nowrap mr-2 ${
                    transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'deposit' ? '+' : '-'}
                    {transaction.amount}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                    {getStatusText(transaction.status)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDate(transaction.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}