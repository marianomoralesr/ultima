/**
 * MetricsService - Servicio Unificado de Métricas
 *
 * Este servicio es la ÚNICA fuente de verdad para todas las métricas y cálculos
 * de leads, conversiones y eventos en toda la aplicación.
 *
 * IMPORTANTE: Todos los dashboards deben usar este servicio para garantizar
 * consistencia en los números mostrados.
 */

import { supabase } from '../../supabaseClient';

export interface FunnelMetrics {
  // Eventos del embudo principal (/financiamientos)
  landing_page_views: number;          // PageView a /financiamientos
  registrations: number;                // ConversionLandingPage
  profile_completes: number;            // PersonalInformationComplete
  bank_profiling_completes: number;     // PerfilacionBancariaComplete
  application_starts: number;           // ComienzaSolicitud
  application_submissions: number;      // ApplicationSubmission (todos)
  lead_completes: number;               // LeadComplete (solo desde landing)

  // IDs únicos para tracking secuencial
  landing_user_ids: string[];           // Usuarios que llegaron al landing
  registered_user_ids: string[];        // Usuarios que se registraron
  profile_complete_user_ids: string[];  // Usuarios con perfil completo
  bank_profile_user_ids: string[];      // Usuarios con perfilación bancaria
  application_start_user_ids: string[]; // Usuarios que iniciaron aplicación
  lead_complete_user_ids: string[];     // Usuarios que completaron todo
}

export interface MetaFunnelMetrics {
  // Embudo específico de Meta (Facebook/Instagram)
  meta_landing_views: number;
  meta_registrations: number;
  meta_profile_completes: number;
  meta_bank_profiling_completes: number;
  meta_application_starts: number;
  meta_lead_completes: number;

  meta_user_ids: string[];
}

export interface TimeFrameMetrics {
  all_time: FunnelMetrics;
  last_24h: FunnelMetrics;
  last_7d: FunnelMetrics;
  last_30d: FunnelMetrics;
}

class MetricsServiceClass {

  /**
   * Obtiene todas las métricas del embudo de financiamientos
   * Esta es la función principal que todos los dashboards deben usar
   */
  async getFunnelMetrics(startDate?: string, endDate?: string): Promise<FunnelMetrics> {
    try {
      // Construir query base
      let query = supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: true });

      // Aplicar filtros de fecha si se proporcionan
      if (startDate) {
        query = query.gte('created_at', startDate + 'T00:00:00');
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }

      const { data: events, error } = await query;

      if (error) {
        console.error('[MetricsService] Error fetching events:', error);
        throw error;
      }

      if (!events) {
        return this.getEmptyMetrics();
      }

      // PASO 1: Identificar usuarios que llegaron al landing (/financiamientos)
      const landingPageViews = events.filter(e =>
        e.event_type === 'PageView' && (
          e.metadata?.page === '/financiamientos' ||
          e.page_url?.includes('/financiamientos')
        )
      );

      // PASO 2: Usuarios que se registraron (ConversionLandingPage)
      // IMPORTANTE: Solo contar usuarios ÚNICOS que completaron el registro
      const registrationEvents = events.filter(e =>
        e.event_type === 'ConversionLandingPage' || e.event_name === 'ConversionLandingPage'
      );
      const registeredUserIds = [...new Set(registrationEvents.map(e => e.user_id).filter(Boolean))] as string[];

      // PASO 3: Usuarios con perfil completo (PersonalInformationComplete)
      // Solo contar si el usuario se registró desde el landing
      const profileCompleteEvents = events.filter(e =>
        (e.event_type === 'PersonalInformationComplete' || e.event_name === 'PersonalInformationComplete') &&
        e.user_id && registeredUserIds.includes(e.user_id)
      );
      const profileCompleteUserIds = [...new Set(profileCompleteEvents.map(e => e.user_id).filter(Boolean))] as string[];

