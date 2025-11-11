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

export interface InventoryVehicleWithApplications {
    id: string;
    titulo: string;
    ordenstatus: string;
    precio: number;
    ongoingApplications: number;
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
    inventoryVehiclesWithApplications: InventoryVehicleWithApplications[];

    // Summary metrics
    avgDaysInInventory: number;
    fastestSale: number;
    slowestSale: number;
    totalActiveApplications: number;
    conversionRateByPrice: { range: string; rate: number }[];
}

export class BusinessAnalyticsService {
    /**
     * Get inventory vehicles (Comprado or Disponible) with ongoing application counts
     */
    static async getInventoryVehiclesWithApplications(limit: number = 50): Promise<InventoryVehicleWithApplications[]> {
        try {
            console.log('[BusinessAnalytics] Fetching inventory vehicles with applications...');

            // Get all vehicles with status Comprado or Disponible
            const { data: vehicles, error: vehicleError } = await supabase
                .from('inventario_cache')
                .select('id, title, ordenstatus, precio, thumbnail')
                .in('ordenstatus', ['Comprado', 'Disponible'])
                .order('title', { ascending: true });

            if (vehicleError) {
                console.error('[BusinessAnalytics] Error fetching inventory vehicles:', vehicleError);
                throw vehicleError;
            }

            if (!vehicles || vehicles.length === 0) {
                console.log('[BusinessAnalytics] No inventory vehicles found');
                return [];
            }

            console.log(`[BusinessAnalytics] Found ${vehicles.length} inventory vehicles`);

            // Get all ongoing applications (not draft, rejected, cancelled, or completed)
            const { data: applications, error: appError } = await supabase
                .from('financing_applications')
                .select('id, status, car_info')
                .in('status', ['pending', 'submitted', 'processing', 'approved', 'in_progress']);

            if (appError) {
                console.error('[BusinessAnalytics] Error fetching applications:', appError);
                throw appError;
            }

            console.log(`[BusinessAnalytics] Found ${applications?.length || 0} ongoing applications`);

            // Count applications per vehicle
            const vehicleAppCounts = new Map<string, number>();
            applications?.forEach(app => {
                const vehicleId = app.car_info?.id;
                if (vehicleId) {
                    vehicleAppCounts.set(vehicleId, (vehicleAppCounts.get(vehicleId) || 0) + 1);
                }
            });

            // Map vehicles with their application counts
            const vehiclesWithApps = vehicles.map(vehicle => ({
                id: vehicle.id,
                titulo: vehicle.title || 'Sin título',
                ordenstatus: vehicle.ordenstatus || 'Disponible',
                precio: vehicle.precio || 0,
                ongoingApplications: vehicleAppCounts.get(vehicle.id) || 0,
                thumbnail: vehicle.thumbnail
            }));

            // Sort by ongoing applications (descending), then by price
            const sorted = vehiclesWithApps
                .sort((a, b) => {
                    if (b.ongoingApplications !== a.ongoingApplications) {
                        return b.ongoingApplications - a.ongoingApplications;
                    }
                    return b.precio - a.precio;
                })
                .slice(0, limit);

            console.log(`[BusinessAnalytics] Returning ${sorted.length} vehicles with application counts`);
            console.log(`[BusinessAnalytics] Top 3 vehicles:`, sorted.slice(0, 3).map(v => ({
                titulo: v.titulo,
                apps: v.ongoingApplications
            })));

            return sorted;
        } catch (error) {
            console.error('[BusinessAnalytics] Error in getInventoryVehiclesWithApplications:', error);
            return [];
        }
    }

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
     * Fetch sold vehicles from Airtable Inventario table, Ventas view
     * This is the primary source with complete vehicle data including edad en inventario
     */
    static async fetchAirtableInventarioVentas(): Promise<SoldVehicleHistory[]> {
        try {
            console.log('[BusinessAnalytics] Fetching from Airtable Inventario (Ventas view)...');
            const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
            const AIRTABLE_BASE_ID = config.airtable.valuation.baseId;
            const AIRTABLE_API_KEY = config.airtable.valuation.apiKey;
            const AIRTABLE_INVENTARIO_TABLE = 'Inventario';
            const AIRTABLE_VENTAS_VIEW = 'Ventas';

            const allRecords: any[] = [];
            let offset: string | undefined = undefined;
            const maxPages = 10;
            let pageCount = 0;

            do {
                pageCount++;
                const url = new URL(`${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${AIRTABLE_INVENTARIO_TABLE}`);
                url.searchParams.append('view', AIRTABLE_VENTAS_VIEW);
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

            console.log(`[BusinessAnalytics] Fetched ${allRecords.length} records from Airtable Inventario (Ventas view)`);

            // Log first record to see field names
            if (allRecords.length > 0) {
                console.log('[BusinessAnalytics] Sample Inventario record fields:', Object.keys(allRecords[0].fields));
                console.log('[BusinessAnalytics] Sample Inventario record data:', allRecords[0].fields);

                // Log all date-related fields to debug Fecha Venta
                const dateFields = Object.keys(allRecords[0].fields).filter(key =>
                    key.toLowerCase().includes('fecha') || key.toLowerCase().includes('date')
                );
                console.log('[BusinessAnalytics] Date-related fields found:', dateFields);
                dateFields.forEach(field => {
                    console.log(`[BusinessAnalytics] ${field}:`, allRecords[0].fields[field]);
                });
            }

            // Map Airtable records to SoldVehicleHistory format using actual field names
            return allRecords.map(record => {
                const fields = record.fields;

                // Try multiple possible field names for fecha venta
                const fechaVenta = fields['Fecha Vendido'] || fields['fecha_vendido'] || fields['FechaVendido']
                    || fields['Fecha de Venta'] || fields['fecha_venta'] || fields['sale_date']
                    ? new Date(fields['Fecha Vendido'] || fields['fecha_vendido'] || fields['FechaVendido']
                        || fields['Fecha de Venta'] || fields['fecha_venta'] || fields['sale_date'])
                    : new Date();
                const fechaIngreso = fields.ingreso_inventario || fields['Fecha de Ingreso'] || fields['fecha_ingreso']
                    ? new Date(fields.ingreso_inventario || fields['Fecha de Ingreso'] || fields['fecha_ingreso'])
                    : fechaVenta;
                const edadEnInventario = fields['Edad en Inventario'] || Math.floor(
                    (fechaVenta.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24)
                );

                return {
                    id: fields.id || record.id,
                    titulo: fields.title || fields.Auto || fields.TituloMeta || 'Sin título',
                    precio: fields.Precio || fields.price || 0,
                    fechaVenta,
                    edadEnInventario: edadEnInventario >= 0 ? edadEnInventario : 0,
                    fechaIngreso,
                    thumbnail: fields.Foto?.[0]?.url || fields['Foto Catalogo']?.[0]?.url
                };
            });
        } catch (error) {
            console.error('[BusinessAnalytics] Error fetching Airtable Inventario (Ventas view):', error);
            return [];
        }
    }

    /**
     * Fetch sold vehicles from Airtable "Ventas" table (secondary source)
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

            // Log first record to see field names
            if (allRecords.length > 0) {
                console.log('[BusinessAnalytics] Sample Airtable record fields:', Object.keys(allRecords[0].fields));
                console.log('[BusinessAnalytics] Sample record data:', allRecords[0].fields);
            }

            // Map Airtable records to SoldVehicleHistory format
            return allRecords.map(record => {
                const fields = record.fields;

                // Use actual Airtable field names from Ventas table
                const fechaVenta = fields['Fecha Vendido'] ? new Date(fields['Fecha Vendido']) : new Date();

                // Calculate edad en inventario if not provided
                // Assuming vehicles are added when purchased/received
                const fechaIngreso = fechaVenta; // We don't have fecha_ingreso in Ventas table
                const edadEnInventario = 0; // Not available in current Ventas schema

                return {
                    id: fields['ID del Auto'] || fields['Auto ID'] || record.id,
                    titulo: fields['Auto vendido'] || 'Sin título',
                    precio: fields['Precio de Venta'] || 0,
                    fechaVenta,
                    edadEnInventario, // Will be 0 since we don't have this data
                    fechaIngreso,
                    thumbnail: undefined // No thumbnail field in Ventas table
                };
            });
        } catch (error) {
            console.error('[BusinessAnalytics] Error fetching Airtable Ventas:', error);
            return [];
        }
    }

    /**
     * Get sold vehicles history from PRIMARY source (Airtable Inventario - Ventas view)
     * This is the main tab with complete data including edad en inventario
     */
    static async getSoldVehiclesHistory(limit: number = 50): Promise<SoldVehicleHistory[]> {
        try {
            // Primary source: Airtable Inventario table, Ventas view
            const inventarioVentas = await this.fetchAirtableInventarioVentas();

            // Sort by fecha_venta descending and limit
            const sorted = inventarioVentas
                .sort((a, b) => b.fechaVenta.getTime() - a.fechaVenta.getTime())
                .slice(0, limit);

            console.log(`[BusinessAnalytics] Primary sold vehicles (Inventario): ${sorted.length}`);

            return sorted;
        } catch (error) {
            console.error('Error fetching sold vehicles from Inventario:', error);
            return [];
        }
    }

    /**
     * Get sold vehicles from SECONDARY source (Airtable Ventas table)
     * This is the secondary tab with sales records
     */
    static async getSoldVehiclesFromVentasTable(limit: number = 50): Promise<SoldVehicleHistory[]> {
        try {
            // Secondary source: Airtable Ventas table
            const ventasRecords = await this.fetchAirtableVentas();

            // Sort by fecha_venta descending and limit
            const sorted = ventasRecords
                .sort((a, b) => b.fechaVenta.getTime() - a.fechaVenta.getTime())
                .slice(0, limit);

            console.log(`[BusinessAnalytics] Secondary sold vehicles (Ventas table): ${sorted.length}`);

            return sorted;
        } catch (error) {
            console.error('Error fetching sold vehicles from Ventas table:', error);
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
                unavailableVehicleApplications,
                inventoryVehiclesWithApplications
            ] = await Promise.all([
                this.getVehicleInsights(20),
                this.getPriceRangeInsights(),
                this.getLeadPersonaInsights(),
                this.getSoldVehiclesHistory(50),
                this.getUnavailableVehicleApplications(),
                this.getInventoryVehiclesWithApplications(50)
            ]);

            // Calculate summary metrics
            // Only use vehicles with valid edadEnInventario (> 0) for accurate metrics
            const vehiclesWithInventoryAge = soldVehicles.filter(v => v.edadEnInventario > 0);

            const avgDaysInInventory = vehiclesWithInventoryAge.length > 0
                ? vehiclesWithInventoryAge.reduce((sum, v) => sum + v.edadEnInventario, 0) / vehiclesWithInventoryAge.length
                : 0;

            const fastestSale = vehiclesWithInventoryAge.length > 0
                ? Math.min(...vehiclesWithInventoryAge.map(v => v.edadEnInventario))
                : 0;

            const slowestSale = vehiclesWithInventoryAge.length > 0
                ? Math.max(...vehiclesWithInventoryAge.map(v => v.edadEnInventario))
                : 0;

            // Get total applications count from database (all non-draft applications)
            const { count: totalActiveApplications, error: countError } = await supabase
                .from('financing_applications')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'draft');

            if (countError) {
                console.error('[BusinessAnalytics] Error counting applications:', countError);
            }

            console.log('[BusinessAnalytics] Total active applications:', totalActiveApplications);

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
                inventoryVehiclesWithApplications,
                avgDaysInInventory,
                fastestSale,
                slowestSale,
                totalActiveApplications: totalActiveApplications || 0,
                conversionRateByPrice
            };
        } catch (error) {
            console.error('Error fetching business metrics:', error);
            throw error;
        }
    }
}
