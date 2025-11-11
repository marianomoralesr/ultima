import { supabase } from '../../supabaseClient';
import { config } from '../pages/config';

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
                .select('id, title, ordenstatus, precio, thumbnail')
                .in('id', topVehicleIds);

            if (vehicleError) throw vehicleError;

            return vehicles?.map(vehicle => {
                const stats = vehicleMap.get(vehicle.id);
                return {
                    id: vehicle.id,
                    titulo: vehicle.title || 'Sin título',
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
                .select('id, status, created_at, car_info, user_id')
                .in('status', ['pending', 'submitted', 'processing'])
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                console.error('[BusinessAnalytics] Error fetching applications:', error);
                throw error;
            }

            console.log(`[BusinessAnalytics] Found ${applications?.length || 0} active applications`);
            const unavailableApps: UnavailableVehicleApp[] = [];

            // Get all unique user IDs to fetch profiles
            const userIds = Array.from(new Set(
                (applications || [])
                    .map(app => app.user_id)
                    .filter(Boolean)
            ));

            // Fetch user profiles for names and emails
            let userProfiles: Record<string, any> = {};
            if (userIds.length > 0) {
                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    .select('user_id, first_name, last_name, email')
                    .in('user_id', userIds);

                if (!profileError && profiles) {
                    userProfiles = Object.fromEntries(
                        profiles.map(p => [p.user_id, p])
                    );
                }
            }

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
                const userProfile = userProfiles[app.user_id];

                // Vehicle is unavailable if it's not in the map (deleted) or status is not "Disponible"
                if (!vehicleStatus || vehicleStatus !== 'Disponible') {
                    unavailableApps.push({
                        applicationId: app.id,
                        vehicleTitle: carInfo._vehicleTitle || carInfo.title || 'Sin título',
                        applicantName: userProfile
                            ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'Sin nombre'
                            : 'Sin nombre',
                        applicantEmail: userProfile?.email || '',
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
     * Get lead persona insights - analyzing applications by status
     * Note: Since civil_status and monthly_income don't exist in financing_applications,
     * we'll analyze by application status instead
     */
    static async getLeadPersonaInsights(): Promise<LeadPersonaInsight[]> {
        try {
            const { data: applications, error } = await supabase
                .from('financing_applications')
                .select('status')
                .neq('status', 'draft');

            if (error) throw error;

            const statusMap = new Map<string, { count: number; totalIncome: number; approved: number }>();

            applications?.forEach(app => {
                const status = app.status || 'Sin especificar';
                if (!statusMap.has(status)) {
                    statusMap.set(status, { count: 0, totalIncome: 0, approved: 0 });
                }

                const persona = statusMap.get(status)!;
                persona.count++;
                // Since monthly_income doesn't exist, we set avgIncome to 0
                // This field can be populated from profiles table if needed
                if (app.status === 'approved' || app.status === 'completed') {
                    persona.approved++;
                }
            });

            return Array.from(statusMap.entries()).map(([status, data]) => ({
                civilStatus: status,  // Using status field instead of civil_status
                count: data.count,
                avgIncome: 0,  // Field not available in financing_applications
                approvalRate: data.count > 0 ? (data.approved / data.count) * 100 : 0
            })).sort((a, b) => b.count - a.count);
        } catch (error) {
            console.error('Error fetching lead persona insights:', error);
            return [];
        }
    }

    /**
     * Fetch sold vehicles from Airtable "Ventas" table
     */
    static async fetchAirtableVentas(): Promise<SoldVehicleHistory[]> {
        try {
            console.log('[BusinessAnalytics] Fetching Ventas from Airtable...');
            const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
            const AIRTABLE_BASE_ID = config.airtable.valuation.baseId;
            const AIRTABLE_API_KEY = config.airtable.valuation.apiKey;
            const AIRTABLE_VENTAS_TABLE = 'Ventas';  // Table name

            const allRecords: any[] = [];
            let offset: string | undefined = undefined;
            const maxPages = 5;
            let pageCount = 0;

            do {
                pageCount++;
                const url = new URL(`${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${AIRTABLE_VENTAS_TABLE}`);
                url.searchParams.append('pageSize', '100');

                if (offset) {
                    url.searchParams.append('offset', offset);
                }

                const response = await fetch(url.toString(), {
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    console.error('[BusinessAnalytics] Airtable API error:', response.statusText);
                    break;
                }

                const data = await response.json();
                if (data.records && Array.isArray(data.records)) {
                    allRecords.push(...data.records);
                }

                offset = data.offset;
            } while (offset && pageCount < maxPages);

            console.log(`[BusinessAnalytics] Fetched ${allRecords.length} records from Airtable Ventas`);

            // Map Airtable records to SoldVehicleHistory format
            return allRecords.map(record => {
                const fields = record.fields;
                const fechaVenta = fields.fecha_venta ? new Date(fields.fecha_venta) : new Date();
                const fechaIngreso = fields.fecha_ingreso ? new Date(fields.fecha_ingreso) : fechaVenta;
                const edadEnInventario = fields.edad_en_venta || Math.floor(
                    (fechaVenta.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24)
                );

                return {
                    id: record.id,
                    titulo: fields.titulo || fields.vehiculo || 'Sin título',
                    precio: fields.precio || 0,
                    fechaVenta,
                    edadEnInventario: edadEnInventario >= 0 ? edadEnInventario : 0,
                    fechaIngreso,
                    thumbnail: fields.thumbnail || fields.imagen
                };
            });
        } catch (error) {
            console.error('[BusinessAnalytics] Error fetching Airtable Ventas:', error);
            return [];
        }
    }

    /**
     * Get sold vehicles history with edad en inventario
     * Combines data from Supabase and Airtable Ventas table
     */
    static async getSoldVehiclesHistory(limit: number = 50): Promise<SoldVehicleHistory[]> {
        try {
            // Fetch from both sources in parallel
            const [supabaseVehicles, airtableVentas] = await Promise.all([
                // Supabase sold vehicles
                (async () => {
                    const { data, error } = await supabase
                        .from('inventario_cache')
                        .select('id, title, precio, ordenstatus, fecha_ingreso_inventario, updated_at, thumbnail')
                        .or('ordenstatus.eq.Vendido,ordenstatus.eq.Comprado')
                        .order('updated_at', { ascending: false })
                        .limit(limit);

                    if (error) {
                        console.error('[BusinessAnalytics] Error fetching from Supabase:', error);
                        return [];
                    }

                    return data?.map(vehicle => {
                        const fechaIngreso = vehicle.fecha_ingreso_inventario
                            ? new Date(vehicle.fecha_ingreso_inventario)
                            : new Date(vehicle.updated_at);
                        const fechaVenta = new Date(vehicle.updated_at);
                        const edadEnInventario = Math.floor(
                            (fechaVenta.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24)
                        );

                        return {
                            id: vehicle.id,
                            titulo: vehicle.title || 'Sin título',
                            precio: vehicle.precio || 0,
                            fechaVenta,
                            edadEnInventario: edadEnInventario >= 0 ? edadEnInventario : 0,
                            fechaIngreso,
                            thumbnail: vehicle.thumbnail
                        };
                    }) || [];
                })(),
                // Airtable Ventas
                this.fetchAirtableVentas()
            ]);

            // Combine and deduplicate by ID (prefer Airtable data if duplicate)
            const combinedMap = new Map<string, SoldVehicleHistory>();

            // Add Supabase vehicles first
            supabaseVehicles.forEach(v => combinedMap.set(v.id, v));

            // Add/override with Airtable data
            airtableVentas.forEach(v => combinedMap.set(v.id, v));

            // Convert back to array and sort by fecha_venta descending
            const combined = Array.from(combinedMap.values())
                .sort((a, b) => b.fechaVenta.getTime() - a.fechaVenta.getTime())
                .slice(0, limit);

            console.log(`[BusinessAnalytics] Combined sold vehicles: ${combined.length} (Supabase: ${supabaseVehicles.length}, Airtable: ${airtableVentas.length})`);

            return combined;
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
