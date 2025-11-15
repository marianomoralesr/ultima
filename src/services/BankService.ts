import { supabase } from '../../supabaseClient';
import type {
  BankRepresentativeProfile,
  BankRepDashboardStats,
  BankRepAssignedLead,
  BankRepLeadDetails,
  BankRepUpdateStatusResponse,
  BankRepApprovalResponse,
  BankName,
  BankFeedback
} from '../types/bank';

/**
 * Bank Service
 * Handles all API operations for the bank representative portal.
 * Security is enforced through RLS policies on the backend.
 */
export const BankService = {
  /**
   * Get the current bank representative's profile
   */
  async getBankRepProfile(): Promise<BankRepresentativeProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('bank_representative_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching bank rep profile:', error);
      throw new Error('Could not fetch bank representative profile');
    }

    return data;
  },

  /**
   * Create a new bank representative profile (registration)
   */
  async createBankRepProfile(profile: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    bank_affiliation: BankName;
  }): Promise<BankRepresentativeProfile> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('bank_representative_profiles')
      .insert({
        id: user.id,
        ...profile,
        is_approved: false,
        is_active: true,
        login_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bank rep profile:', error);
      throw new Error('Could not create bank representative profile');
    }

    return data;
  },

  /**
   * Update bank rep login tracking
   */
  async updateLoginTracking(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from('bank_representative_profiles')
      .update({
        last_login_at: new Date().toISOString(),
        login_count: supabase.sql`login_count + 1`
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating login tracking:', error);
    }
  },

  /**
   * Get dashboard statistics for the bank representative
   */
  async getDashboardStats(): Promise<BankRepDashboardStats> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.rpc('get_bank_rep_dashboard_stats', {
      bank_rep_uuid: user.id
    });

    if (error) {
      console.error('Error fetching bank rep dashboard stats:', error);
      throw new Error('Could not fetch dashboard statistics');
    }

    return data?.[0] || {
      total_assigned: 0,
      pending_review: 0,
      approved: 0,
      rejected: 0,
      feedback_provided: 0
    };
  },

  /**
   * Get all leads assigned to the bank representative
   */
  async getAssignedLeads(): Promise<BankRepAssignedLead[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.rpc('get_bank_rep_assigned_leads', {
      bank_rep_uuid: user.id
    });

    if (error) {
      console.error('Error fetching assigned leads:', error);
      throw new Error('Could not fetch assigned leads');
    }

    return data || [];
  },

  /**
   * Get detailed information about a specific lead
   */
  async getLeadDetails(leadId: string): Promise<BankRepLeadDetails> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.rpc('get_bank_rep_lead_details', {
      p_bank_rep_id: user.id,
      p_lead_id: leadId
    });

    if (error) {
      console.error('Error fetching lead details:', error);
      throw new Error('Could not fetch lead details');
    }

    return data;
  },

  /**
   * Update application status and optionally add feedback
   */
  async updateApplicationStatus(
    assignmentId: string,
    newStatus: string,
    feedbackMessage?: string
  ): Promise<BankRepUpdateStatusResponse> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.rpc('bank_rep_update_application_status', {
      p_assignment_id: assignmentId,
      p_bank_rep_id: user.id,
      p_new_status: newStatus,
      p_feedback_message: feedbackMessage || null
    });

    if (error) {
      console.error('Error updating application status:', error);
      throw new Error('Could not update application status');
    }

    return data;
  },

  /**
   * Add feedback for a lead (without changing status)
   */
  async addFeedback(
    assignmentId: string,
    leadId: string,
    message: string,
    feedbackType: 'general' | 'missing_docs' | 'approval' | 'rejection' | 'request_info' = 'general'
  ): Promise<BankFeedback> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('bank_feedback')
      .insert({
        assignment_id: assignmentId,
        bank_rep_id: user.id,
        lead_id: leadId,
        message,
        feedback_type: feedbackType,
        visible_to_sales: true,
        visible_to_client: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding feedback:', error);
      throw new Error('Could not add feedback');
    }

    return data;
  },

  /**
   * Get document signed URL for preview/download
   */
  async getDocumentSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from('application-documents')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error getting signed URL:', error);
      throw new Error('Could not get document URL');
    }

    return data.signedUrl;
  },

  /**
   * Download all documents for a lead as a zip
   * (This would require a backend function to zip files)
   */
  async downloadAllDocuments(leadId: string): Promise<Blob> {
    // This would call a backend function that zips all documents
    // For now, we'll throw an error indicating this needs to be implemented
    throw new Error('Bulk download not yet implemented - download documents individually');
  },

  // Admin functions
  /**
   * Get all bank representatives (Admin only)
   */
  async getAllBankReps(): Promise<BankRepresentativeProfile[]> {
    try {
      const { data, error } = await supabase
        .from('bank_representative_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bank reps:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Could not fetch bank representatives: ${error.message}`);
      }

      console.log('Fetched bank reps:', data?.length || 0);
      return data || [];
    } catch (error: any) {
      console.error('Exception in getAllBankReps:', error);
      throw error;
    }
  },

  /**
   * Approve or reject a bank representative (Admin only)
   */
  async approveBankRep(
    bankRepId: string,
    approved: boolean
  ): Promise<BankRepApprovalResponse> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.rpc('admin_approve_bank_rep', {
      p_admin_id: user.id,
      p_bank_rep_id: bankRepId,
      p_approved: approved
    });

    if (error) {
      console.error('Error approving bank rep:', error);
      throw new Error('Could not approve bank representative');
    }

    return data;
  },

  /**
   * Assign a lead to a bank representative (Admin only)
   */
  async assignLeadToBank(
    leadId: string,
    applicationId: string | null,
    bankRepId: string,
    bankName: BankName
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Insert the assignment
    const { error: assignError } = await supabase
      .from('lead_bank_assignments')
      .insert({
        lead_id: leadId,
        application_id: applicationId,
        bank_rep_id: bankRepId,
        bank_name: bankName,
        assigned_by: user.id,
        status: 'pending'
      });

    if (assignError) {
      console.error('Error assigning lead to bank:', assignError);
      throw new Error('Could not assign lead to bank');
    }

    // Automatically update application status to "reviewing" (En revisión)
    if (applicationId) {
      const { error: statusError } = await supabase
        .from('financing_applications')
        .update({
          status: 'reviewing',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (statusError) {
        console.error('Error updating application status:', statusError);
        // Don't throw here - assignment succeeded, status update is secondary
      }

      // Log the status change in history
      const { error: historyError } = await supabase
        .from('application_status_history')
        .insert({
          application_id: applicationId,
          lead_id: leadId,
          old_status: null, // We don't have the old status here
          new_status: 'reviewing',
          changed_by: user.id,
          changed_by_type: 'sales',
          reason: `Application sent to ${bankName} for review`
        });

      if (historyError) {
        console.error('Error logging status change:', historyError);
        // Don't throw - this is just logging
      }
    }
  },

  /**
   * Get all feedback for a specific lead (Admin/Sales only)
   */
  async getLeadFeedback(leadId: string): Promise<BankFeedback[]> {
    const { data, error } = await supabase
      .from('bank_feedback')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lead feedback:', error);
      throw new Error('Could not fetch feedback');
    }

    return data || [];
  },

  /**
   * Mark feedback as read by sales
   */
  async markFeedbackAsRead(feedbackId: string): Promise<void> {
    const { error } = await supabase
      .from('bank_feedback')
      .update({
        read_by_sales: true,
        read_at: new Date().toISOString()
      })
      .eq('id', feedbackId);

    if (error) {
      console.error('Error marking feedback as read:', error);
      throw new Error('Could not mark feedback as read');
    }
  }
};
