import React, { useState, useEffect } from 'react';
import { BankService } from '../services/BankService';
import { BANKS } from '../types/bank';
import type { BankRepresentativeProfile } from '../types/bank';
import { toast } from 'sonner';

const AdminBankManagementPage: React.FC = () => {
  const [bankReps, setBankReps] = useState<BankRepresentativeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBank, setFilterBank] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    loadBankReps();
  }, []);

  const loadBankReps = async () => {
    setLoading(true);
    setErrorDetails(null);
    try {
      console.log('Loading bank representatives...');
      const data = await BankService.getAllBankReps();
      console.log('Bank reps loaded:', data.length, 'representatives');
      console.log('Bank reps data:', data);
      setBankReps(data);

      if (data.length === 0) {
        setErrorDetails('No se encontraron representantes bancarios en la base de datos. Verifica que la tabla bank_representative_profiles existe y tiene datos.');
      }
    } catch (err: any) {
      console.error('Error loading bank reps:', err);
      const errorMsg = err.message || 'Error al cargar representantes bancarios';
      setErrorDetails(`Error: ${errorMsg}. Detalles: ${JSON.stringify(err)}`);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bankRepId: string, approved: boolean) => {
    try {
      await BankService.approveBankRep(bankRepId, approved);
      toast.success(approved ? 'Representante aprobado' : 'Aprobación revocada');
      await loadBankReps();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar estado');
    }
  };

  const filteredBankReps = bankReps.filter((rep) => {
    const matchesBank = filterBank === 'all' || rep.bank_affiliation === filterBank;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'approved' && rep.is_approved) ||
      (filterStatus === 'pending' && !rep.is_approved) ||
      (filterStatus === 'inactive' && !rep.is_active);

    return matchesBank && matchesStatus;
  });

  const stats = {
    total: bankReps.length,
    approved: bankReps.filter((r) => r.is_approved).length,
    pending: bankReps.filter((r) => !r.is_approved).length,
    inactive: bankReps.filter((r) => !r.is_active).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Representantes Bancarios
        </h1>
        <p className="text-gray-600">
          Aprobar, rechazar y gestionar representantes de bancos
        </p>
      </div>

      {/* Error Details */}
      {errorDetails && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Problema al cargar datos</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errorDetails}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Aprobados</p>
          <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Pendientes</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Inactivos</p>
          <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por banco
            </label>
            <select
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los bancos</option>
              {Object.values(BANKS).map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="approved">Aprobados</option>
              <option value="pending">Pendientes de aprobación</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Representantes bancarios ({filteredBankReps.length})
          </h2>
        </div>

        {filteredBankReps.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <p className="text-gray-600 text-lg">No hay representantes bancarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Representante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banco
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último acceso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBankReps.map((rep) => (
                  <tr key={rep.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {rep.first_name} {rep.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{rep.email}</div>
                        {rep.phone && (
                          <div className="text-sm text-gray-500">{rep.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600">
                            {BANKS[rep.bank_affiliation]?.name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {BANKS[rep.bank_affiliation]?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            rep.is_approved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {rep.is_approved ? 'Aprobado' : 'Pendiente'}
                        </span>
                        {!rep.is_active && (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 ml-1">
                            Inactivo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rep.last_login_at
                        ? new Date(rep.last_login_at).toLocaleDateString('es-MX')
                        : 'Nunca'}
                      <div className="text-xs text-gray-400">
                        {rep.login_count} accesos
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(rep.created_at).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {rep.is_approved ? (
                        <button
                          onClick={() => handleApprove(rep.id, false)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Revocar aprobación
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApprove(rep.id, true)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Aprobar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBankManagementPage;
