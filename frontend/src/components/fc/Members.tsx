import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import Navigation from '../layouts/Navigation';
import { useToast } from '../../context/ToastContext';

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  current_week_status: 'paid' | 'unpaid' | 'late';
  total_contributed: number;
  total_balance: number;
  active_loan_amount: number;
}

const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Member>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'late'>('all');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch current user to get group ID
      const userResponse = await fetch(getApiUrl('/api/auth/profile'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to fetch user profile (${userResponse.status})`;
        throw new Error(errorMessage);
      }

      const userData = await userResponse.json();
      const groupId = userData.groupId;

      // Make sure we have a valid group ID
      if (!groupId) {
        throw new Error('No group assigned. Please contact your administrator.');
      }

      // Fetch group members
      const membersResponse = await fetch(getApiUrl(`/api/groups/${groupId}/members`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!membersResponse.ok) {
        const errorData = await membersResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to fetch group members (${membersResponse.status})`;
        throw new Error(errorMessage);
      }

      const membersData = await membersResponse.json();
      
      if (!membersData.members || !Array.isArray(membersData.members)) {
        throw new Error('Invalid response format: members data is missing or not an array');
      }
      
      if (membersData.members.length === 0) {
        showToast('No members found in this group. The group may be empty.', 'info');
      }
      
      // Validate member data structure to avoid runtime errors
      membersData.members.forEach((member: any, index: number) => {
        if (!member.id || !member.name || member.email === undefined) {
          console.warn(`Member at index ${index} has invalid data structure:`, member);
        }
      });
      
      setMembers(membersData.members);
      setFilteredMembers(membersData.members);
      showToast('Member data refreshed successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching members:', errorMessage);
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [navigate, showToast]);

  useEffect(() => {
    // Apply filters and sorting
    let result = [...members];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(member => member.current_week_status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        member =>
          member.name.toLowerCase().includes(lowerSearchTerm) ||
          member.email.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredMembers(result);
  }, [members, searchTerm, sortField, sortDirection, statusFilter]);

  const handleSort = (field: keyof Member) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewMemberDetails = (memberId: number) => {
    navigate(`/members/${memberId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'late':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white">
      <Navigation userRole="finance_coordinator" onLogout={() => {}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Group Members</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Manage and view the status of all members in your group
            </p>
          </div>
          <button
            onClick={fetchMembers}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors duration-200 disabled:opacity-50"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        <div className="mb-6 bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="w-full md:w-64">
              <label htmlFor="search" className="sr-only">
                Search members
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg 
                    className="h-5 w-5 text-neutral-400" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md leading-5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Search by name or email"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full md:w-auto">
              <label htmlFor="statusFilter" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Filter by status:
              </label>
              <select
                id="statusFilter"
                name="statusFilter"
                className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border border-neutral-300 dark:border-neutral-600 rounded-md leading-5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="late">Late</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-neutral-600 dark:text-neutral-400">Loading group members data...</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">This may take a moment to retrieve all member information</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-4 rounded-md">
              <p className="font-semibold mb-1">Error loading members:</p>
              <p>{error}</p>
              <button 
                onClick={fetchMembers} 
                className="mt-2 px-3 py-1 text-sm bg-red-100 dark:bg-red-800/20 text-red-800 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-700/20 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                  <thead>
                    <tr>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          <span>Name</span>
                          {sortField === 'name' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('current_week_status')}
                      >
                        <div className="flex items-center">
                          <span>Status</span>
                          {sortField === 'current_week_status' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('total_contributed')}
                      >
                        <div className="flex items-center">
                          <span>Total Contributed</span>
                          {sortField === 'total_contributed' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('total_balance')}
                      >
                        <div className="flex items-center">
                          <span>Balance Due</span>
                          {sortField === 'total_balance' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('active_loan_amount')}
                      >
                        <div className="flex items-center">
                          <span>Active Loan</span>
                          {sortField === 'active_loan_amount' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member) => (
                        <tr 
                          key={member.id} 
                          className="hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-neutral-900 dark:text-white">
                                  {member.name}
                                </div>
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {member.email}
                                </div>
                                {member.role === 'finance_coordinator' && (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                    Finance Coordinator
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(member.current_week_status)}`}>
                              {member.current_week_status.charAt(0).toUpperCase() + member.current_week_status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white text-left">
                            ₱{member.total_contributed.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white text-left">
                            ₱{member.total_balance.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white text-left">
                            ₱{member.active_loan_amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <button
                              onClick={() => handleViewMemberDetails(member.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded hover:bg-primary-100 dark:hover:bg-primary-800/30 transition-colors duration-200"
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-4 w-4 mr-1" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-neutral-500 dark:text-neutral-400">
                          No members found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-neutral-500 dark:text-neutral-400 text-sm">
                Showing {filteredMembers.length} of {members.length} members
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Members; 