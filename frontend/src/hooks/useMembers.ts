// =============================================================================
// MooOS v2 — useMembers Hook (Convention #5)
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from '@/lib/api';
import type { Member, CreateMemberInput, PaginatedResponse } from '@/types';

interface UseMembersReturn {
  members: Member[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseMemberMutationsReturn {
  createMember: (data: CreateMemberInput) => Promise<Member>;
  updateMember: (id: number, data: Partial<CreateMemberInput>) => Promise<Member>;
  deleteMember: (id: number) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Fetch all members.
 */
export function useMembers(page = 1, perPage = 50): UseMembersReturn {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    apiGet<PaginatedResponse<Member>>(`/members?page=${page}&per_page=${perPage}`)
      .then((res) => {
        if (!cancelled) {
          setMembers(res.items);
          setTotal(res.total);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Gagal memuat data anggota');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, perPage, trigger]);

  return { members, total, isLoading, error, refetch };
}

/**
 * Member CRUD mutations.
 */
export function useMemberMutations(): UseMemberMutationsReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMember = useCallback(async (data: CreateMemberInput): Promise<Member> => {
    setIsSubmitting(true);
    try {
      return await apiPost<Member>('/members', data);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateMember = useCallback(async (id: number, data: Partial<CreateMemberInput>): Promise<Member> => {
    setIsSubmitting(true);
    try {
      return await apiPut<Member>(`/members/${id}`, data);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const deleteMember = useCallback(async (id: number): Promise<void> => {
    setIsSubmitting(true);
    try {
      await apiDelete(`/members/${id}`);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { createMember, updateMember, deleteMember, isSubmitting };
}
