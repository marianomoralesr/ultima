import React from 'react';
import { CreditCard } from 'lucide-react';

interface BankingProfileSummaryProps {
    applications: any[];
}

const BankingProfileSummary: React.FC<BankingProfileSummaryProps> = ({ applications }) => {
    // Get banking profile data from the most recent application
    const bankingData = applications.length > 0 ? applications[0].application_data || {} : {};

    const hasBankingInfo = bankingData.bank_name || bankingData.recommended_bank ||
                          bankingData.has_credit_card || bankingData.has_savings_account;

    if (!hasBankingInfo) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Perfilación Bancaria
            </h2>
            <div className="space-y-3">
                {bankingData.recommended_bank && (
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Banco Recomendado</p>
                        <p className="text-sm font-bold text-primary-600">{bankingData.recommended_bank}</p>
                    </div>
                )}
                {bankingData.bank_name && (
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Banco Principal</p>
                        <p className="text-sm font-semibold text-gray-800">{bankingData.bank_name}</p>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    {bankingData.has_savings_account !== undefined && (
                        <div>
                            <p className="text-xs text-gray-500">Cuenta de Ahorro</p>
                            <p className="text-sm font-semibold text-gray-800">{bankingData.has_savings_account ? 'Sí' : 'No'}</p>
                        </div>
                    )}
                    {bankingData.has_credit_card !== undefined && (
                        <div>
                            <p className="text-xs text-gray-500">Tarjeta de Crédito</p>
                            <p className="text-sm font-semibold text-gray-800">{bankingData.has_credit_card ? 'Sí' : 'No'}</p>
                        </div>
                    )}
                </div>
                {bankingData.credit_card_bank && (
                    <div>
                        <p className="text-xs text-gray-500">Institución de Crédito</p>
                        <p className="text-sm font-semibold text-gray-800">{bankingData.credit_card_bank}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BankingProfileSummary;
