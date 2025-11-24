import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, TrendingUp, BookOpen, Settings, Briefcase,
  BarChart3, FileText, Database, LayoutDashboard, Activity, Home, Camera, ClipboardCheck
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface EventStat {
  event_name: string;
  event_count: number;
  unique_users: number;
}

const MarketingHubPage: React.FC = () => {
  const [eventStats, setEventStats] = useState<EventStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventStats();
  }, []);

  const loadEventStats = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_events')
        .select('event_name, session_id, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggregate event data
      const eventMap = new Map<string, { count: number; sessions: Set<string> }>();

      data?.forEach(event => {
        if (!eventMap.has(event.event_name)) {
          eventMap.set(event.event_name, { count: 0, sessions: new Set() });
        }
        const stat = eventMap.get(event.event_name)!;
        stat.count++;
        if (event.session_id) stat.sessions.add(event.session_id);
      });

      const stats: EventStat[] = Array.from(eventMap.entries()).map(([name, data]) => ({
        event_name: name,
        event_count: data.count,
        unique_users: data.sessions.size,
      }));

      stats.sort((a, b) => b.event_count - a.event_count);
      setEventStats(stats);
    } catch (error) {
      console.error('Error loading event stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const mainTools = [
    {
      title: 'CRM - Gestión de Leads',
      description: 'Seguimiento de clientes potenciales y pipeline de ventas',
      icon: Users,
      link: '/escritorio/admin/crm',
    },
    {
      title: 'Gestión de Asesores',
      description: 'Administración de usuarios y equipo de ventas',
      icon: TrendingUp,
      link: '/escritorio/admin/usuarios',
    },
    {
      title: 'Intel - Base de Conocimiento',
      description: 'Documentación de procesos, guías y procedimientos operativos',
      icon: BookOpen,
      link: '/intel',
    },
    {
      title: 'Business Analytics',
      description: 'Métricas de rendimiento, KPIs y análisis de negocio',
      icon: BarChart3,
      link: '/escritorio/admin/business-analytics',
    },
    {
      title: 'Configuración de Tracking',
      description: 'Google Tag Manager, Meta Pixel y eventos de conversión',
      icon: Settings,
      link: '/escritorio/admin/marketing-config',
    },
    {
      title: 'Reclutamiento y Vacantes',
      description: 'Gestión de ofertas de empleo y candidatos',
      icon: Briefcase,
      link: '/escritorio/admin/vacantes',
    },
    {
      title: 'Analytics de Solicitudes',
      description: 'Análisis de aplicaciones de financiamiento y conversiones',
      icon: FileText,
      link: '/escritorio/admin/solicitudes',
    },
    {
      title: 'Changelog y Roadmap',
      description: 'Historial de cambios y plan de desarrollo de la plataforma',
      icon: Activity,
      link: '/changelog',
    },
    {
      title: 'Marketing Analytics',
      description: 'Eventos de marketing, embudos y métricas de campañas',
      icon: Database,
      link: '/escritorio/admin/marketing-analytics',
    },
    {
      title: 'Editor de Página de Inicio',
      description: 'Edita imágenes y contenido de la homepage sin redeployar',
      icon: Home,
      link: '/escritorio/marketing/homepage-editor',
    },
    {
      title: 'Car Studio - Procesamiento de Imágenes',
      description: 'API de Car Studio para procesar y generar imágenes de vehículos',
      icon: Camera,
      link: '/escritorio/car-studio',
    },
    {
      title: 'Inspecciones de Vehículos',
      description: 'Gestión de reportes de inspección de 150 puntos',
      icon: ClipboardCheck,
      link: '/escritorio/admin/inspecciones',
    },
    {
      title: 'Dashboard Principal',
      description: 'Vista general con métricas clave y accesos rápidos',
      icon: LayoutDashboard,
      link: '/escritorio/dashboard',
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Panel Administrativo</h2>
        <p className="text-sm text-muted-foreground">
          Centro de herramientas de marketing, ventas y análisis
        </p>
      </div>

      {/* Main Tools Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mainTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.title} to={tool.link}>
              <Card className="cursor-pointer hover:bg-accent transition-colors">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="p-2 rounded-lg bg-muted mr-4">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{tool.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Events Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Eventos GTM (Últimos 7 días)</CardTitle>
              <CardDescription>
                Eventos enviados a Google Tag Manager incluyendo ViewContent y ViewPage
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={loadEventStats}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {eventStats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No hay eventos registrados en los últimos 7 días</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eventStats.map((stat) => (
                <div
                  key={stat.event_name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium">{stat.event_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.unique_users} usuario{stat.unique_users !== 1 ? 's' : ''} único{stat.unique_users !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge variant="secondary">{stat.event_count} eventos</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingHubPage;
