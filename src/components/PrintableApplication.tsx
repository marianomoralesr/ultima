import React from 'react';

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="text-sm font-bold uppercase tracking-wider text-white bg-trefa-blue p-2 rounded-t-md mt-3">{title}</h3>
);

const DataRow: React.FC<{ label: string, value: any }> = ({ label, value }) => (
    <div className="flex justify-between py-1.5 px-3 border-b border-x border-gray-200">
        <p className="text-xs text-gray-600">{label}:</p>
        <p className="text-xs font-semibold text-gray-800 text-right">{value || 'N/A'}</p>
    </div>
);

const PrintableApplication: React.FC<{ application: any }> = ({ application }) => {
    const profile = application.personal_info_snapshot || {};
    const appData = application.application_data || {};
    const carInfo = application.car_info || {};

    // Format currency
    const formatCurrency = (amount: any) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    return (
        <div className="p-4 sm:p-6 bg-white printable-offer border rounded-xl shadow-sm">
            <header className="flex justify-between items-start pb-3 border-b-2 border-primary-500">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Solicitud de Financiamiento</h1>
                    <p className="text-xs text-gray-500 font-mono">ID: {application.id?.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500">Fecha: {new Date(application.created_at).toLocaleDateString('es-MX')}</p>
                    <p className="text-xs font-semibold text-primary-600 mt-1">Estado: {application.status || 'Enviada'}</p>
                </div>
                <img src="/images/trefalogo.png" alt="TREFA Logo" className="h-10" />
            </header>

            <main className="mt-4 space-y-3">
                {/* Vehicle Information */}
                <SectionHeader title="Vehículo de Interés" />
                <div className="rounded-b-md overflow-hidden">
                    <DataRow label="Auto" value={carInfo._vehicleTitle} />
                    <DataRow label="Orden de Compra" value={carInfo._ordenCompra} />
                </div>

                {/* Recommended Bank */}
                {appData.recommended_bank && (
                    <>
                        <SectionHeader title="Banco Recomendado" />
                        <div className="rounded-b-md overflow-hidden">
                            <DataRow label="Institución Financiera" value={appData.recommended_bank} />
                        </div>
                    </>
                )}

                {/* Personal Information */}
                <SectionHeader title="Información Personal Completa" />
                <div className="grid grid-cols-1 md:grid-cols-2 rounded-b-md overflow-hidden">
                    <DataRow label="Nombre(s)" value={profile.first_name} />
                    <DataRow label="Apellido Paterno" value={profile.last_name} />
                    <DataRow label="Apellido Materno" value={profile.mother_last_name} />
                    <DataRow label="Email" value={profile.email} />
                    <DataRow label="Teléfono" value={profile.phone} />
                    <DataRow label="RFC" value={profile.rfc} />
                    <DataRow label="CURP" value={profile.curp} />
                    <DataRow label="Fecha de Nacimiento" value={profile.birth_date} />
                    <DataRow label="Lugar de Nacimiento" value={profile.birth_place} />
                    <DataRow label="Nacionalidad" value={profile.nationality} />
                    <DataRow label="Estado Civil" value={profile.civil_status} />
                    <DataRow label="Género" value={profile.gender} />
                    <DataRow label="Nivel de Estudios" value={profile.education_level} />
                    <DataRow label="Número de Dependientes" value={profile.dependents} />
                </div>

                {/* Current Address */}
                <SectionHeader title="Dirección Actual" />
                <div className="grid grid-cols-1 md:grid-cols-2 rounded-b-md overflow-hidden">
                    <DataRow label="Calle y Número" value={appData.current_address} />
                    <DataRow label="Colonia" value={appData.current_neighborhood} />
                    <DataRow label="Ciudad" value={appData.current_city} />
                    <DataRow label="Estado" value={appData.current_state} />
                    <DataRow label="Código Postal" value={appData.current_zip_code} />
                    <DataRow label="Tipo de Vivienda" value={appData.housing_type} />
                    <DataRow label="Tiempo en Domicilio" value={appData.time_at_address} />
                    <DataRow label="Renta Mensual" value={formatCurrency(appData.monthly_rent)} />
                </div>

                {/* Previous Address (if different) */}
                {appData.previous_address && (
                    <>
                        <SectionHeader title="Dirección Anterior" />
                        <div className="grid grid-cols-1 md:grid-cols-2 rounded-b-md overflow-hidden">
                            <DataRow label="Calle y Número" value={appData.previous_address} />
                            <DataRow label="Colonia" value={appData.previous_neighborhood} />
                            <DataRow label="Ciudad" value={appData.previous_city} />
                            <DataRow label="Estado" value={appData.previous_state} />
                            <DataRow label="Código Postal" value={appData.previous_zip_code} />
                        </div>
                    </>
                )}

                {/* Employment Information */}
                <SectionHeader title="Información Laboral" />
                <div className="grid grid-cols-1 md:grid-cols-2 rounded-b-md overflow-hidden">
                    <DataRow label="Clasificación Fiscal" value={appData.fiscal_classification} />
                    <DataRow label="Empresa" value={appData.company_name} />
                    <DataRow label="Giro de la Empresa" value={appData.company_industry} />
                    <DataRow label="Puesto" value={appData.job_title} />
                    <DataRow label="Antigüedad en el Puesto" value={appData.job_seniority} />
                    <DataRow label="Dirección de la Empresa" value={appData.company_address} />
                    <DataRow label="Teléfono (Empresa)" value={appData.company_phone} />
                    <DataRow label="Extensión" value={appData.company_extension} />
                    <DataRow label="Ingreso Mensual Neto" value={formatCurrency(appData.net_monthly_income)} />
                    <DataRow label="Otros Ingresos Mensuales" value={formatCurrency(appData.other_monthly_income)} />
                    <DataRow label="Fuente de Otros Ingresos" value={appData.other_income_source} />
                </div>

                {/* References */}
                <SectionHeader title="Referencias Personales" />
                <div className="grid grid-cols-1 md:grid-cols-2 rounded-b-md overflow-hidden">
                    <DataRow label="Referencia Familiar - Nombre" value={appData.family_reference_name} />
                    <DataRow label="Referencia Familiar - Teléfono" value={appData.family_reference_phone} />
                    <DataRow label="Referencia Familiar - Parentesco" value={appData.family_reference_relationship} />
                    <DataRow label="Referencia Personal - Nombre" value={appData.friend_reference_name} />
                    <DataRow label="Referencia Personal - Teléfono" value={appData.friend_reference_phone} />
                    <DataRow label="Referencia Personal - Relación" value={appData.friend_reference_relationship} />
                </div>

                {/* Additional Information */}
                {appData.additional_notes && (
                    <>
                        <SectionHeader title="Información Adicional" />
                        <div className="rounded-b-md overflow-hidden">
                            <div className="py-2 px-3 border-b border-x border-gray-200">
                                <p className="text-xs text-gray-700 whitespace-pre-wrap">{appData.additional_notes}</p>
                            </div>
                        </div>
                    </>
                )}
            </main>

            <footer className="mt-6 pt-3 border-t text-center text-xs text-gray-500">
                <p className="font-bold text-gray-600">Este documento es una copia de la solicitud enviada y no constituye un contrato ni un documento oficial. La aprobación está sujeta a la validación de la institución financiera.</p>
                <p className="mt-2">TREFA AUTOS | {new Date().getFullYear()}</p>
            </footer>
        </div>
    );
};

export default PrintableApplication;