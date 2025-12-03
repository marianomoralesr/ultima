import { supabase } from '../../supabaseClient';
import type { Profile } from '../types/types';

/**
 * Service for sales representatives to access their assigned leads.
 * Sales users can only access leads where:
 * 1. asesor_asignado_id matches their user ID
 * 2. autorizar_asesor_acceso is true
 */
export const SalesService = {
  /**
   * Fetches all leads assigned to the current sales representative.
   * Uses RPC function for secure, server-side filtering.
   */
  async getMyAssignedLeads(salesUserId: string): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_sales_assigned_leads', {
      p_sales_user_id: salesUserId
    });

    if (error) {
      console.error("Error fetching assigned leads:", error);
      throw new Error("No se pudieron cargar los leads asignados. Verifica tus permisos.");
    }
    return data || [];
  },

  /**
   * Fetches statistics for the sales representative's assigned leads.
   */
  async getMyLeadsStats(salesUserId: string): Promise<any> {
    const { data, error } = await supabase.rpc('get_sales_dashboard_stats', {
      p_sales_user_id: salesUserId
    });

    if (error) {
      console.error("Error fetching sales dashboard stats:", error);
      throw new Error("No se pudieron cargar las estadísticas.");
    }
    return data?.[0] || {};
  },

  /**
   * Fetches a single client's complete profile if the sales user has access.
   * @param clientId The ID of the client to fetch.
   * @param salesUserId The ID of the sales user making the request.
   */
  async getClientProfile(
    clientId: string,
    salesUserId: string
  ): Promise<{ profile: Profile; applications: any[], tags: any[], reminders: any[], documents: any[], bank_profile: any } | null> {
    const { data, error } = await supabase.rpc('get_sales_client_profile', {
      p_client_id: clientId,
      p_sales_user_id: salesUserId
    });

    if (error) {
      console.error("Error fetching client profile for sales:", error);
      throw new Error("No se pudo cargar el perfil del cliente. Verifica que tengas acceso autorizado.");
    }

    if (!data || !data.profile) {
      return null; // Access denied or client not found
    }

    return {
      profile: data.profile,
      applications: data.applications || [],
      tags: data.tags || [],
      reminders: data.reminders || [],
      documents: data.documents || [],
      bank_profile: data.bank_profile || null,
    };
  },

  /**
   * Gets available tags (same as admin, but kept here for consistency)
   */
  async getAvailableTags(): Promise<any[]> {
    const { data, error } = await supabase.from('lead_tags').select('*').order('tag_name');
    if (error) throw error;
    return data || [];
  },

  /**
   * Updates tags for a lead (sales can only update their assigned leads)
   */
  async updateLeadTags(userId: string, tagIds: string[], salesUserId: string): Promise<void> {
    // First verify the sales user has access
    const { data: hasAccess } = await supabase.rpc('verify_sales_access_to_lead', {
      p_lead_id: userId,
      p_sales_user_id: salesUserId
    });

    if (!hasAccess) {
      throw new Error("No tienes autorización para modificar este lead.");
    }

    const { error: deleteError } = await supabase.from('lead_tag_associations').delete().eq('lead_id', userId);
    if (deleteError) throw deleteError;

    if (tagIds.length > 0) {
      const associations = tagIds.map(tagId => ({ lead_id: userId, tag_id: tagId }));
      const { error: insertError } = await supabase.from('lead_tag_associations').insert(associations);
      if (insertError) throw insertError;
    }
  },

  /**
   * Creates a reminder for an assigned lead
   */
  async createReminder(reminder: {
    lead_id: string;
    agent_id: string;
    reminder_text: string;
    reminder_date: string;
  }, salesUserId: string): Promise<void> {
    // Verify access
    const { data: hasAccess } = await supabase.rpc('verify_sales_access_to_lead', {
      p_lead_id: reminder.lead_id,
      p_sales_user_id: salesUserId
    });

    if (!hasAccess) {
      throw new Error("No tienes autorización para crear recordatorios para este lead.");
    }

    const { error } = await supabase.from('lead_reminders').insert(reminder);
    if (error) throw error;
  },

  /**
   * Updates a reminder
   */
  async updateReminder(
    reminderId: string,
    updates: { reminder_text?: string; reminder_date?: string; is_completed?: boolean; }
  ): Promise<void> {
    const { error } = await supabase.from('lead_reminders').update(updates).eq('id', reminderId);
    if (error) throw error;
  },

  /**
   * Deletes a reminder
   */
  async deleteReminder(reminderId: string): Promise<void> {
    const { error } = await supabase.from('lead_reminders').delete().eq('id', reminderId);
    if (error) throw error;
  },
};
