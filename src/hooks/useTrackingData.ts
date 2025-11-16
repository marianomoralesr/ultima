// React Query hooks for tracking data

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';
import { TrackingEvent, FinancingApplication, TrackingDashboardMetrics } from '../types/tracking';
import { calculateTrackingDashboardMetrics } from '../lib/trackingAnalytics';
import { subDays } from 'date-fns';

/**
 * Fetch all tracking events within date range
 */
export function useTrackingEvents(
  startDate?: Date,
  endDate?: Date
): UseQueryResult<TrackingEvent[], Error> {
  return useQuery({
    queryKey: ['tracking-events', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TrackingEvent[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time data
    staleTime: 15000
  });
}

/**
 * Fetch financing applications
 */
export function useFinancingApplications(): UseQueryResult<FinancingApplication[], Error> {
  return useQuery({
    queryKey: ['financing-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financing_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FinancingApplication[];
    },
    refetchInterval: 30000,
    staleTime: 15000
  });
}

/**
 * Fetch complete tracking dashboard metrics
 */
export function useTrackingDashboardMetrics(
  startDate?: Date,
  endDate?: Date
): UseQueryResult<TrackingDashboardMetrics, Error> {
  const defaultStartDate = startDate || subDays(new Date(), 30);
  const defaultEndDate = endDate || new Date();

  return useQuery({
    queryKey: ['tracking-dashboard-metrics', defaultStartDate.toISOString(), defaultEndDate.toISOString()],
    queryFn: async () => {
      // Fetch both tracking events and applications
      const [eventsResult, appsResult] = await Promise.all([
        supabase
          .from('tracking_events')
          .select('*')
          .gte('created_at', defaultStartDate.toISOString())
          .lte('created_at', defaultEndDate.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('financing_applications')
          .select('*')
          .order('created_at', { ascending: false})
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (appsResult.error) throw appsResult.error;

      const events = eventsResult.data as TrackingEvent[];
      const applications = appsResult.data as FinancingApplication[];

      // Calculate all metrics
      return calculateTrackingDashboardMetrics(events, applications);
    },
    refetchInterval: 30000,
    staleTime: 15000
  });
}

/**
 * Fetch events for a specific campaign
 */
export function useCampaignEvents(
  campaign: string
): UseQueryResult<TrackingEvent[], Error> {
  return useQuery({
    queryKey: ['campaign-events', campaign],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('utm_campaign', campaign)
        .order('created_at', { ascending: false});

      if (error) throw error;
      return data as TrackingEvent[];
    },
    enabled: !!campaign,
    refetchInterval: 60000,
    staleTime: 30000
  });
}

/**
 * Fetch events for a specific source
 */
export function useSourceEvents(
  source: string,
  medium?: string
): UseQueryResult<TrackingEvent[], Error> {
  return useQuery({
    queryKey: ['source-events', source, medium],
    queryFn: async () => {
      let query = supabase
        .from('tracking_events')
        .select('*')
        .eq('utm_source', source)
        .order('created_at', { ascending: false });

      if (medium) {
        query = query.eq('utm_medium', medium);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TrackingEvent[];
    },
    enabled: !!source,
    refetchInterval: 60000,
    staleTime: 30000
  });
}
