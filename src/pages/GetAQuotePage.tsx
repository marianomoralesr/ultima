import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ValuationApp from '../Valuation/App';
import useSEO from '../hooks/useSEO';

const GetAQuotePage: React.FC = () => {
    useSEO({
    title: 'Vende tu Auto | Recibe una Oferta | TREFA',
    description: 'Obtén una oferta competitiva por tu auto. Proceso rápido, seguro y transparente. Vende tu auto a TREFA.',
    keywords: 'vender auto, oferta por mi auto, vender mi coche, trefa, valuación de auto'
  });

    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('search');

    return (
        <div className="w-full flex justify-center items-start py-8 sm:py-12">
             <ValuationApp initialSearchQuery={initialSearch} />
        </div>
    );
};

export default GetAQuotePage;
