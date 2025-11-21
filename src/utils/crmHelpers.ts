/**
 * Shared CRM utilities for status management, document validation, and UI helpers
 * This consolidates logic previously duplicated across SimpleCRMPage, AdminLeadsDashboardPage, and SalesLeadsDashboardPage
 */

import { APPLICATION_STATUS } from '../constants/applicationStatus';

/**
 * Check if application has all required documents
 * Now uses standardized document type names from the upload service
 */
export const hasAllDocuments = (documents: any[]): boolean => {
    if (!documents || documents.length === 0) return false;

    // Standardized document type names (matching DocumentService standardization)
    const STANDARD_TYPES = {
        INE_FRONT: 'INE Front',
        INE_BACK: 'INE Back',
        PROOF_ADDRESS: 'Comprobante Domicilio',
        PROOF_INCOME: 'Comprobante Ingresos'
    };

    // Normalize for comparison (case-insensitive, remove extra spaces)
    const normalizeType = (type: string) => type.toLowerCase().trim().replace(/\s+/g, ' ');

    const availableTypes = documents.map(doc => normalizeType(doc.document_type || ''));

    // Check for each required document type
    const hasINEFront = availableTypes.includes(normalizeType(STANDARD_TYPES.INE_FRONT));
    const hasINEBack = availableTypes.includes(normalizeType(STANDARD_TYPES.INE_BACK));
    const hasProofOfAddress = availableTypes.includes(normalizeType(STANDARD_TYPES.PROOF_ADDRESS));
    const hasProofOfIncome = availableTypes.includes(normalizeType(STANDARD_TYPES.PROOF_INCOME));

    const allDocsPresent = hasINEFront && hasINEBack && hasProofOfAddress && hasProofOfIncome;

    // Debug logging
    if (!allDocsPresent && documents.length > 0) {
        console.log('[hasAllDocuments] Document check:', {
            total: documents.length,
            types: documents.map(d => d.document_type),
            normalized: availableTypes,
            checks: {
                hasINEFront,
                hasINEBack,
                hasProofOfAddress,
                hasProofOfIncome
            }
        });
    }

    return allDocsPresent;
};

/**
 * Get correct status based on documents
 * Returns the database status as-is, trusting manual status changes
 * Document validation is now informational only and doesn't override status
 */
export const getCorrectApplicationStatus = (
    status: string,
    documents: any[],
    isSubmitted: boolean
): string => {
    // Trust the database status - don't override based on documents
    // The status should be controlled by user actions and system workflows, not frontend logic
    return status;
};

/**
 * Get Spanish label for application status
 */
export const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        [APPLICATION_STATUS.COMPLETA]: 'Completa',
        [APPLICATION_STATUS.FALTAN_DOCUMENTOS]: 'Faltan Docs',
        [APPLICATION_STATUS.EN_REVISION]: 'En Revisión',
        [APPLICATION_STATUS.APROBADA]: 'Aprobada',
        [APPLICATION_STATUS.RECHAZADA]: 'Rechazada',
        [APPLICATION_STATUS.DRAFT]: 'Borrador',
        // Legacy status mappings
        [APPLICATION_STATUS.SUBMITTED]: 'Completa',
        [APPLICATION_STATUS.REVIEWING]: 'En Revisión',
        [APPLICATION_STATUS.PENDING_DOCS]: 'Faltan Docs',
        [APPLICATION_STATUS.APPROVED]: 'Aprobada',
        [APPLICATION_STATUS.IN_REVIEW]: 'En Revisión',
        'rejected': 'Rechazada'
    };
    return labels[status] || status;
};

/**
 * Get color classes for application status
 */
