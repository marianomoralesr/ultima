import type { Vehicle, VehicleFilters } from '../types/types';
import { supabase } from '../../supabaseClient';
import { generateSlug } from '../utils/formatters';
import { getVehicleImage } from '../utils/getVehicleImage';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';

interface CacheEntry<T> {
  data: T;
  totalCount: number;
  timestamp: number;
}

const isValidImageUrl = (url: any): url is string => {
    if (typeof url !== 'string' || url.trim() === '') return false;
    return url.trim().startsWith('http');
};

class VehicleService {
    private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private static readonly RECENTLY_VIEWED_KEY = 'trefa_recently_viewed';
    private static cache = new Map<string, CacheEntry<Vehicle[]>>();
    private static readonly VEHICLES_PER_PAGE = 20;

    private static async buildSupabaseQuery(filters: VehicleFilters = {}, page: number = 1) {
        console.log('Building Supabase query with filters:', filters);
        const reverseSucursalMapping: Record<string, string> = {
            'Monterrey': 'MTY',
            'Guadalupe': 'GPE',
            'Reynosa': 'TMPS',
            'Saltillo': 'COAH'
        };

        let query = supabase.from('inventario_cache').select('*, feature_image_url, fotos_exterior_url', { count: 'exact' });

        // --- Base Filters ---
        query = query.eq('ordenstatus', 'Comprado');
        if (filters.hideSeparado) {
            query = query.or('separado.is.false,separado.is.null');
        }

        // --- Direct Equality Filters ---
        if (filters.marca && filters.marca.length > 0) {
            query = query.in('marca', filters.marca);
        }
        if (filters.autoano && filters.autoano.length > 0) {
            query = query.in('autoano', filters.autoano);
        }
        if (filters.transmision && filters.transmision.length > 0) {
            query = query.in('transmision', filters.transmision);
        }
        if (filters.combustible && filters.combustible.length > 0) {
            query = query.in('combustible', filters.combustible);
        }
        if (filters.garantia && filters.garantia.length > 0) {
            query = query.in('garantia', filters.garantia);
        }

        // --- Range Filters ---
        if (filters.minPrice) {
            query = query.gte('precio', filters.minPrice);
        }
        if (filters.maxPrice) {
            query = query.lte('precio', filters.maxPrice);
        }
        if (filters.enganchemin) {
            query = query.gte('enganchemin', filters.enganchemin);
        }
        if (filters.maxEnganche) {
            query = query.lte('enganchemin', filters.maxEnganche);
        }

        // --- Complex Text Search / Array-like Filters ---
        if (filters.carroceria && filters.carroceria.length > 0) {
            query = query.in('carroceria', filters.carroceria);
        }
        if (filters.ubicacion && filters.ubicacion.length > 0) {
            const rawSucursales = filters.ubicacion.map(s => reverseSucursalMapping[s] || s);
            query = query.in('ubicacion', rawSucursales);
        }

        if (filters.promotion && filters.promotion.length > 0) {
            query = query.overlaps('promociones', filters.promotion);
        }

        if (filters.search) {
            const { data: searchData, error: searchError } = await supabase.rpc('search_vehicles', { search_term: filters.search });
            if (searchError) throw searchError;
            
            if (Array.isArray(searchData)) {
                const vehicleIds = searchData.map((v: any) => v.id);
                if (vehicleIds.length === 0) {
                    query = query.eq('id', -1); 
                } else {
                    query = query.in('id', vehicleIds);
                }
            }
        }
        
        // --- Pagination and Ordering ---
        const from = (page - 1) * this.VEHICLES_PER_PAGE;
        const to = from + this.VEHICLES_PER_PAGE - 1;
        query = query.range(from, to);
        
        if (filters.orderby) {
            const [field, direction] = filters.orderby.split('-');
            const fieldMap: Record<string, string> = {
                price: 'precio',
                year: 'autoano',
                mileage: 'kilometraje'
            };
            const mappedField = fieldMap[field] || field;
            query = query.order(mappedField, { ascending: direction === 'asc' });
        } else if (!filters.search) { // Don't re-order if search is active, as it's already ordered by relevance
            query = query.order('updated_at', { ascending: false });
        }

        return query;
    }

    public static async getAllVehicles(filters: VehicleFilters = {}, page: number = 1): Promise<{ vehicles: Vehicle[], totalCount: number }> {
        const cacheKey = `vehicles_${JSON.stringify(filters)}_${page}`;
        
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            console.log('Cache hit!');
            return { vehicles: cached.data, totalCount: cached.totalCount };
        }

