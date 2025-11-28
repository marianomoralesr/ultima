import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Eye,
  ShoppingCart,
  CreditCard,
  FileText,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Calendar,
  Facebook,
  BarChart3,
  Users,
  DollarSign,
} from 'lucide-react';
import { formatPrice } from '../utils/formatters';

// =================================================================================
// TIPOS
// =================================================================================

interface CatalogueMetrics {
  total_views: number;
  total_searches: number;
  total_add_to_cart: number;
  total_checkouts: number;
  total_leads: number;
  unique_vehicles_viewed: number;
  conversion_rate: number;
}

interface TopVehicle {
  vehicle_id: string;
  vehicle_title: string;
  vehicle_price: number;
  view_count: number;
  add_to_cart_count: number;
  checkout_count: number;
  lead_count: number;
  conversion_rate: number;
}

interface InteractionTypeMetrics {
  interaction_type: string;
  count: number;
}

interface TimeSeriesMetrics {
  date: string;
  views: number;
  interactions: number;
  leads: number;
}

// =================================================================================
// COMPONENTE PRINCIPAL
// =================================================================================

const FacebookCatalogueDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<CatalogueMetrics | null>(null);
  const [topVehicles, setTopVehicles] = useState<TopVehicle[]>([]);
  const [interactionMetrics, setInteractionMetrics] = useState<InteractionTypeMetrics[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Calcular fechas de inicio y fin
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  const loadData = async () => {
    setLoading(true);

    try {
      const { startDate, endDate } = getDateRange();

      // Cargar métricas generales
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_catalogue_metrics', {
          start_date: startDate,
          end_date: endDate,
        });

      if (metricsError) throw metricsError;
      if (metricsData && metricsData.length > 0) {
        setMetrics(metricsData[0]);
      }

      // Cargar top vehículos
      const { data: topVehiclesData, error: topVehiclesError } = await supabase
        .rpc('get_top_performing_vehicles', {
          start_date: startDate,
          end_date: endDate,
          limit_count: 10,
        });

      if (topVehiclesError) throw topVehiclesError;
      setTopVehicles(topVehiclesData || []);

      // Cargar métricas de interacción
      const { data: interactionData, error: interactionError } = await supabase
        .from('facebook_catalogue_events')
        .select('interaction_type')
        .eq('event_type', 'AddToCart')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .not('interaction_type', 'is', null);

      if (interactionError) throw interactionError;

      // Agrupar por tipo de interacción
      const interactionCounts = (interactionData || []).reduce((acc, row) => {
        const type = row.interaction_type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setInteractionMetrics(
        Object.entries(interactionCounts).map(([type, count]) => ({
          interaction_type: type,
          count,
        }))
      );

      // Cargar datos de serie temporal (últimos 7-30 días)
      const { data: timeSeriesRaw, error: timeSeriesError } = await supabase
        .from('facebook_catalogue_events')
        .select('event_type, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (timeSeriesError) throw timeSeriesError;

      // Agrupar por día
      const dailyMetrics = (timeSeriesRaw || []).reduce((acc, row) => {
        const date = new Date(row.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, views: 0, interactions: 0, leads: 0 };
        }

        if (row.event_type === 'ViewContent') acc[date].views++;
        else if (row.event_type === 'AddToCart') acc[date].interactions++;
        else if (row.event_type === 'Lead') acc[date].leads++;

        return acc;
      }, {} as Record<string, TimeSeriesMetrics>);

      setTimeSeriesData(Object.values(dailyMetrics));

      console.log('[FB Catalogue Dashboard] ✅ Datos cargados:', {
        metrics: metricsData,
        topVehicles: topVehiclesData,
        interactions: interactionCounts,
      });
    } catch (error) {
      console.error('[FB Catalogue Dashboard] ❌ Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const exportData = () => {
    const data = {
      metrics,
      topVehicles,
      interactionMetrics,
      timeSeriesData,
      exportedAt: new Date().toISOString(),
      dateRange,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facebook-catalogue-metrics-${dateRange}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Facebook className="w-8 h-8 text-blue-600" />
            Catálogo de Facebook
          </h1>
          <p className="text-muted-foreground mt-1">
            Rendimiento de eventos y conversiones del catálogo
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Vistas de Vehículos"
          value={metrics?.total_views || 0}
          icon={Eye}
          iconColor="text-blue-600"
          bgColor="bg-blue-100"
        />
        <MetricCard
          title="Interacciones"
          value={metrics?.total_add_to_cart || 0}
          icon={ShoppingCart}
          iconColor="text-green-600"
          bgColor="bg-green-100"
          subtitle={`${metrics?.total_searches || 0} búsquedas`}
        />
        <MetricCard
          title="Solicitudes Iniciadas"
          value={metrics?.total_checkouts || 0}
          icon={CreditCard}
          iconColor="text-purple-600"
          bgColor="bg-purple-100"
        />
        <MetricCard
          title="Leads Generados"
          value={metrics?.total_leads || 0}
          icon={FileText}
          iconColor="text-orange-600"
          bgColor="bg-orange-100"
          subtitle={`${metrics?.conversion_rate?.toFixed(2) || 0}% tasa de conversión`}
        />
      </div>

      {/* Métricas de Interacción */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Tipos de Interacción
          </CardTitle>
          <CardDescription>
            Desglose de cómo los usuarios interactúan con los vehículos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {interactionMetrics.map((metric) => (
              <div key={metric.interaction_type} className="flex flex-col p-4 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground capitalize">
                  {metric.interaction_type}
                </span>
                <span className="text-2xl font-bold mt-1">{metric.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Vehículos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Vehículos por Rendimiento
          </CardTitle>
          <CardDescription>
            Vehículos con mejor engagement y conversión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehículo</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Vistas</TableHead>
                <TableHead className="text-right">Interacciones</TableHead>
                <TableHead className="text-right">Solicitudes</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Conversión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay datos disponibles para el período seleccionado
                  </TableCell>
                </TableRow>
              ) : (
                topVehicles.map((vehicle) => (
                  <TableRow key={vehicle.vehicle_id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {vehicle.vehicle_title}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(vehicle.vehicle_price)}
                    </TableCell>
                    <TableCell className="text-right">{vehicle.view_count}</TableCell>
                    <TableCell className="text-right">
                      {vehicle.add_to_cart_count}
                    </TableCell>
                    <TableCell className="text-right">
                      {vehicle.checkout_count}
                    </TableCell>
                    <TableCell className="text-right">{vehicle.lead_count}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          vehicle.conversion_rate >= 5
                            ? 'default'
                            : vehicle.conversion_rate >= 2
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {vehicle.conversion_rate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Estadísticas Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Engagement de Catálogo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Vehículos únicos vistos
              </span>
              <span className="text-2xl font-bold">
                {metrics?.unique_vehicles_viewed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Promedio de vistas por vehículo
              </span>
              <span className="text-2xl font-bold">
                {metrics?.unique_vehicles_viewed
                  ? (
                      (metrics?.total_views || 0) /
                      metrics.unique_vehicles_viewed
                    ).toFixed(1)
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Tasa de interacción
              </span>
              <span className="text-2xl font-bold">
                {metrics?.total_views
                  ? (
                      ((metrics?.total_add_to_cart || 0) /
                        metrics.total_views) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Valor de Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Valor promedio de vehículos con leads
              </span>
              <span className="text-2xl font-bold">
                {topVehicles.length > 0
                  ? formatPrice(
                      topVehicles
                        .filter((v) => v.lead_count > 0)
                        .reduce((sum, v) => sum + v.vehicle_price, 0) /
                        topVehicles.filter((v) => v.lead_count > 0).length || 1
                    )
                  : '$0'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total de leads generados
              </span>
              <span className="text-2xl font-bold">
                {metrics?.total_leads || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tasa de conversión</span>
              <Badge variant="default" className="text-base px-3 py-1">
                {metrics?.conversion_rate?.toFixed(2) || 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// =================================================================================
// COMPONENTES AUXILIARES
// =================================================================================

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor?: string;
  bgColor?: string;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  bgColor = 'bg-blue-100',
  subtitle,
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${bgColor}`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FacebookCatalogueDashboard;
