import { supabase } from '../../supabaseClient';

export interface DashboardMetrics {
    // Application Metrics
    totalApplications: number;
    pendingApplications: number;
    processedApplications: number;
    approvedApplications: number;

    // Lead Metrics
    totalLeads: number;
    contactedLeads: number;
    uncontactedLeads: number;

    // Source Attribution
    sourceBreakdown: {
        facebook: number;
        google: number;
        bot: number;
        other: number;
        direct: number;
    };

    // Performance Metrics
    conversionRate: number;
    approvalRate: number;

    // Recent Activity
    recentApplications: any[];
    recentLeads: any[];

    // To-dos and Actions
    pendingReminders: number;
    tasksToday: number;
}

export class AnalyticsService {
    /**
     * Fetch comprehensive dashboard metrics
     * @param userId - If provided (sales role), filter by assigned sales rep
     * @param role - User role to determine data scope
     */
    static async getDashboardMetrics(userId?: string, role?: string): Promise<DashboardMetrics> {
        try {
            const isAdmin = role === 'admin';
            const baseLeadQuery = supabase.from('profiles').select('*');
            const baseAppQuery = supabase.from('applications').select('*');

            // Filter by sales rep if not admin
            const leadQuery = isAdmin ? baseLeadQuery : baseLeadQuery.eq('asesor_asignado_id', userId);
            const appQuery = isAdmin ? baseAppQuery : baseAppQuery.eq('sales_user_id', userId);

            // Fetch all data in parallel
            const [
                leadsResult,
                applicationsResult,
                remindersResult
            ] = await Promise.all([
                leadQuery,
                appQuery,
                supabase
                    .from('reminders')
                    .select('*')
                    .eq(isAdmin ? 'id' : 'agent_id', isAdmin ? undefined : userId)
                    .gte('reminder_date', new Date().toISOString())
                    .order('reminder_date', { ascending: true })
            ]);

            const leads = leadsResult.data || [];
            const applications = applicationsResult.data || [];
            const reminders = remindersResult.data || [];

            // Calculate application metrics
            const pendingApps = applications.filter(app =>
                app.status === 'pending' || app.status === 'submitted'
            );
            const processedApps = applications.filter(app =>
                app.status === 'processed' || app.status === 'reviewing'
            );
            const approvedApps = applications.filter(app =>
                app.status === 'approved'
            );

            // Calculate lead metrics
            const contactedLeads = leads.filter(lead => lead.contactado === true);
            const uncontactedLeads = leads.filter(lead => !lead.contactado);

            // Source attribution
            const sourceBreakdown = {
                facebook: leads.filter(l =>
                    l.source?.toLowerCase().includes('facebook') ||
                    l.source?.toLowerCase().includes('fb') ||
                    l.metadata?.utm_source?.includes('facebook')
                ).length,
                google: leads.filter(l =>
                    l.source?.toLowerCase().includes('google') ||
                    l.metadata?.utm_source?.includes('google')
                ).length,
                bot: leads.filter(l =>
                    l.source?.toLowerCase().includes('bot') ||
                    l.source?.toLowerCase().includes('whatsapp')
                ).length,
                direct: leads.filter(l =>
                    l.source?.toLowerCase().includes('direct') ||
                    l.source === 'Portal TREFA' ||
                    l.source === 'TREFA.mx'
                ).length,
                other: 0
            };

            // Calculate "other" sources
            sourceBreakdown.other = leads.length - (
                sourceBreakdown.facebook +
                sourceBreakdown.google +
                sourceBreakdown.bot +
                sourceBreakdown.direct
            );

            // Calculate rates
            const conversionRate = leads.length > 0
                ? (applications.length / leads.length) * 100
                : 0;

            const approvalRate = applications.length > 0
                ? (approvedApps.length / applications.length) * 100
                : 0;

            // Get recent activity (last 10)
            const recentApplications = applications
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10);

            const recentLeads = leads
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10);

            // Tasks/reminders for today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const tasksToday = reminders.filter(r => {
                const reminderDate = new Date(r.reminder_date);
                return reminderDate >= today && reminderDate < tomorrow;
            }).length;

            return {
                totalApplications: applications.length,
                pendingApplications: pendingApps.length,
                processedApplications: processedApps.length,
                approvedApplications: approvedApps.length,

                totalLeads: leads.length,
                contactedLeads: contactedLeads.length,
                uncontactedLeads: uncontactedLeads.length,

                sourceBreakdown,

                conversionRate: Math.round(conversionRate * 10) / 10,
                approvalRate: Math.round(approvalRate * 10) / 10,

                recentApplications,
                recentLeads,

                pendingReminders: reminders.length,
                tasksToday
            };

        } catch (error) {
            console.error('[AnalyticsService] Error fetching dashboard metrics:', error);
            throw error;
        }
    }

    /**
     * Get time-series data for charts (last 30 days)
     */
    static async getTimeSeriesData(userId?: string, role?: string): Promise<{
        labels: string[];
        leadsData: number[];
        applicationsData: number[];
    }> {
        try {
            const isAdmin = role === 'admin';
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const leadQuery = supabase
                .from('profiles')
                .select('created_at')
                .gte('created_at', thirtyDaysAgo.toISOString());

            const appQuery = supabase
                .from('applications')
                .select('created_at')
                .gte('created_at', thirtyDaysAgo.toISOString());

            if (!isAdmin && userId) {
                leadQuery.eq('asesor_asignado_id', userId);
                appQuery.eq('sales_user_id', userId);
            }

            const [leadsResult, appsResult] = await Promise.all([leadQuery, appQuery]);

            const leads = leadsResult.data || [];
            const apps = appsResult.data || [];

            // Group by date
            const dateMap = new Map<string, { leads: number; apps: number }>();

            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(date.getDate() - (29 - i));
                const dateStr = date.toISOString().split('T')[0];
                dateMap.set(dateStr, { leads: 0, apps: 0 });
            }

            leads.forEach(lead => {
                const dateStr = lead.created_at.split('T')[0];
                if (dateMap.has(dateStr)) {
                    dateMap.get(dateStr)!.leads++;
                }
            });

            apps.forEach(app => {
                const dateStr = app.created_at.split('T')[0];
                if (dateMap.has(dateStr)) {
                    dateMap.get(dateStr)!.apps++;
                }
            });

            const labels: string[] = [];
            const leadsData: number[] = [];
            const applicationsData: number[] = [];

            Array.from(dateMap.entries()).forEach(([date, data]) => {
                labels.push(new Date(date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }));
                leadsData.push(data.leads);
                applicationsData.push(data.apps);
            });

            return { labels, leadsData, applicationsData };

        } catch (error) {
            console.error('[AnalyticsService] Error fetching time series data:', error);
            return { labels: [], leadsData: [], applicationsData: [] };
        }
    }
}
