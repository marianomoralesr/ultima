import { supabase } from '../../supabaseClient';

export interface VehicleInsight {
    id: string;
    titulo: string;
    ordenstatus: string;
    precio: number;
    applicationCount: number;
    activeApplications: number;
    thumbnail?: string;
}

export interface PriceRangeInsight {
    range: string;
    count: number;
    minPrice: number;
    maxPrice: number;
    avgApplications: number;
}

export interface LeadPersonaInsight {
    civilStatus: string;
    count: number;
    avgIncome: number;
    approvalRate: number;
}

export interface SoldVehicleHistory {
    id: string;
    titulo: string;
    precio: number;
    fechaVenta: Date;
    edadEnInventario: number; // days
    fechaIngreso: Date;
    thumbnail?: string;
}

export interface UnavailableVehicleApp {
    applicationId: string;
    vehicleTitle: string;
    applicantName: string;
    applicantEmail: string;
    createdAt: Date;
    status: string;
}

export interface BusinessMetrics {
    vehicleInsights: VehicleInsight[];
    priceRangeInsights: PriceRangeInsight[];
    leadPersonaInsights: LeadPersonaInsight[];
    soldVehicles: SoldVehicleHistory[];
    unavailableVehicleApplications: UnavailableVehicleApp[];

    // Summary metrics
    avgDaysInInventory: number;
    fastestSale: number;
    slowestSale: number;
    totalActiveApplications: number;
    conversionRateByPrice: { range: string; rate: number }[];
}

export class BusinessAnalyticsService {
    /**
     * Get vehicles with most active applications
     */
    static async getVehicleInsights(limit: number = 20): Promise<VehicleInsight[]> {
        try {
            // Get all applications grouped by vehicle
            const { data: applications, error: appError } = await supabase
                .from('financing_applications')
                .select('id, status, car_info')
                .neq('status', 'draft');

            if (appError) throw appError;

            // Group by vehicle
            const vehicleMap = new Map<string, { apps: any[]; activeApps: number }>();

            applications?.forEach(app => {
                const carInfo = app.car_info;
                if (!carInfo || !carInfo.id) return;

                const vehicleId = carInfo.id;
                if (!vehicleMap.has(vehicleId)) {
                    vehicleMap.set(vehicleId, { apps: [], activeApps: 0 });
                }

                const vehicleData = vehicleMap.get(vehicleId)!;
                vehicleData.apps.push(app);

                // Count active applications (not rejected or draft)
                if (!['rejected', 'draft', 'cancelled'].includes(app.status)) {
                    vehicleData.activeApps++;
                }
            });

            // Get vehicle details for top vehicles by application count
            const topVehicleIds = Array.from(vehicleMap.entries())
                .sort((a, b) => b[1].apps.length - a[1].apps.length)
                .slice(0, limit)
                .map(([id]) => id);

            if (topVehicleIds.length === 0) return [];

            const { data: vehicles, error: vehicleError } = await supabase
                .from('inventario_cache')
                .select('id, titulo, ordenstatus, precio, thumbnail')
                .in('id', topVehicleIds);

            if (vehicleError) throw vehicleError;

            return vehicles?.map(vehicle => {
                const stats = vehicleMap.get(vehicle.id);
                return {
                    id: vehicle.id,
                    titulo: vehicle.titulo || 'Sin título',
                    ordenstatus: vehicle.ordenstatus || 'Disponible',
                    precio: vehicle.precio || 0,
                    applicationCount: stats?.apps.length || 0,
                    activeApplications: stats?.activeApps || 0,
                    thumbnail: vehicle.thumbnail
                };
            }).sort((a, b) => b.applicationCount - a.applicationCount) || [];

        } catch (error) {
            console.error('Error fetching vehicle insights:', error);
            return [];
        }
    }