        try {
            const localCache = localStorage.getItem(cacheKey);
            if (localCache) {
                const { data, totalCount, timestamp } = JSON.parse(localCache);
                if (Date.now() - timestamp < this.CACHE_TTL) {
                    console.log('Local storage cache hit!');
                    this.cache.set(cacheKey, { data, totalCount, timestamp });
                    return { vehicles: data, totalCount };
                }
            }
        } catch (e) {
            console.warn("Could not read localStorage cache.", e);
        }

        try {
            const query = await this.buildSupabaseQuery(filters, page);
            const { data, error, count } = await query;
            
            if (error) throw error;
            if (!data) throw new Error("No data returned from Supabase.");

            const normalizedData = this.normalizeVehicleData(data);
            const totalCount = count || 0;
            
            console.log('Normalized Data:', normalizedData);
            console.log('Total Count:', totalCount);

            this.cache.set(cacheKey, { data: normalizedData, totalCount, timestamp: Date.now() });
            try {
                localStorage.setItem(cacheKey, JSON.stringify({ data: normalizedData, totalCount, timestamp: Date.now() }));
            } catch (e) {
                console.warn("Could not write to localStorage cache.", e);
            }

            return { vehicles: normalizedData, totalCount };
        } catch (error) {
            console.error('Primary data source failed, attempting to use stale cache.', error);
            // If the network fails, try to return from cache even if it's stale.
            const staleCached = this.cache.get(cacheKey);
            if (staleCached) {
                console.warn('Returning stale in-memory cache data.');
                return { vehicles: staleCached.data, totalCount: staleCached.totalCount };
            }
            try {
                const staleLocalCache = localStorage.getItem(cacheKey);
                if (staleLocalCache) {
                    console.warn('Returning stale localStorage cache data.');
                    const { data, totalCount } = JSON.parse(staleLocalCache);
                    return { vehicles: data, totalCount };
                }
            } catch (e) {
                console.error("Could not read or parse stale localStorage cache.", e);
            }
            // If there's no stale cache, re-throw the original error.
            throw error;
        }
    }

    public static async getFilterOptions(): Promise<any> {
        try {
            const { data, error } = await supabase.rpc('get_filter_options');
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching filter options:', error);
            return {};
        }
    }

    public static async getVehicleByOrdenCompra(ordencompra: string): Promise<Vehicle | null> {
        if (!ordencompra) return null;
        try {
            const { data, error } = await supabase
                .from('inventario_cache')
                .select('*')
                .eq('ordencompra', ordencompra)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // No single row found
                throw error;
            }
            if (data) {
                const normalized = this.normalizeVehicleData([data]);
                return this.recordVehicleView(normalized[0]);
            }
            return null;
        } catch (error) {
            console.error(`Error fetching vehicle by ordencompra '${ordencompra}':`, error);
            return null;
        }
    }

    public static async getVehicleBySlug(slug: string): Promise<Vehicle | null> {
        if (!slug) return null;
        try {
            const { data, error } = await supabase
                .from('inventario_cache')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw error;
            }
            if (data) {
                const normalized = this.normalizeVehicleData([data]);
                return this.recordVehicleView(normalized[0]);
            }
            return null;
        } catch (error) {
            console.error(`Error fetching vehicle by slug '${slug}':`, error);
            return null;
        }
    }

    public static async getAllVehicleSlugs(): Promise<{ slug: string }[]> {
        try {
            const { data, error } = await supabase
                .from('inventario_cache')
                .select('slug')
                .eq('ordenstatus', 'Comprado')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching all vehicle slugs:', error);
            return [];
        }
    }

    private static recordVehicleView(vehicle: Vehicle): Vehicle {
        // Increment view count in database (fire-and-forget)
        if (vehicle.ordencompra) {
            supabase.rpc('increment_vehicle_views', { vehicle_ordencompra: vehicle.ordencompra })
                .then(({ error }) => {
                    if (error) {
                        console.error(`[VehicleService] Error incrementing view count for vehicle ${vehicle.id}:`, error);
                    }
                });
        }

        // Add to recently viewed
        this.addToRecentlyViewed(vehicle);

        // Return vehicle with incremented count for immediate UI feedback
        return { ...vehicle, viewcount: (vehicle.viewcount || 0) + 1 };
    }

    private static addToRecentlyViewed(vehicle: Vehicle) {
        try {
            const rawData = localStorage.getItem(this.RECENTLY_VIEWED_KEY);
            const recentlyViewed: Partial<Vehicle>[] = rawData ? JSON.parse(rawData) : [];
            
            const filtered = recentlyViewed.filter(v => v.id !== vehicle.id);

            const vehicleSummary = {
                id: vehicle.id,
                slug: vehicle.slug,
                titulo: vehicle.titulo,
                precio: vehicle.precio,
                feature_image: vehicle.feature_image,
                kilometraje: vehicle.kilometraje,
                autoano: vehicle.autoano,
                galeria_exterior: vehicle.galeria_exterior || [],
                fotos_exterior_url: vehicle.fotos_exterior_url || [],
            };

            filtered.unshift(vehicleSummary);
            localStorage.setItem(this.RECENTLY_VIEWED_KEY, JSON.stringify(filtered.slice(0, 10)));
        } catch (error) { console.error("Failed to update recently viewed:", error); }
    }
    
