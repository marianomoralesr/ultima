import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Tag, FileText, Users, Layout, Image } from 'lucide-react';

const MarketingHubPage: React.FC = () => {
  const marketingTools = [
    {
      title: 'Promociones',
      description: 'Gestionar promociones y ofertas especiales',
      icon: Tag,
      link: '/promociones',
      color: 'bg-blue-500',
    },
    {
      title: 'Categorías de Marketing',
      description: 'Páginas de categorías por marca y carrocería',
      icon: TrendingUp,
      link: '/marcas',
      color: 'bg-purple-500',
    },
    {
      title: 'CRM Dashboard',
      description: 'Gestionar y dar seguimiento a leads',
      icon: Users,
      link: '/escritorio/admin/crm',
      color: 'bg-green-500',
    },
    {
      title: 'Car Studio',
      description: 'Editor de imágenes de vehículos',
      icon: Image,
      link: '/escritorio/car-studio',
      color: 'bg-pink-500',
    },
    {
      title: 'Configuración Airtable',
      description: 'Configurar integraciones con Airtable',
      icon: FileText,
      link: '/escritorio/admin/airtable',
      color: 'bg-orange-500',
    },
    {
      title: 'Generador de Landing Pages',
      description: 'Crear y publicar landing pages personalizadas',
      icon: Layout,
      link: '/escritorio/marketing/constructor',
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Marketing Hub</h1>
        <p className="mt-2 text-gray-600">
          Centro de herramientas de marketing y gestión de contenido
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {marketingTools.map((tool) => {
          const Icon = tool.icon;
          const isDisabled = tool.disabled || false;

          const CardContent = (
            <>
              <div className={`${tool.color} p-4 rounded-lg inline-flex mb-4`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {tool.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {tool.description}
              </p>
              {!isDisabled && (
                <div className="mt-4 text-primary-600 font-medium flex items-center">
                  Abrir
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              )}
              {isDisabled && (
                <div className="mt-4 text-gray-400 font-medium">
                  Próximamente
                </div>
              )}
            </>
          );

          return isDisabled ? (
            <div
              key={tool.title}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 opacity-50 cursor-not-allowed"
            >
              {CardContent}
            </div>
          ) : (
            <Link
              key={tool.title}
              to={tool.link}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all duration-200 transform hover:-translate-y-1"
            >
              {CardContent}
            </Link>
          );
        })}
      </div>

      <div className="mt-12 bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-8 border border-primary-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Herramientas Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Kit TREFA</h3>
            <p className="text-sm text-gray-600 mb-3">
              Documentos y materiales de marketing
            </p>
            <Link
              to="/kit-trefa"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              Ver materiales →
            </Link>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Vacantes</h3>
            <p className="text-sm text-gray-600 mb-3">
              Gestionar ofertas de empleo y candidatos
            </p>
            <Link
              to="/escritorio/admin/vacantes"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              Gestionar vacantes →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingHubPage;