export const getStatusColor = (status: string): { bg: string; text: string; border: string; dot: string } => {
    const colors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
        [APPLICATION_STATUS.COMPLETA]: {
            bg: 'bg-green-100',
            text: 'text-green-800',
            border: 'border-green-300',
            dot: 'bg-green-500'
        },
        [APPLICATION_STATUS.FALTAN_DOCUMENTOS]: {
            bg: 'bg-amber-100',
            text: 'text-amber-800',
            border: 'border-amber-300',
            dot: 'bg-amber-500'
        },
        [APPLICATION_STATUS.EN_REVISION]: {
            bg: 'bg-purple-100',
            text: 'text-purple-800',
            border: 'border-purple-300',
            dot: 'bg-purple-500'
        },
        [APPLICATION_STATUS.APROBADA]: {
            bg: 'bg-green-100',
            text: 'text-green-800',
            border: 'border-green-300',
            dot: 'bg-green-500'
        },
        [APPLICATION_STATUS.RECHAZADA]: {
            bg: 'bg-red-100',
            text: 'text-red-800',
            border: 'border-red-300',
            dot: 'bg-red-500'
        },
        [APPLICATION_STATUS.DRAFT]: {
            bg: 'bg-gray-100',
            text: 'text-gray-600',
            border: 'border-gray-300',
            dot: 'bg-gray-400'
        },
        // Legacy status mappings
        [APPLICATION_STATUS.SUBMITTED]: {
            bg: 'bg-blue-100',
            text: 'text-blue-800',
            border: 'border-blue-300',
            dot: 'bg-blue-500'
        },
        [APPLICATION_STATUS.REVIEWING]: {
            bg: 'bg-purple-100',
            text: 'text-purple-800',
            border: 'border-purple-300',
            dot: 'bg-purple-500'
        },
        [APPLICATION_STATUS.PENDING_DOCS]: {
            bg: 'bg-amber-100',
            text: 'text-amber-800',
            border: 'border-amber-300',
            dot: 'bg-amber-500'
        },
        [APPLICATION_STATUS.APPROVED]: {
            bg: 'bg-green-100',
            text: 'text-green-800',
            border: 'border-green-300',
            dot: 'bg-green-500'
        },
        [APPLICATION_STATUS.IN_REVIEW]: {
            bg: 'bg-purple-100',
            text: 'text-purple-800',
            border: 'border-purple-300',
            dot: 'bg-purple-500'
        },
        'rejected': {
            bg: 'bg-red-100',
            text: 'text-red-800',
            border: 'border-red-300',
            dot: 'bg-red-500'
        }
    };
    return colors[status] || {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-300',
        dot: 'bg-gray-400'
    };
};

/**
 * Get emoji for application status (for filters and quick view)
 */
export const getStatusEmoji = (status: string): string => {
    const emojis: Record<string, string> = {
        [APPLICATION_STATUS.COMPLETA]: '✅',
        [APPLICATION_STATUS.FALTAN_DOCUMENTOS]: '⚠️',
        [APPLICATION_STATUS.EN_REVISION]: '👀',
        [APPLICATION_STATUS.APROBADA]: '🎉',
        [APPLICATION_STATUS.RECHAZADA]: '❌',
        [APPLICATION_STATUS.DRAFT]: '📝',
        // Legacy mappings
        [APPLICATION_STATUS.SUBMITTED]: '✅',
        [APPLICATION_STATUS.REVIEWING]: '👀',
        [APPLICATION_STATUS.PENDING_DOCS]: '⚠️',
        [APPLICATION_STATUS.APPROVED]: '🎉',
        [APPLICATION_STATUS.IN_REVIEW]: '👀',
        'rejected': '❌'
    };
    return emojis[status] || '❓';
};

/**
 * Determine if a lead needs action
 * Used for priority highlighting
 */
export const leadNeedsAction = (
    contactado: boolean,
    correctedStatus: string | null
): boolean => {
    return !contactado ||
           correctedStatus === APPLICATION_STATUS.FALTAN_DOCUMENTOS ||
           correctedStatus === APPLICATION_STATUS.PENDING_DOCS ||
           correctedStatus === APPLICATION_STATUS.COMPLETA ||
           correctedStatus === APPLICATION_STATUS.SUBMITTED;
};

/**
 * Format date to relative time
 */
export const formatRelativeTime = (dateString: string | null): string => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return formatDate(dateString);
};

/**
 * Format date to readable format
 */
export const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Process leads to add corrected status and priority flags
 */
export const processLeads = (leads: any[]): any[] => {
    return leads.map(lead => {
        // Infer isSubmitted from status (any non-draft status means it was submitted)
        const isSubmitted = lead.latest_app_status && lead.latest_app_status !== APPLICATION_STATUS.DRAFT && lead.latest_app_status !== 'draft';

        const correctStatus = lead.latest_app_status
            ? getCorrectApplicationStatus(
                lead.latest_app_status,
                lead.documents || [],
                isSubmitted
              )
            : null;

        const needsAction = leadNeedsAction(lead.contactado, correctStatus);

        return {
            ...lead,
            correctedStatus: correctStatus,
            needsAction,
            hasBankProfile: !!lead.bank_profile_data
        };
    });
};
