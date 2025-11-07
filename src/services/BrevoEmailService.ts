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
    templateType: 'application_submitted' | 'status_changed' | 'document_status_changed' | 'admin_notification' | 'valuation_notification';
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
            subject: '✅ Solicitud de Financiamiento Recibida - TREFA',
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
            subject: `📋 Actualización de tu Solicitud - TREFA`,
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
     * If the table doesn't exist, it will return an empty array
     */
    async getRecentEmailHistory(limit: number = 15): Promise<any[]> {
        try {
            // Try to fetch from email_notification_logs table
            const { data, error } = await supabase
                .from('email_notification_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.warn('[BrevoEmailService] No email_notification_logs table found or error fetching:', error);
                return [];
            }

            return data || [];
        } catch (err) {
            console.error('[BrevoEmailService] Exception fetching email history:', err);
            return [];
        }
    }
};