private static normalizeVehicleData(rawData: any[]): Vehicle[] {
    const safeParseFloat = (val: any, fallback = 0) => { const n = parseFloat(String(val).replace(/,/g, '')); return isNaN(n) ? fallback : n; };
    const safeParseInt = (val: any, fallback = 0) => { const n = parseInt(String(val).replace(/,/g, ''), 10); return isNaN(n) ? fallback : n; };

    const parseGalleryField = (field: any): string[] => {
        if (Array.isArray(field)) {
            return field.filter(isValidImageUrl);
        }
        if (typeof field === 'string') {
            return field.split(',').map(url => url.trim()).filter(isValidImageUrl);
        }
        return [];
    };

    const normalizedVehicles = rawData.filter(Boolean).map((item) => {
        const title = item.title || `${item.marca || ''} ${item.modelo || ''} ${item.autoano || ''}`.trim() || 'Auto sin título';
        const slug = item.slug || generateSlug(title);
        
        let clasificacionid: string[] = [];
        if (Array.isArray(item.clasificacionid)) {
            clasificacionid = item.clasificacionid.map(String);
        } else if (typeof item.clasificacionid === 'string') {
            clasificacionid = item.clasificacionid.split(',').map((c: string) => c.trim()).filter(Boolean);
        }

        const sucursalMapping: Record<string, string> = { 'MTY': 'Monterrey', 'GPE': 'Guadalupe', 'TMPS': 'Reynosa', 'COAH': 'Saltillo' };
        let normalizedSucursales: string[] = [];
        if (Array.isArray(item.ubicacion)) {
            normalizedSucursales = item.ubicacion.map((s: string) => sucursalMapping[s.trim().toUpperCase()] || s.trim()).filter(Boolean);
        } else if (typeof item.ubicacion === 'string') {
            normalizedSucursales = item.ubicacion.split(',').map((s: string) => sucursalMapping[s.trim().toUpperCase()] || s.trim()).filter(Boolean);
        }

        const featureImage = getVehicleImage(item);

        const exteriorGallery = [
            ...parseGalleryField(item.fotos_exterior_url),
            ...parseGalleryField(item.galeria_exterior)
        ];
        
        const interiorGallery = [
            ...parseGalleryField(item.fotos_interior_url),
            ...parseGalleryField(item.galeria_interior)
        ];

        const viewCount = safeParseInt(item.view_count || item.viewcount);

        const normalizedVehicle = {
            id: item.id || 0,
            slug: slug,
            ordencompra: item.ordencompra || '',
            record_id: item.record_id || null,
            
            titulo: title,
            descripcion: item.descripcion || '',
            metadescripcion: item.metadescripcion || '',

            marca: item.marca || '',
            modelo: item.modelo || '',
            
            autoano: safeParseInt(item.autoano),
            precio: safeParseFloat(item.precio),
            kilometraje: safeParseInt(item.kilometraje),
            transmision: item.transmision || '',
            combustible: item.combustible || '',
            carroceria: item.carroceria || '',
            cilindros: safeParseInt(item.cilindros),
            
            enganchemin: safeParseFloat(item.enganchemin),
            enganche_recomendado: safeParseFloat(item.enganche_recomendado),
            mensualidad_minima: safeParseFloat(item.mensualidad_minima),
            mensualidad_recomendada: safeParseFloat(item.mensualidad_recomendada),
            plazomax: safeParseInt(item.plazomax),
            
            feature_image: featureImage,
            galeria_exterior: [...new Set(exteriorGallery)],
            fotos_exterior_url: [...new Set(exteriorGallery)],
            galeria_interior: [...new Set(interiorGallery)],
            
            ubicacion: normalizedSucursales,
            sucursal: normalizedSucursales,
            
            garantia: item.garantia || '',
            
            vendido: !!item.vendido,
            separado: !!item.separado,
            ordenstatus: item.ordenstatus || '',
            
            clasificacionid: clasificacionid,
            
            promociones: Array.isArray(item.promociones) ? item.promociones : [],
            
            view_count: viewCount,
            viewcount: viewCount,

            // --- Compatibility Aliases ---
            title: title,
            price: safeParseFloat(item.precio),
            year: safeParseInt(item.autoano),
            kms: safeParseInt(item.kilometraje),
        } as Vehicle;
        
        return normalizedVehicle;
    });

    return normalizedVehicles.filter(vehicle => vehicle.feature_image !== DEFAULT_PLACEHOLDER_IMAGE);
}


}

export default VehicleService;
