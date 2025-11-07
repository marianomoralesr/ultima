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

export interface TrendComparisons {
    leadsChange: number;
    leadsChangePercent: number;
    applicationsChange: number;
    applicationsChangePercent: number;
    conversionChange: number;
    conversionChangePercent: number;
    approvalChange: number;
    approvalChangePercent: number;
}

export interface DashboardFilters {
    startDate?: Date;
    endDate?: Date;
    source?: 'all' | 'facebook' | 'google' | 'bot' | 'direct' | 'other';
    status?: 'all' | 'pending' | 'contacted' | 'uncontacted' | 'approved';
}

export class AnalyticsService {
    /**
     * Fetch comprehensive dashboard metrics
     * @param userId - If provided (sales role), filter by assigned sales rep
     * @param role - User role to determine data scope
     * @param filters - Optional filters for date range, source, and status
     */
    static async getDashboardMetrics(userId?: string, role?: string, filters?: DashboardFilters): Promise<DashboardMetrics> {
        try {
            const isAdmin = role === 'admin';
            const baseLeadQuery = supabase.from('profiles').select('*');
            const baseAppQuery = supabase.from('applications').select('*');

            // Filter by sales rep if not admin
            let leadQuery = isAdmin ? baseLeadQuery : baseLeadQuery.eq('asesor_asignado_id', userId);
            let appQuery = isAdmin ? baseAppQuery : baseAppQuery.eq('sales_user_id', userId);

            // Apply date filters if provided
            if (filters?.startDate) {
                leadQuery = leadQuery.gte('created_at', filters.startDate.toISOString());
                appQuery = appQuery.gte('created_at', filters.startDate.toISOString());
            }
            if (filters?.endDate) {
                leadQuery = leadQuery.lte('created_at', filters.endDate.toISOString());
                appQuery = appQuery.lte('created_at', filters.endDate.toISOString());
            }

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

            let leads = leadsResult.data || [];
            let applications = applicationsResult.data || [];
            const reminders = remindersResult.data || [];

            // Apply source filter if provided
            if (filters?.source && filters.source !== 'all') {
                leads = leads.filter(lead => {
                    const source = lead.source?.toLowerCase() || '';
                    const metadata = lead.metadata?.utm_source?.toLowerCase() || '';

                    switch (filters.source) {
                        case 'facebook':
                            return source.includes('facebook') || source.includes('fb') || metadata.includes('facebook');
                        case 'google':
                            return source.includes('google') || metadata.includes('google');
                        case 'bot':
                            return source.includes('bot') || source.includes('whatsapp');
                        case 'direct':
                            return source.includes('direct') || source === 'Portal TREFA' || source === 'TREFA.mx';
                        case 'other':
                            return !source.includes('facebook') && !source.includes('fb') &&
                                   !source.includes('google') && !source.includes('bot') &&
                                   !source.includes('whatsapp') && !source.includes('direct') &&
                                   source !== 'Portal TREFA' && source !== 'TREFA.mx';
                        default:
                            return true;
                    }
                });
            }

            // Apply status filter if provided
            if (filters?.status && filters.status !== 'all') {
                switch (filters.status) {
                    case 'contacted':
                        leads = leads.filter(lead => lead.contactado === true);
                        break;
                    case 'uncontacted':
                        leads = leads.filter(lead => !lead.contactado);
                        break;
                    case 'pending':
                        applications = applications.filter(app => app.status === 'pending' || app.status === 'submitted');
                        break;
                    case 'approved':
                        applications = applications.filter(app => app.status === 'approved');
                        break;
                }
            }

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

    /**
     * Get trend comparisons (current period vs previous period)
     * @param userId - If provided (sales role), filter by assigned sales rep
     * @param role - User role to determine data scope
     * @param days - Number of days to compare (default: 7)
     */
    static async getTrendComparisons(userId?: string, role?: string, days: number = 7): Promise<TrendComparisons> {
        try {
            const isAdmin = role === 'admin';

            // Calculate date ranges
            const now = new Date();
            const currentPeriodStart = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
            const previousPeriodStart = new Date(now.getTime() - (2 * days * 24 * 60 * 60 * 1000));
            const previousPeriodEnd = currentPeriodStart;

            // Fetch current period data
            const currentLeadQuery = supabase
                .from('profiles')
                .select('id, created_at')
                .gte('created_at', currentPeriodStart.toISOString())
                .lte('created_at', now.toISOString());

            const currentAppQuery = supabase
                .from('applications')
                .select('id, status, created_at')
                .gte('created_at', currentPeriodStart.toISOString())
                .lte('created_at', now.toISOString());

            // Fetch previous period data
            const previousLeadQuery = supabase
                .from('profiles')
                .select('id, created_at')
                .gte('created_at', previousPeriodStart.toISOString())
                .lte('created_at', previousPeriodEnd.toISOString());

            const previousAppQuery = supabase
                .from('applications')
                .select('id, status, created_at')
                .gte('created_at', previousPeriodStart.toISOString())
                .lte('created_at', previousPeriodEnd.toISOString());

            // Apply role-based filtering
            if (!isAdmin && userId) {
                currentLeadQuery.eq('asesor_asignado_id', userId);
                currentAppQuery.eq('sales_user_id', userId);
                previousLeadQuery.eq('asesor_asignado_id', userId);
                previousAppQuery.eq('sales_user_id', userId);
            }

            // Execute queries in parallel
            const [
                currentLeadsResult,
                currentAppsResult,
                previousLeadsResult,
                previousAppsResult
            ] = await Promise.all([
                currentLeadQuery,
                currentAppQuery,
                previousLeadQuery,
                previousAppQuery
            ]);

            const currentLeads = currentLeadsResult.data || [];
            const currentApps = currentAppsResult.data || [];
            const previousLeads = previousLeadsResult.data || [];
            const previousApps = previousAppsResult.data || [];

            // Calculate metrics
            const currentLeadsCount = currentLeads.length;
            const previousLeadsCount = previousLeads.length;
            const currentAppsCount = currentApps.length;
            const previousAppsCount = previousApps.length;

            const currentConversion = currentLeadsCount > 0
                ? (currentAppsCount / currentLeadsCount) * 100
                : 0;
            const previousConversion = previousLeadsCount > 0
                ? (previousAppsCount / previousLeadsCount) * 100
                : 0;

            const currentApproved = currentApps.filter(app => app.status === 'approved').length;
            const previousApproved = previousApps.filter(app => app.status === 'approved').length;

            const currentApprovalRate = currentAppsCount > 0
                ? (currentApproved / currentAppsCount) * 100
                : 0;
            const previousApprovalRate = previousAppsCount > 0
                ? (previousApproved / previousAppsCount) * 100
                : 0;

            // Calculate changes and percentages
            const calculateChange = (current: number, previous: number) => {
                const change = current - previous;
                const percentChange = previous > 0 ? ((change / previous) * 100) : 0;
                return { change, percentChange };
            };

            const leadsChange = calculateChange(currentLeadsCount, previousLeadsCount);
            const appsChange = calculateChange(currentAppsCount, previousAppsCount);
            const conversionChange = calculateChange(currentConversion, previousConversion);
            const approvalChange = calculateChange(currentApprovalRate, previousApprovalRate);

            return {
                leadsChange: leadsChange.change,
                leadsChangePercent: Math.round(leadsChange.percentChange * 10) / 10,
                applicationsChange: appsChange.change,
                applicationsChangePercent: Math.round(appsChange.percentChange * 10) / 10,
                conversionChange: conversionChange.change,
                conversionChangePercent: Math.round(conversionChange.percentChange * 10) / 10,
                approvalChange: approvalChange.change,
                approvalChangePercent: Math.round(approvalChange.percentChange * 10) / 10
            };

        } catch (error) {
            console.error('[AnalyticsService] Error fetching trend comparisons:', error);
            return {
                leadsChange: 0,
                leadsChangePercent: 0,
                applicationsChange: 0,
                applicationsChangePercent: 0,
                conversionChange: 0,
                conversionChangePercent: 0,
                approvalChange: 0,
                approvalChangePercent: 0
            };
        }
    }
}
