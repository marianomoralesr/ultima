import { supabase } from '../../supabaseClient';

export interface DocumentUploadMetrics {
  totalApplicationsWithTokens: number;
  applicationsWithActivity: number;
  completeApplications: number;
  incompleteApplications: number;
  averageDocumentsPerApplication: number;
  completionRate: number;
  activityRate: number;
  recentApplications: ApplicationDocumentStatus[];
  documentTypeStats: DocumentTypeStats[];
  documentsUploadedOverTime: TimeSeriesData[];
}

export interface ApplicationDocumentStatus {
  id: string;
  user_id: string;
  public_upload_token: string | null;
  created_at: string;
  status: string;
  user_email: string | null;
  user_name: string | null;
  car_info: any;
  total_documents: number;
  documents_uploaded: DocumentCount[];
  completion_percentage: number;
  is_complete: boolean;
  last_upload_at: string | null;
}

interface DocumentCount {
  document_type: string;
  count: number;
}

interface DocumentTypeStats {
  document_type: string;
  total_uploaded: number;
  percentage: number;
}

interface TimeSeriesData {
  date: string;
  count: number;
}

const REQUIRED_DOCUMENTS = [
  'ine_front',
  'ine_back',
  'proof_address',
  'proof_income',
  'constancia_fiscal'
];

export const DocumentUploadAnalyticsService = {
  async getMetrics(dateRange?: { start: Date; end: Date }): Promise<DocumentUploadMetrics> {
    try {
      // Get all applications with public upload tokens
      let applicationsQuery = supabase
        .from('financing_applications')
        .select(`
          id,
          user_id,
          public_upload_token,
          created_at,
          status,
          car_info,
          profiles!inner(email, first_name, last_name)
        `)
        .not('public_upload_token', 'is', null);

      if (dateRange) {
        applicationsQuery = applicationsQuery
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { data: applications, error: appsError } = await applicationsQuery;

      if (appsError) throw appsError;

      const totalApplicationsWithTokens = applications?.length || 0;

      if (!applications || applications.length === 0) {
        return this.getEmptyMetrics();
      }

      // Get all uploaded documents for these applications
      const applicationIds = applications.map(app => app.id);
      const { data: documents, error: docsError } = await supabase
        .from('uploaded_documents')
        .select('*')
        .in('application_id', applicationIds);

      if (docsError) throw docsError;

      // Calculate metrics
      const applicationDocumentStatus: ApplicationDocumentStatus[] = applications.map(app => {
        const appDocs = documents?.filter(doc => doc.application_id === app.id) || [];

        // Count documents by type
        const docCounts: Record<string, number> = {};
        REQUIRED_DOCUMENTS.forEach(type => {
          docCounts[type] = appDocs.filter(d => d.document_type === type).length;
        });

        const documents_uploaded = Object.entries(docCounts).map(([document_type, count]) => ({
          document_type,
          count
        }));

        const total_documents = appDocs.length;
        const requiredDocsUploaded = REQUIRED_DOCUMENTS.filter(type => docCounts[type] > 0).length;
        const completion_percentage = (requiredDocsUploaded / REQUIRED_DOCUMENTS.length) * 100;
        const is_complete = requiredDocsUploaded === REQUIRED_DOCUMENTS.length;

        const lastUpload = appDocs.length > 0
          ? appDocs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;

        const profile = (app as any).profiles;
        const user_name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null;

        return {
          id: app.id,
          user_id: app.user_id,
          public_upload_token: app.public_upload_token,
          created_at: app.created_at,
          status: app.status,
          user_email: profile?.email || null,
          user_name,
          car_info: app.car_info,
          total_documents,
          documents_uploaded,
          completion_percentage: Math.round(completion_percentage),
          is_complete,
          last_upload_at: lastUpload
        };
      });

      const applicationsWithActivity = applicationDocumentStatus.filter(app => app.total_documents > 0).length;
      const completeApplications = applicationDocumentStatus.filter(app => app.is_complete).length;
      const incompleteApplications = totalApplicationsWithTokens - completeApplications;

      const totalDocuments = documents?.length || 0;
      const averageDocumentsPerApplication = totalApplicationsWithTokens > 0
        ? totalDocuments / totalApplicationsWithTokens
        : 0;

      const completionRate = totalApplicationsWithTokens > 0
        ? (completeApplications / totalApplicationsWithTokens) * 100
        : 0;

      const activityRate = totalApplicationsWithTokens > 0
        ? (applicationsWithActivity / totalApplicationsWithTokens) * 100
        : 0;

      // Document type statistics
      const documentTypeCounts: Record<string, number> = {};
      REQUIRED_DOCUMENTS.forEach(type => {
        documentTypeCounts[type] = documents?.filter(d => d.document_type === type).length || 0;
      });

      const documentTypeStats: DocumentTypeStats[] = Object.entries(documentTypeCounts).map(([document_type, total_uploaded]) => ({
        document_type,
        total_uploaded,
        percentage: totalDocuments > 0 ? (total_uploaded / totalDocuments) * 100 : 0
      }));

      // Time series data for documents uploaded over time
      const documentsUploadedOverTime = this.getTimeSeriesData(documents || []);

      // Sort applications by most recent activity
      const recentApplications = applicationDocumentStatus.sort((a, b) => {
        const aTime = a.last_upload_at ? new Date(a.last_upload_at).getTime() : new Date(a.created_at).getTime();
        const bTime = b.last_upload_at ? new Date(b.last_upload_at).getTime() : new Date(b.created_at).getTime();
        return bTime - aTime;
      });

      return {
        totalApplicationsWithTokens,
        applicationsWithActivity,
        completeApplications,
        incompleteApplications,
        averageDocumentsPerApplication,
        completionRate,
        activityRate,
        recentApplications,
        documentTypeStats,
        documentsUploadedOverTime
      };
    } catch (error) {
      console.error('Error getting document upload metrics:', error);
      throw error;
    }
  },

  getTimeSeriesData(documents: any[]): TimeSeriesData[] {
    const dateCounts: Record<string, number> = {};

    documents.forEach(doc => {
      const date = new Date(doc.created_at).toISOString().split('T')[0];
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    const timeSeries = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Fill in missing dates with 0 if needed (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filledTimeSeries: TimeSeriesData[] = [];
    const currentDate = new Date(thirtyDaysAgo);

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = timeSeries.find(d => d.date === dateStr);
      filledTimeSeries.push({
        date: dateStr,
        count: existingData?.count || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return filledTimeSeries;
  },

  getEmptyMetrics(): DocumentUploadMetrics {
    return {
      totalApplicationsWithTokens: 0,
      applicationsWithActivity: 0,
      completeApplications: 0,
      incompleteApplications: 0,
      averageDocumentsPerApplication: 0,
      completionRate: 0,
      activityRate: 0,
      recentApplications: [],
      documentTypeStats: [],
      documentsUploadedOverTime: []
    };
  }
};