      // PASO 4: Usuarios con perfilación bancaria completa
      const bankProfilingEvents = events.filter(e =>
        (e.event_type === 'PerfilacionBancariaComplete' || e.event_name === 'PerfilacionBancariaComplete') &&
        e.user_id && profileCompleteUserIds.includes(e.user_id)
      );
      const bankProfileUserIds = [...new Set(bankProfilingEvents.map(e => e.user_id).filter(Boolean))] as string[];

      // PASO 5: Usuarios que iniciaron aplicación (ComienzaSolicitud)
      const applicationStartEvents = events.filter(e =>
        (e.event_type === 'ComienzaSolicitud' || e.event_name === 'ComienzaSolicitud') &&
        e.user_id && bankProfileUserIds.includes(e.user_id)
      );
      const applicationStartUserIds = [...new Set(applicationStartEvents.map(e => e.user_id).filter(Boolean))] as string[];

      // PASO 6: Usuarios que completaron solicitud (LeadComplete)
      // IMPORTANTE: LeadComplete solo se dispara para usuarios que vinieron del landing
      const leadCompleteEvents = events.filter(e =>
        (e.event_type === 'LeadComplete' || e.event_name === 'LeadComplete') &&
        e.user_id && registeredUserIds.includes(e.user_id)
      );
      const leadCompleteUserIds = [...new Set(leadCompleteEvents.map(e => e.user_id).filter(Boolean))] as string[];

      // PASO 7: Todos los ApplicationSubmission (para comparación)
      const allApplicationSubmissions = events.filter(e =>
        (e.event_type === 'ApplicationSubmission' || e.event_name === 'ApplicationSubmission')
      ).length;

