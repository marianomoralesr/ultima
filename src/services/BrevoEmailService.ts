import { supabase } from '../../supabaseClient';

const ADMIN_EMAILS = [
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
];

interface EmailNotificationParams {
    to: string;
    toName: string;
    subject: string;
    templateType: 'application_submitted' | 'status_changed' | 'document_status_changed' | 'admin_notification' | 'valuation_notification' | 'verification_code';
    templateData: Record<string, any>;
}

export const BrevoEmailService = {
    /**
     * Send an email notification via Brevo using the Supabase Edge Function
     */
    async sendEmail(params: EmailNotificationParams): Promise<boolean> {
        try {
            const { data, error } = await supabase.functions.invoke('send-brevo-email', {
                body: params
            });

            if (error) {
                console.error('[BrevoEmailService] Error sending email:', error);
                return false;
            }

            console.log('[BrevoEmailService] Email sent successfully:', data);
            return true;
        } catch (err: any) {
            console.error('[BrevoEmailService] Exception sending email:', err);
            return false;
        }
    },

    /**
     * Send application submitted notification to client
     */
    async notifyApplicationSubmitted(
        clientEmail: string,
        clientName: string,
        vehicleTitle: string | null,
        applicationId: string
    ): Promise<boolean> {
        const statusUrl = `${window.location.origin}/escritorio/seguimiento/${applicationId}`;

        return this.sendEmail({
            to: clientEmail,
            toName: clientName,
            subject: 'Autos TREFA | Solicitud Recibida con Éxito',
            templateType: 'application_submitted',
            templateData: {
                clientName,
                vehicleTitle,
                submittedAt: new Date().toISOString(),
                statusUrl
            }
        });
    },

    /**
     * Send admin notification about new application
     */
    async notifyAdminsNewApplication(
        clientName: string,
        clientEmail: string,
        clientPhone: string | null,
        vehicleTitle: string | null,
        applicationId: string,
        asesorName: string | null
    ): Promise<boolean> {
        const adminProfileUrl = `${window.location.origin}/escritorio/admin/cliente/${applicationId}`;

        // Send to all admin emails
        const promises = ADMIN_EMAILS.map(adminEmail =>
            this.sendEmail({
                to: adminEmail,
                toName: 'Administrador TREFA',
                subject: `🔔 Nueva Solicitud de Financiamiento - ${clientName}`,
                templateType: 'admin_notification' as any, // We'll add this template type
                templateData: {
                    clientName,
                    clientEmail,
                    clientPhone: clientPhone || 'No proporcionado',
                    vehicleTitle: vehicleTitle || 'No especificado',
                    asesorName: asesorName || 'Sin asignar',
                    submittedAt: new Date().toISOString(),
                    adminProfileUrl
                }
            })
        );

        const results = await Promise.all(promises);
        return results.every(result => result === true);
    },

    /**
     * Send notification to assigned sales advisor about new application
     */
    async notifySalesAdvisor(
        advisorEmail: string,
        advisorName: string,
        clientName: string,
        clientEmail: string,
        clientPhone: string | null,
        vehicleTitle: string | null,
        applicationId: string
    ): Promise<boolean> {
        const salesProfileUrl = `${window.location.origin}/escritorio/ventas/cliente/${applicationId}`;

        return this.sendEmail({
            to: advisorEmail,
            toName: advisorName,
            subject: `🎯 Nueva Solicitud Asignada - ${clientName}`,
            templateType: 'admin_notification' as any,
            templateData: {
                clientName,
                clientEmail,
                clientPhone: clientPhone || 'No proporcionado',
                vehicleTitle: vehicleTitle || 'No especificado',
                asesorName: advisorName,
                submittedAt: new Date().toISOString(),
                adminProfileUrl: salesProfileUrl
            }
        });
    },

    /**
     * Send application status change notification to client
     */
    async notifyStatusChange(
        clientEmail: string,
        clientName: string,
        vehicleTitle: string | null,
        oldStatus: string,
        newStatus: string,
        newStatusLabel: string,
        applicationId: string
    ): Promise<boolean> {
        const statusUrl = `${window.location.origin}/escritorio/seguimiento/${applicationId}`;

        return this.sendEmail({
            to: clientEmail,
            toName: clientName,
            subject: 'Notificaciones TREFA | Cambio el status de tu solicitud',
            templateType: 'status_changed',
            templateData: {
                clientName,
                vehicleTitle,
                oldStatus,
                newStatus,
                newStatusLabel,
                statusUrl
            }
        });
    },

    /**
     * Send valuation notification to admins
     */
    async notifyAdminsNewValuation(
        clientName: string,
        clientEmail: string,
        clientPhone: string,
        vehicleLabel: string,
        mileage: number,
        suggestedOffer: number,
        highMarketValue: number,
        lowMarketValue: number
    ): Promise<boolean> {
        // Send to all admin emails
        const promises = ADMIN_EMAILS.map(adminEmail =>
            this.sendEmail({
                to: adminEmail,
                toName: 'Administrador Autos TREFA',
                subject: `🚗 Nueva Cotización de Vehículo - ${clientName}`,
                templateType: 'valuation_notification',
                templateData: {
                    clientName,
                    clientEmail,
                    clientPhone,
                    vehicleLabel,
                    mileage,
                    suggestedOffer,
                    highMarketValue,
                    lowMarketValue
                }
            })
        );

        const results = await Promise.all(promises);
        return results.every(result => result === true);
    },

    /**
     * Get recent email history (last 15 emails sent)
     * This fetches from the email_notification_logs table in Supabase
     * If the table doesn't exist or RLS blocks access, it will return an empty array
     */
    async getRecentEmailHistory(limit: number = 15): Promise<any[]> {
        try {
            // Get current user session to ensure authenticated request
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                console.warn('[BrevoEmailService] No active session, cannot fetch email logs');
                return [];
            }

            // Try to fetch from email_notification_logs table with explicit headers
            const { data, error } = await supabase
                .from('email_notification_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                // Handle specific error cases
                if (error.code === '42P01') {
                    console.warn('[BrevoEmailService] Table email_notification_logs does not exist');
                } else if (error.message?.includes('apikey')) {
                    console.warn('[BrevoEmailService] API key error - this might be an RLS policy issue:', error);
                } else {
                    console.warn('[BrevoEmailService] Error fetching email logs:', error);
                }
                return [];
            }

            return data || [];
        } catch (err) {
            console.error('[BrevoEmailService] Exception fetching email history:', err);
            return [];
        }
    },

    /**
     * Send vehicle unavailable notification to client
     */
    async sendVehicleUnavailableEmail(params: {
        email: string;
        name: string;
        vehicleTitle: string;
    }): Promise<boolean> {
        return this.sendEmail({
            to: params.email,
            toName: params.name,
            subject: '⚠️ Actualización sobre tu Solicitud - Vehículo No Disponible',
            templateType: 'admin_notification' as any,
            templateData: {
                clientName: params.name,
                vehicleTitle: params.vehicleTitle,
                message: `Lamentamos informarte que el vehículo "${params.vehicleTitle}" que seleccionaste en tu solicitud ya no está disponible. Nuestro equipo se pondrá en contacto contigo para ofrecerte opciones similares o alternativas que se ajusten a tus necesidades.`
            }
        });
    },

    /**
     * Send valuation verification code to client
     */
    async sendValuationVerificationCode(
        clientEmail: string,
        clientName: string,
        verificationCode: string
    ): Promise<boolean> {
        return this.sendEmail({
            to: clientEmail,
            toName: clientName,
            subject: '🔐 Código de Verificación - TREFA',
            templateType: 'verification_code',
            templateData: {
                clientName,
                verificationCode,
                expiresIn: '15 minutos'
            }
        });
    },

    /**
     * Notify bank representative about new assigned application
     */
    async notifyBankRepNewAssignment(
        bankRepEmail: string,
        bankRepName: string,
        bankName: string,
        clientName: string,
        clientEmail: string,
        vehicleTitle: string | null,
        leadId: string
    ): Promise<boolean> {
        const leadUrl = `${window.location.origin}/escritorio/bancos/cliente/${leadId}`;

        return this.sendEmail({
            to: bankRepEmail,
            toName: bankRepName,
            subject: `🏦 Nueva Solicitud Asignada - ${bankName}`,
            templateType: 'admin_notification' as any,
            templateData: {
                clientName,
                clientEmail,
                vehicleTitle: vehicleTitle || 'No especificado',
                bankName,
                submittedAt: new Date().toISOString(),
                adminProfileUrl: leadUrl,
                message: `Se te ha asignado una nueva solicitud de financiamiento. Por favor, revisa los detalles y documentos del cliente.`
            }
        });
    },

    /**
     * Notify sales advisor about bank status update
     */
    async notifySalesAboutBankUpdate(
        salesEmail: string,
        salesName: string,
        clientName: string,
        bankName: string,
        newStatus: string,
        feedback: string | null,
        leadId: string
    ): Promise<boolean> {
        const leadUrl = `${window.location.origin}/escritorio/ventas/cliente/${leadId}`;

        return this.sendEmail({
            to: salesEmail,
            toName: salesName,
            subject: `🏦 Actualización de ${bankName} - ${clientName}`,
            templateType: 'admin_notification' as any,
            templateData: {
                clientName,
                bankName,
                newStatus,
                feedback: feedback || 'Sin comentarios adicionales',
                adminProfileUrl: leadUrl,
                message: `El banco ${bankName} ha actualizado el estado de la solicitud de ${clientName} a: ${newStatus}.${feedback ? ` Comentarios: ${feedback}` : ''}`
            }
        });
    },

    /**
     * Notify client about application status update from bank
     */
    async notifyClientBankDecision(
        clientEmail: string,
        clientName: string,
        bankName: string,
        decision: 'approved' | 'rejected' | 'pending_docs',
        vehicleTitle: string | null,
        applicationId: string
    ): Promise<boolean> {
        const statusUrl = `${window.location.origin}/escritorio/seguimiento/${applicationId}`;

        const subjects = {
            approved: `🎉 ¡Solicitud Aprobada por ${bankName}!`,
            rejected: `📋 Actualización de tu Solicitud - ${bankName}`,
            pending_docs: `📄 Documentos Adicionales Requeridos - ${bankName}`
        };

        const messages = {
            approved: `¡Felicidades! Tu solicitud de financiamiento ha sido aprobada por ${bankName}. Nuestro equipo se pondrá en contacto contigo para los siguientes pasos.`,
            rejected: `Lamentamos informarte que ${bankName} no pudo aprobar tu solicitud en este momento. Sin embargo, nuestro equipo trabajará contigo para explorar otras opciones.`,
            pending_docs: `${bankName} requiere documentos adicionales para procesar tu solicitud. Por favor, revisa los detalles en tu portal y carga los documentos necesarios.`
        };

        return this.sendEmail({
            to: clientEmail,
            toName: clientName,
            subject: subjects[decision],
            templateType: 'status_changed',
            templateData: {
                clientName,
                vehicleTitle,
                bankName,
                decision,
                message: messages[decision],
                statusUrl
            }
        });
    },

    /**
     * Notify admins about new bank representative registration
     */
    async notifyAdminsNewBankRep(
        bankRepName: string,
        bankRepEmail: string,
        bankName: string
    ): Promise<boolean> {
        const adminUrl = `${window.location.origin}/escritorio/admin/bancos`;

        const promises = ADMIN_EMAILS.map(adminEmail =>
            this.sendEmail({
                to: adminEmail,
                toName: 'Administrador TREFA',
                subject: `🏦 Nuevo Representante Bancario Registrado - ${bankName}`,
                templateType: 'admin_notification' as any,
                templateData: {
                    bankRepName,
                    bankRepEmail,
                    bankName,
                    submittedAt: new Date().toISOString(),
                    adminProfileUrl: adminUrl,
                    message: `Un nuevo representante de ${bankName} se ha registrado y está pendiente de aprobación.`
                }
            })
        );

        const results = await Promise.all(promises);
        return results.every(result => result === true);
    }
};
