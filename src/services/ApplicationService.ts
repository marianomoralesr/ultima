import { supabase } from '../../supabaseClient';
import type { ApplicationListItem, LatestApplicationData, UpdatedApplicationData } from '../types/types';
import { APPLICATION_STATUS } from '../constants/applicationStatus';

export const ApplicationService = {
  async submitApplication(applicationData: Record<string, any>): Promise<{ id: string } | null> {
    const { data, error } = await supabase.rpc('submit_application', { application_data: applicationData });

    if (error) {
      console.error('Error submitting application:', error.message);
      throw new Error('No se pudo enviar la solicitud.');
    }
    return data ? { id: data } : null;
  },

  async getUserApplications(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('financing_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user applications:', error.message);
      throw new Error(`No se pudieron obtener las solicitudes: ${error.message}`);
    }
    return data ?? [];
  },

  async getApplicationById(userId: string, applicationId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('financing_applications')
      .select('*')
      .eq('user_id', userId)
      .eq('id', applicationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching application by ID:', error.message, { code: error.code, details: error.details });
      throw new Error('No se pudo obtener la solicitud.');
    }
    return data ?? null;
  },

  async getLatestApplicationForUser(userId: string): Promise<LatestApplicationData | null> {
    const { data, error } = await supabase
      .from('financing_applications')
      .select('id, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) {
      console.error('Error fetching latest application for user:', error.message, { code: error.code, details: error.details });
      return null;
    }
    return data ?? null;
  },

  async updateApplication(applicationId: string, applicationData: Record<string, any> & { documents_pending?: boolean }): Promise<UpdatedApplicationData | null> {
    if (applicationData.status === 'submitted') {
        const result = await this.submitApplication({ ...applicationData, id: applicationId });
        return result ? { ...result, status: 'submitted', updated_at: new Date().toISOString() } : null;
    }

    // Get current application status
    const { data: currentApp } = await supabase
      .from('financing_applications')
      .select('status')
      .eq('id', applicationId)
      .maybeSingle();

    const currentStatus = currentApp?.status || 'draft';

    // Only automatically set status if current status is draft or if explicitly provided
    let newStatus = applicationData.status || currentStatus;

    // Auto-detect status based on documents only if status is draft or not in review/approved/rejected
    if (currentStatus === APPLICATION_STATUS.DRAFT || !applicationData.status) {
      const hasAllDocuments = await this.checkApplicationDocuments(applicationId, applicationData);
      // Set status based on documents: "Completa" if has docs, "Faltan Documentos" if not
      newStatus = hasAllDocuments ? APPLICATION_STATUS.COMPLETA : APPLICATION_STATUS.FALTAN_DOCUMENTOS;
    }

    const patch: Record<string, any> = { status: newStatus };
    for (const [k, v] of Object.entries(applicationData)) {
      if (v !== undefined && k !== 'documents_pending' && k !== 'status') patch[k] = v;
    }

    const { data, error } = await supabase
      .from('financing_applications')
      .update(patch)
      .eq('id', applicationId)
      .select('id, status, updated_at')
      .maybeSingle();

    if (error) {
      console.error('Error updating application:', error.message, { code: error.code, details: error.details });

      // Better error message for constraint violations
      if (error.message?.includes('unique') || error.message?.includes('constraint')) {
        throw new Error('Ya tienes una solicitud activa. Solo puedes tener una solicitud a la vez.');
      }

      throw new Error('No se pudo enviar la solicitud.');
    }

    return data;
  },

  async checkApplicationDocuments(applicationId: string, applicationData: Record<string, any>): Promise<boolean> {
    // Check for uploaded documents in application data or existing application
    const requiredDocFields = [
      'ine_url',
      'comprobante_domicilio_url',
      'comprobante_ingresos_url'
    ];

    // First check if documents are provided in the current update
    const hasDocsInData = requiredDocFields.some(field =>
      applicationData[field] && String(applicationData[field]).trim() !== ''
    );

    if (hasDocsInData) return true;

    // If not in data, check existing application
    const { data: app, error } = await supabase
      .from('financing_applications')
      .select(requiredDocFields.join(', '))
      .eq('id', applicationId)
      .maybeSingle();

    if (error || !app) return false;

    // Check if at least the INE is uploaded (minimum requirement)
    return Boolean(app.ine_url && String(app.ine_url).trim() !== '');
  },

  async updateApplicationStatus(applicationId: string, status: string) {
    const { data: current, error: readErr } = await supabase
      .from('financing_applications')
      .select('status')
      .eq('id', applicationId)
      .maybeSingle();

    if (readErr) {
      console.error('Error reading current status:', readErr.message, { code: readErr.code, details: readErr.details });
      throw new Error('Could not read application status.');
    }
    if (!current || current.status === status) return;

    const { error } = await supabase
      .from('financing_applications')
      .update({ status })
      .eq('id', applicationId);

    if (error) {
      console.error('Error updating application status:', error.message, { code: error.code, details: error.details });
      throw new Error('Could not update application status.');
    }
  },

  async hasActiveApplication(userId: string): Promise<boolean> {
    const { data, error} = await supabase
      .from('financing_applications')
      .select('id, status')
      .eq('user_id', userId)
      .in('status', [
        APPLICATION_STATUS.COMPLETA,
        APPLICATION_STATUS.FALTAN_DOCUMENTOS,
        APPLICATION_STATUS.EN_REVISION,
        APPLICATION_STATUS.APROBADA,
        APPLICATION_STATUS.RECHAZADA,
        // Legacy statuses for backward compatibility
        APPLICATION_STATUS.SUBMITTED,
        APPLICATION_STATUS.REVIEWING,
        APPLICATION_STATUS.PENDING_DOCS,
        APPLICATION_STATUS.APPROVED,
        APPLICATION_STATUS.IN_REVIEW,
        'rejected'
      ])
      .limit(1)
      .maybeSingle();

    if (error) {
      // If error is "no rows returned" it's not really an error for this check
      if (error.code === 'PGRST116') {
        return false;
      }
      console.error('Error checking for active applications:', error.message, { code: error.code, details: error.details });
      throw new Error('No se pudo verificar el estado de las solicitudes existentes.');
    }

    return data !== null;
  },

  async createDraftApplication(userId: string, initialData: Record<string, any> = {}): Promise<ApplicationListItem | null> {
    // Explicitly pass user_id to ensure the draft is created correctly
    const { data: newDraft, error: createError } = await supabase
      .from('financing_applications')
      .insert({ user_id: userId, status: 'draft', ...initialData })
      .select('id, status, created_at, updated_at')
      .single();

    if (createError) {
      console.error('Error creating new draft application:', createError.message, { code: createError.code, details: createError.details });
      throw new Error('No se pudo iniciar una nueva solicitud.');
    }

    return newDraft;
  },

  async saveApplicationDraft(applicationId: string, draftData: Record<string, any>): Promise<UpdatedApplicationData | null> {
    const { data, error } = await supabase
      .from('financing_applications')
      .update(draftData)
      .eq('id', applicationId)
      .select('id, status, updated_at')
      .single();

    if (error) {
      console.error('Error saving application draft:', error.message, { code: error.code, details: error.details });
      throw new Error('No se pudo guardar el borrador de la solicitud.');
    }

    return data;
  },

  async deleteApplication(applicationId: string, userId: string) {
    const { data, error } = await supabase
      .from('financing_applications')
      .delete()
      .match({ id: applicationId, user_id: userId });

    if (error) {
      console.error('Error deleting application:', error.message, { code: error.code, details: error.details });
      throw new Error('No se pudo eliminar la solicitud.');
    }
    return data;
  },
};