      return {
        landing_page_views: landingPageViews.length,
        registrations: registeredUserIds.length,
        profile_completes: profileCompleteUserIds.length,
        bank_profiling_completes: bankProfileUserIds.length,
        application_starts: applicationStartUserIds.length,
        application_submissions: allApplicationSubmissions,
        lead_completes: leadCompleteUserIds.length,

        landing_user_ids: [],
        registered_user_ids: registeredUserIds,
        profile_complete_user_ids: profileCompleteUserIds,
        bank_profile_user_ids: bankProfileUserIds,
        application_start_user_ids: applicationStartUserIds,
        lead_complete_user_ids: leadCompleteUserIds,
      };
    } catch (error) {
      console.error('[MetricsService] Error in getFunnelMetrics:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Obtiene métricas específicas de tráfico Meta (Facebook/Instagram)
   */
  async getMetaFunnelMetrics(startDate?: string, endDate?: string): Promise<MetaFunnelMetrics> {
    try {
      let query = supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: true });

      if (startDate) {
        query = query.gte('created_at', startDate + 'T00:00:00');
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }

      const { data: events, error } = await query;

      if (error || !events) {
        return this.getEmptyMetaMetrics();
      }

      // Filtrar eventos que vienen de Meta
      const isFromMeta = (event: any) => {
        const hasFbclid = event.metadata?.fbclid ||
                         event.referrer?.includes('facebook.com') ||
                         event.referrer?.includes('instagram.com');
        const isMetaSource = event.utm_source?.toLowerCase().includes('facebook') ||
                            event.utm_source?.toLowerCase().includes('instagram') ||
                            event.utm_source?.toLowerCase().includes('meta');
        return hasFbclid || isMetaSource;
      };

      // Usuarios que se registraron desde Meta
      const metaRegistrations = events.filter(e =>
        (e.event_type === 'ConversionLandingPage' || e.event_name === 'ConversionLandingPage') &&
        isFromMeta(e) && e.user_id
      );
      const metaUserIds = [...new Set(metaRegistrations.map(e => e.user_id).filter(Boolean))] as string[];

      // Métricas del embudo Meta
      const metaLandingViews = events.filter(e =>
        e.event_type === 'PageView' &&
        (e.metadata?.page === '/financiamientos' || e.page_url?.includes('/financiamientos')) &&
        isFromMeta(e)
      ).length;

      const metaProfileCompletes = events.filter(e =>
        (e.event_type === 'PersonalInformationComplete' || e.event_name === 'PersonalInformationComplete') &&
        e.user_id && metaUserIds.includes(e.user_id)
      ).length;

      const metaBankProfiling = events.filter(e =>
        (e.event_type === 'PerfilacionBancariaComplete' || e.event_name === 'PerfilacionBancariaComplete') &&
        e.user_id && metaUserIds.includes(e.user_id)
      ).length;

      const metaApplicationStarts = events.filter(e =>
        (e.event_type === 'ComienzaSolicitud' || e.event_name === 'ComienzaSolicitud') &&
        e.user_id && metaUserIds.includes(e.user_id)
      ).length;

      const metaLeadCompletes = events.filter(e =>
        (e.event_type === 'LeadComplete' || e.event_name === 'LeadComplete') &&
        e.user_id && metaUserIds.includes(e.user_id)
      ).length;

      return {
        meta_landing_views: metaLandingViews,
        meta_registrations: metaUserIds.length,
        meta_profile_completes: metaProfileCompletes,
        meta_bank_profiling_completes: metaBankProfiling,
        meta_application_starts: metaApplicationStarts,
        meta_lead_completes: metaLeadCompletes,
        meta_user_ids: metaUserIds,
      };
    } catch (error) {
      console.error('[MetricsService] Error in getMetaFunnelMetrics:', error);
      return this.getEmptyMetaMetrics();
    }
  }

  /**
   * Obtiene métricas para múltiples períodos de tiempo
   */
  async getTimeFrameMetrics(): Promise<TimeFrameMetrics> {
    const now = new Date();

    // Últimas 24 horas
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const metrics24h = await this.getFunnelMetrics(last24h.toISOString().split('T')[0]);

    // Últimos 7 días
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const metrics7d = await this.getFunnelMetrics(last7d.toISOString().split('T')[0]);

    // Últimos 30 días
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const metrics30d = await this.getFunnelMetrics(last30d.toISOString().split('T')[0]);

    // Todo el tiempo (histórico completo)
    const allTime = await this.getFunnelMetrics();

    return {
      all_time: allTime,
      last_24h: metrics24h,
      last_7d: metrics7d,
      last_30d: metrics30d,
    };
  }

  /**
   * Obtiene el conteo total de leads (LeadComplete)
   * Esta función debe ser usada por TODOS los dashboards para mostrar el mismo número
   */
  async getTotalLeads(startDate?: string, endDate?: string): Promise<number> {
    const metrics = await this.getFunnelMetrics(startDate, endDate);
    return metrics.lead_completes;
  }

  /**
   * Calcula tasas de conversión entre etapas del embudo
   */
  calculateConversionRates(metrics: FunnelMetrics) {
    const safeDiv = (a: number, b: number) => b > 0 ? (a / b) * 100 : 0;

    return {
      landing_to_registration: safeDiv(metrics.registrations, metrics.landing_page_views),
      registration_to_profile: safeDiv(metrics.profile_completes, metrics.registrations),
      profile_to_bank_profiling: safeDiv(metrics.bank_profiling_completes, metrics.profile_completes),
      bank_profiling_to_application: safeDiv(metrics.application_starts, metrics.bank_profiling_completes),
      application_to_lead: safeDiv(metrics.lead_completes, metrics.application_starts),
      overall_conversion: safeDiv(metrics.lead_completes, metrics.landing_page_views),
    };
  }

  private getEmptyMetrics(): FunnelMetrics {
    return {
      landing_page_views: 0,
      registrations: 0,
      profile_completes: 0,
      bank_profiling_completes: 0,
      application_starts: 0,
      application_submissions: 0,
      lead_completes: 0,
      landing_user_ids: [],
      registered_user_ids: [],
      profile_complete_user_ids: [],
      bank_profile_user_ids: [],
      application_start_user_ids: [],
      lead_complete_user_ids: [],
    };
  }

  private getEmptyMetaMetrics(): MetaFunnelMetrics {
    return {
      meta_landing_views: 0,
      meta_registrations: 0,
      meta_profile_completes: 0,
      meta_bank_profiling_completes: 0,
      meta_application_starts: 0,
      meta_lead_completes: 0,
      meta_user_ids: [],
    };
  }
}

export const MetricsService = new MetricsServiceClass();
