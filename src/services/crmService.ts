import { CRMLead, CRMActivity, CRMDashboardStats } from '../types/crm';
import { OfflineQueueService } from './offlineQueueService';

export class CRMService {
  /**
   * Get CRM dashboard overview stats
   */
  static async getDashboardStats(businessId?: string | null): Promise<CRMDashboardStats> {
    try {
      let url = '/api/crm/dashboard';
      if (businessId) {
        url += `?business_id=${encodeURIComponent(businessId)}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return data.stats;
    } catch (error) {
      console.error('CRMService: Error loading dashboard stats:', error);
      return {
        totalLeads: 0,
        hotLeads: 0,
        pendingFollowup: 0,
        closedDeals: 0,
        totalEstimatedRevenue: 0,
        conversionRate: 0,
        upcomingFollowup: 0
      };
    }
  }

  /**
   * Get all leads
   */
  static async getLeads(businessId?: string | null): Promise<CRMLead[]> {
    let serverLeads: CRMLead[] = [];
    try {
      let url = '/api/crm/leads';
      if (businessId) {
        url += `?business_id=${encodeURIComponent(businessId)}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        serverLeads = data.data || [];
      }
    } catch (error) {
      console.error('CRMService: Error loading leads from server:', error);
    }

    try {
      const queue = await OfflineQueueService.getQueue();
      const createDrafts = queue
        .filter(item => item.action === 'create_crm_lead')
        .map(item => {
          const leadData = item.payload;
          const leadDraft: CRMLead = {
            id: item.id,
            business_id: businessId,
            lead_name: leadData.lead_name,
            company_name: leadData.company_name,
            phone: leadData.phone,
            email: leadData.email,
            source: leadData.source,
            notes: leadData.notes,
            pipeline_stage: leadData.pipeline_stage,
            estimated_value: Number(leadData.estimated_value) || 0,
            lead_score: 50,
            interest_level: leadData.interest_level || 'Warm',
            status: leadData.status || 'Active',
            created_at: new Date(item.timestamp).toISOString(),
            isOfflineDraft: true,
            syncStatus: item.syncStatus
          };
          return leadDraft;
        });

      // Blend local queue updates (dragging columns) to server leads in-memory
      const updateDrafts = queue.filter(item => item.action === 'update_crm_stage');
      serverLeads = serverLeads.map(lead => {
        const matchingUpdates = updateDrafts.filter(up => up.payload.id === lead.id);
        if (matchingUpdates.length > 0) {
          const consolidatedUpdates = matchingUpdates.reduce((acc, cur) => ({ ...acc, ...cur.payload.updates }), {});
          return {
            ...lead,
            ...consolidatedUpdates,
            isOfflineDraft: true,
            syncStatus: 'pending' as const
          };
        }
        return lead;
      });

      return [...createDrafts, ...serverLeads];
    } catch (err) {
      console.error('CRMService: Error blending offline queue:', err);
      return serverLeads;
    }
  }


