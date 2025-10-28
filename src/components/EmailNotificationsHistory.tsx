import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface EmailNotificationsHistoryProps {
    userId: string;
}

const EmailNotificationsHistory: React.FC<EmailNotificationsHistoryProps> = ({ userId }) => {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_email_notifications')
                    .select('*')
                    .eq('user_id', userId)
                    .order('sent_at', { ascending: false });

                if (error) throw error;
                setEmails(data || []);
            } catch (error) {
                console.error('Error fetching email notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmails();
    }, [userId]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sent':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-600" />;
            default:
                return <Clock className="w-4 h-4 text-gray-600" />;
        }
    };

    const getEmailTypeLabel = (type: string) => {
        const labels: { [key: string]: string } = {
            'incomplete_application': 'Aplicación Incompleta',
            'incomplete_profile': 'Perfil Incompleto',
            'agent_digest': 'Resumen para Agente',
            'welcome': 'Bienvenida',
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Historial de Notificaciones
                </h2>
                <p className="text-sm text-gray-500 text-center py-4">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Historial de Notificaciones ({emails.length})
            </h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
                {emails.length > 0 ? emails.map(email => (
                    <div key={email.id} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-start gap-3">
                            {getStatusIcon(email.status)}
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-semibold text-gray-800">{email.subject}</p>
                                    <span className="text-xs text-gray-500">{new Date(email.sent_at).toLocaleDateString('es-MX')}</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{getEmailTypeLabel(email.email_type)}</p>
                            </div>
                        </div>
                    </div>
                )) : <p className="text-sm text-gray-500 text-center py-4">No se han enviado notificaciones.</p>}
            </div>
        </div>
    );
};

export default EmailNotificationsHistory;