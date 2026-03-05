// ============================================
// WORKSPACE SERVICE — Multi-tenant workspace management
// ============================================

import apiClient from '@/api/client';
import type { Workspace, WorkspaceDetail, WorkspaceMember, WorkspaceSettings } from '@/types';

export const workspaceService = {
  /** List workspaces the current user belongs to */
  async listWorkspaces(): Promise<Workspace[]> {
    const envelope = await apiClient.get('/workspaces');
    return envelope.data;
  },

  /** Get workspace details */
  async getWorkspace(workspaceId: string): Promise<WorkspaceDetail> {
    const envelope = await apiClient.get(`/workspaces/${workspaceId}`);
    return envelope.data;
  },

  /** Create a new workspace */
  async createWorkspace(data: { name: string; slug: string; description?: string }): Promise<WorkspaceDetail> {
    const envelope = await apiClient.post('/workspaces', data);
    return envelope.data;
  },

  /** Update workspace */
  async updateWorkspace(payload: { name?: string; description?: string; avatar?: string }): Promise<WorkspaceDetail> {
    const envelope = await apiClient.put('/workspaces', payload);
    return envelope.data;
  },

  /** Get workspace members */
  async getMembers(): Promise<WorkspaceMember[]> {
    const envelope = await apiClient.get('/workspaces/members');
    return envelope.data;
  },

  /** Invite a member */
  async inviteMember(email: string, role: string = 'EDITOR'): Promise<WorkspaceMember> {
    const envelope = await apiClient.post('/workspaces/members', { email, role });
    return envelope.data;
  },

  /** Remove a member */
  async removeMember(memberId: string): Promise<void> {
    await apiClient.delete(`/workspaces/members/${memberId}`);
  },

  /** Get workspace settings */
  async getSettings(): Promise<WorkspaceSettings> {
    const envelope = await apiClient.get('/settings');
    return envelope.data;
  },

  /** Update workspace settings */
  async updateSettings(settings: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
    const envelope = await apiClient.put('/settings', settings);
    return envelope.data;
  },
};
