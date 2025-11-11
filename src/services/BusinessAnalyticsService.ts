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
    unavailableVehicleApplications: UnavailableVehicleApp[];
    inventoryVehiclesWithApplications: InventoryVehicleWithApplications[];

    // Summary metrics
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

            // Get ALL vehicles (no status filter) to see which ones have applications
            const { data: vehicles, error: vehicleError } = await supabase
                .from('inventario_cache')
                .select('id, title, ordenstatus, precio')
                .order('title', { ascending: true });

            if (vehicleError) {
                console.error('[BusinessAnalytics] Error fetching inventory vehicles:', vehicleError);
                throw vehicleError;
            }

            if (!vehicles || vehicles.length === 0) {
                console.log('[BusinessAnalytics] No inventory vehicles found in inventario_cache');
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

            // Log sample applications to see structure
            if (applications && applications.length > 0) {
                console.log('[BusinessAnalytics] Sample application:', applications[0]);
                console.log('[BusinessAnalytics] car_info structure:', applications[0].car_info);
            }

            // Count applications per vehicle
            const vehicleAppCounts = new Map<string, number>();
            applications?.forEach(app => {
                const vehicleId = app.car_info?.id;
                console.log('[BusinessAnalytics] Processing app:', {
                    appId: app.id,
                    vehicleId,
                    hasCarInfo: !!app.car_info,
                    carInfoKeys: app.car_info ? Object.keys(app.car_info) : []
                });
                if (vehicleId) {
                    vehicleAppCounts.set(vehicleId, (vehicleAppCounts.get(vehicleId) || 0) + 1);
                }
            });

            console.log('[BusinessAnalytics] Vehicle app counts:', Object.fromEntries(vehicleAppCounts));

            // Map vehicles with their application counts
            const vehiclesWithApps = vehicles.map(vehicle => ({
                id: vehicle.id,
                titulo: vehicle.title || 'Sin título',
                ordenstatus: vehicle.ordenstatus || 'Disponible',
                precio: vehicle.precio || 0,
                ongoingApplications: vehicleAppCounts.get(vehicle.id) || 0
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
                .select('id, title, ordenstatus, precio')
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
     * Get comprehensive business metrics
     */
    static async getBusinessMetrics(): Promise<BusinessMetrics> {
        try {
            const [
                vehicleInsights,
                priceRangeInsights,
                leadPersonaInsights,
                unavailableVehicleApplications,
                inventoryVehiclesWithApplications
            ] = await Promise.all([
                this.getVehicleInsights(20),
                this.getPriceRangeInsights(),
                this.getLeadPersonaInsights(),
                this.getUnavailableVehicleApplications(),
                this.getInventoryVehiclesWithApplications(50)
            ]);

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
                unavailableVehicleApplications,
                inventoryVehiclesWithApplications,
                totalActiveApplications: totalActiveApplications || 0,
                conversionRateByPrice
            };
        } catch (error) {
            console.error('Error fetching business metrics:', error);
            throw error;
        }
    }
}