  /**
   * Get lead by ID with its activities
   */
  static async getLeadById(id: string): Promise<{ lead: CRMLead; activities: CRMActivity[] } | null> {
    try {
      const response = await fetch(`/api/crm/leads/${encodeURIComponent(id)}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return {
        lead: data.data,
        activities: data.activities || []
      };
    } catch (error) {
      console.error(`CRMService: Error loading lead with id ${id}:`, error);
      return null;
    }
  }

  /**
   * Create a new lead
   */
  static async createLead(lead: Omit<CRMLead, 'id' | 'lead_score' | 'created_at' | 'updated_at'>): Promise<CRMLead | null> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      console.log('Device is offline. Safe-enqueuing Lead draft in-memory.');
      const item = await OfflineQueueService.enqueue('create_crm_lead', lead);
      const draft: CRMLead = {
        id: item.id,
        lead_name: lead.lead_name,
        company_name: lead.company_name,
        phone: lead.phone,
        email: lead.email,
        source: lead.source,
        notes: lead.notes,
        pipeline_stage: lead.pipeline_stage,
        estimated_value: Number(lead.estimated_value) || 0,
        lead_score: 50,
        interest_level: lead.interest_level || 'Warm',
        status: lead.status || 'Active',
        created_at: new Date(item.timestamp).toISOString(),
        isOfflineDraft: true,
        syncStatus: 'pending'
      };
      window.dispatchEvent(new CustomEvent('bizpilot-leads-updated'));
      return draft;
    }

    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lead)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return data.data;
    } catch (error: any) {
      console.warn('CRMService: Error creating lead, falling back to local queue:', error);
      const item = await OfflineQueueService.enqueue('create_crm_lead', lead);
      const draft: CRMLead = {
        id: item.id,
        lead_name: lead.lead_name,
        company_name: lead.company_name,
        phone: lead.phone,
        email: lead.email,
        source: lead.source,
        notes: lead.notes,
        pipeline_stage: lead.pipeline_stage,
        estimated_value: Number(lead.estimated_value) || 0,
        lead_score: 50,
        interest_level: lead.interest_level || 'Warm',
        status: lead.status || 'Active',
        created_at: new Date(item.timestamp).toISOString(),
        isOfflineDraft: true,
        syncStatus: 'pending'
      };
      window.dispatchEvent(new CustomEvent('bizpilot-leads-updated'));
      return draft;
    }
  }

  /**
   * Update lead properties (e.g., drag and drop stage, values)
   */
  static async updateLead(id: string, updates: Partial<Omit<CRMLead, 'id' | 'created_at' | 'updated_at'>>): Promise<CRMLead | null> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    // Check if it's already a local draft. If so, update the payload inside the queue instead of posting!
    if (id.startsWith('off_q_')) {
      const queue = await OfflineQueueService.getQueue();
      const idx = queue.findIndex(i => i.id === id);
      if (idx !== -1 && queue[idx].action === 'create_crm_lead') {
        queue[idx].payload = { ...queue[idx].payload, ...updates };
        await OfflineQueueService.saveQueue(queue);
        window.dispatchEvent(new CustomEvent('bizpilot-leads-updated'));
        return {
          id,
          ...queue[idx].payload,
          isOfflineDraft: true,
          syncStatus: 'pending'
        } as CRMLead;
      }
    }

    if (!isOnline) {
      console.log('Device is offline. Enqueuing Lead stage updates.');
      await OfflineQueueService.enqueue('update_crm_stage', { id, updates });
      window.dispatchEvent(new CustomEvent('bizpilot-leads-updated'));
      return {
        id,
        ...updates,
        isOfflineDraft: true,
        syncStatus: 'pending'
      } as CRMLead;
    }

    try {
      const response = await fetch(`/api/crm/leads/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return data.data;
    } catch (error: any) {
      console.warn(`CRMService: Error updating lead ${id}, falling back to local queue:`, error);
      await OfflineQueueService.enqueue('update_crm_stage', { id, updates });
      window.dispatchEvent(new CustomEvent('bizpilot-leads-updated'));
      return {
        id,
        ...updates,
        isOfflineDraft: true,
        syncStatus: 'pending'
      } as any;
    }
  }


  /**
   * Delete lead
   */
  static async deleteLead(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/crm/leads/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      return !!data.success;
    } catch (error) {
      console.error(`CRMService: Error deleting lead ${id}:`, error);
      return false;
    }
  }

  /**
   * Log a new manual or automatic CRM activity
   */
  static async addActivity(leadId: string, activityType: string, notes: string): Promise<CRMActivity | null> {
    try {
      const response = await fetch(`/api/crm/leads/${encodeURIComponent(leadId)}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activity_type: activityType, notes })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return data.data;
    } catch (error) {
      console.error(`CRMService: Error logging activity for lead ${leadId}:`, error);
      return null;
    }
  }
}
