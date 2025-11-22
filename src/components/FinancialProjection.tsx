import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import { calculateMonthlyPayment, calculateTotalPaid } from '../utils/financeCalculator';

const FinancialProjection: React.FC = () => {
  const [vehiclePrice, setVehiclePrice] = useState(300000);
  const [downPayment, setDownPayment] = useState(60000);
  const [term, setTerm] = useState(60);
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  const loanAmount = vehiclePrice - downPayment;
  const minDownPayment = vehiclePrice * 0.15;

  useEffect(() => {
    // Ensure down payment is always at least 15% of the price
    if (downPayment < minDownPayment) {
      setDownPayment(minDownPayment);
    }
  }, [vehiclePrice, downPayment, minDownPayment]);

  useEffect(() => {
    // Use the financeCalculator with the correct logic (17% annual rate, 5% insurance)
    const payment = calculateMonthlyPayment(vehiclePrice, downPayment, term, 17.0, true);
    setMonthlyPayment(payment);
  }, [vehiclePrice, downPayment, term]);

  const totalPayment = monthlyPayment > 0 ? (monthlyPayment * term) + downPayment : vehiclePrice;
  const loanTerms = [12, 24, 36, 48, 60];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
        <Calculator className="w-5 h-5 mr-3 text-primary-600" />
        Proyección del Financiamiento 
      </h3>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <label htmlFor="vehiclePrice" className="text-sm font-medium text-gray-700">Precio del auto</label>
            <span className="font-semibold text-gray-900">{formatPrice(vehiclePrice)}</span>
          </div>
          <input
            id="vehiclePrice"
            type="range"
            min="150000"
            max="1100000"
            step="10000"
            value={vehiclePrice}
            onChange={(e) => setVehiclePrice(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
        </div>

        <div>
           <div className="flex justify-between items-baseline mb-2">
            <label htmlFor="downPayment" className="text-sm font-medium text-gray-700">Enganche (mín. 15%)</label>
            <span className="font-semibold text-gray-900">{formatPrice(downPayment)}</span>
          </div>
          <input
            id="downPayment"
            type="range"
            min={minDownPayment}
            max={vehiclePrice}
            step="5000"
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona el plazo (meses):</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {loanTerms.map(t => (
              <button
                key={t}
                onClick={() => setTerm(t)}
                className={`px-2 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  term === t ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t}m
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-200 space-y-4">
            <div className="text-center bg-green-50 text-green-800 p-4 rounded-lg border border-green-200">
                <p className="text-sm">Banco Recomendado: pendiente</p>
                <p className="text-3xl font-bold">{formatPrice(monthlyPayment)}</p>
                <p className="text-sm font-medium">por mes</p>
                <p className="text-xs mt-2">Tasa: 12.99%* puede variar</p>
            </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-6 text-center">
        *Tasa de interés puede variar según el banco. Incluye seguro con valor del 5% del auto (amortizado mensualmente).
      </p>
    </div>
  );
};

export default FinancialProjection;