    /**
     * Get applications for vehicles that are no longer available
     */
    static async getUnavailableVehicleApplications(): Promise<UnavailableVehicleApp[]> {
        try {
            console.log('[BusinessAnalytics] Fetching unavailable vehicle applications...');
            const { data: applications, error } = await supabase
                .from('financing_applications')
                .select('id, status, created_at, car_info, first_name, last_name, email')
                .in('status', ['pending', 'submitted', 'processing'])
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                console.error('[BusinessAnalytics] Error fetching applications:', error);
                throw error;
            }

            console.log(`[BusinessAnalytics] Found ${applications?.length || 0} active applications`);
            const unavailableApps: UnavailableVehicleApp[] = [];

            // Get all unique vehicle IDs from applications
            const vehicleIds = Array.from(new Set(
                (applications || [])
                    .map(app => app.car_info?.id)
                    .filter(Boolean)
            ));

            console.log(`[BusinessAnalytics] Checking ${vehicleIds.length} unique vehicles`);

            if (vehicleIds.length === 0) {
                return [];
            }

            // Fetch all vehicles at once for better performance
            const { data: vehicles, error: vehicleError } = await supabase
                .from('inventario_cache')
                .select('id, ordenstatus')
                .in('id', vehicleIds);

            if (vehicleError) {
                console.error('[BusinessAnalytics] Error fetching vehicles:', vehicleError);
            }

            // Create a map of vehicle statuses
            const vehicleStatusMap = new Map(
                (vehicles || []).map(v => [v.id, v.ordenstatus])
            );

            // Check each application
            for (const app of applications || []) {
                const carInfo = app.car_info;
                if (!carInfo || !carInfo.id) continue;

                const vehicleStatus = vehicleStatusMap.get(carInfo.id);

                // Vehicle is unavailable if it's not in the map (deleted) or status is not "Disponible"
                if (!vehicleStatus || vehicleStatus !== 'Disponible') {
                    unavailableApps.push({
                        applicationId: app.id,
                        vehicleTitle: carInfo._vehicleTitle || carInfo.titulo || 'Sin título',
                        applicantName: `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Sin nombre',
                        applicantEmail: app.email || '',
                        createdAt: new Date(app.created_at),
                        status: app.status
                    });
                }
            }

            console.log(`[BusinessAnalytics] Found ${unavailableApps.length} unavailable vehicle applications`);
            return unavailableApps;
        } catch (error) {
            console.error('[BusinessAnalytics] Error in getUnavailableVehicleApplications:', error);
            return [];
        }
    }

    /**
     * Get price range insights
     */
    static async getPriceRangeInsights(): Promise<PriceRangeInsight[]> {
        try {
            const { data: vehicles, error: vehicleError } = await supabase
                .from('inventario_cache')
                .select('id, precio')
                .eq('ordenstatus', 'Disponible');

            if (vehicleError) throw vehicleError;

            const { data: applications, error: appError } = await supabase
                .from('financing_applications')
                .select('car_info')
                .neq('status', 'draft');

            if (appError) throw appError;

            // Define price ranges
            const ranges = [
                { label: '< $200k', min: 0, max: 200000 },
                { label: '$200k - $300k', min: 200000, max: 300000 },
                { label: '$300k - $400k', min: 300000, max: 400000 },
                { label: '$400k - $500k', min: 400000, max: 500000 },
                { label: '> $500k', min: 500000, max: Infinity }
            ];

            return ranges.map(range => {
                const vehiclesInRange = vehicles?.filter(v =>
                    v.precio >= range.min && v.precio < range.max
                ) || [];

                const appsInRange = applications?.filter(app => {
                    const price = app.car_info?.precio || 0;
                    return price >= range.min && price < range.max;
                }) || [];

                return {
                    range: range.label,
                    count: vehiclesInRange.length,
                    minPrice: range.min,
                    maxPrice: range.max === Infinity ? 0 : range.max,
                    avgApplications: vehiclesInRange.length > 0
                        ? appsInRange.length / vehiclesInRange.length
                        : 0
                };
            });
        } catch (error) {
            console.error('Error fetching price range insights:', error);
            return [];
        }
    }

    /**
     * Get lead persona insights
     */
    static async getLeadPersonaInsights(): Promise<LeadPersonaInsight[]> {
        try {
            const { data: applications, error } = await supabase
                .from('financing_applications')
                .select('civil_status, monthly_income, status')
                .neq('status', 'draft');

            if (error) throw error;

            const personaMap = new Map<string, { count: number; totalIncome: number; approved: number }>();

            applications?.forEach(app => {
                const status = app.civil_status || 'Sin especificar';
                if (!personaMap.has(status)) {
                    personaMap.set(status, { count: 0, totalIncome: 0, approved: 0 });
                }

                const persona = personaMap.get(status)!;
                persona.count++;
                persona.totalIncome += app.monthly_income || 0;
                if (app.status === 'approved' || app.status === 'completed') {
                    persona.approved++;
                }
            });

            return Array.from(personaMap.entries()).map(([status, data]) => ({
                civilStatus: status,
                count: data.count,
                avgIncome: data.count > 0 ? data.totalIncome / data.count : 0,
                approvalRate: data.count > 0 ? (data.approved / data.count) * 100 : 0
            })).sort((a, b) => b.count - a.count);
        } catch (error) {
            console.error('Error fetching lead persona insights:', error);
            return [];
        }
    }

    /**
     * Get sold vehicles history with edad en inventario
     */
    static async getSoldVehiclesHistory(limit: number = 50): Promise<SoldVehicleHistory[]> {
        try {
            const { data: vehicles, error } = await supabase
                .from('inventario_cache')
                .select('id, titulo, precio, ordenstatus, fecha_ingreso_inventario, updated_at, thumbnail')
                .or('ordenstatus.eq.Vendido,ordenstatus.eq.Comprado')
                .order('updated_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return vehicles?.map(vehicle => {
                const fechaIngreso = vehicle.fecha_ingreso_inventario
                    ? new Date(vehicle.fecha_ingreso_inventario)
                    : new Date(vehicle.updated_at);
                const fechaVenta = new Date(vehicle.updated_at);
                const edadEnInventario = Math.floor(
                    (fechaVenta.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24)
                );

                return {
                    id: vehicle.id,
                    titulo: vehicle.titulo || 'Sin título',
                    precio: vehicle.precio || 0,
                    fechaVenta,
                    edadEnInventario: edadEnInventario >= 0 ? edadEnInventario : 0,
                    fechaIngreso,
                    thumbnail: vehicle.thumbnail
                };
            }) || [];
        } catch (error) {
            console.error('Error fetching sold vehicles:', error);
            return [];
        }
    }

    /**
     * Get comprehensive business metrics
     */
    static async getBusinessMetrics(): Promise<BusinessMetrics> {
        try {
            const [
                vehicleInsights,
                priceRangeInsights,
                leadPersonaInsights,
                soldVehicles,
                unavailableVehicleApplications
            ] = await Promise.all([
                this.getVehicleInsights(20),
                this.getPriceRangeInsights(),
                this.getLeadPersonaInsights(),
                this.getSoldVehiclesHistory(50),
                this.getUnavailableVehicleApplications()
            ]);

            // Calculate summary metrics
            const avgDaysInInventory = soldVehicles.length > 0
                ? soldVehicles.reduce((sum, v) => sum + v.edadEnInventario, 0) / soldVehicles.length
                : 0;

            const fastestSale = soldVehicles.length > 0
                ? Math.min(...soldVehicles.map(v => v.edadEnInventario))
                : 0;

            const slowestSale = soldVehicles.length > 0
                ? Math.max(...soldVehicles.map(v => v.edadEnInventario))
                : 0;

            const totalActiveApplications = vehicleInsights.reduce(
                (sum, v) => sum + v.activeApplications,
                0
            );

            // Calculate conversion rate by price range
            const conversionRateByPrice = priceRangeInsights.map(insight => ({
                range: insight.range,
                rate: insight.avgApplications
            }));

            return {
                vehicleInsights,
                priceRangeInsights,
                leadPersonaInsights,
                soldVehicles,
                unavailableVehicleApplications,
                avgDaysInInventory,
                fastestSale,
                slowestSale,
                totalActiveApplications,
                conversionRateByPrice
            };
        } catch (error) {
            console.error('Error fetching business metrics:', error);
            throw error;
        }
    }
}
