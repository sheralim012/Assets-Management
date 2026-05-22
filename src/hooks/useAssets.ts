import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/useAuth';
import type {
	Asset,
	AssetStatus,
	Classification,
	AuditAction,
} from '@/types';

interface AssetsFilter {
	classification?: Classification;
	asset_type?: string;
	status?: AssetStatus | AssetStatus[];
	search?: string;
}

export function useAssetsPaginated(
	filter: AssetsFilter & { page: number; pageSize: number },
) {
	const { page, pageSize, ...rest } = filter;
	const from = (page - 1) * pageSize;
	const to = from + pageSize - 1;

	return useQuery<{ data: Asset[]; total: number }>({
		queryKey: ['assets-paginated', filter],
		queryFn: async () => {
			let q = supabase
				.from('assets')
				.select(
					'*, allotted_user:profiles!allotted_user_id(id,name,email,avatar_url)',
					{ count: 'exact' },
				)
				.order('created_at', { ascending: false });

			if (rest.classification) q = q.eq('classification', rest.classification);
			if (rest.asset_type) q = q.eq('asset_type', rest.asset_type);
			if (Array.isArray(rest.status)) {
				q = q.in('status', rest.status);
			} else if (rest.status) {
				q = q.eq('status', rest.status);
			}
			if (rest.search) {
				q = q.or(
					`asset_tag.ilike.%${rest.search}%,specs.ilike.%${rest.search}%,serial_number.ilike.%${rest.search}%`,
				);
			}

			q = q.range(from, to);

			const { data, error, count } = await q;
			if (error) throw error;
			return { data: data ?? [], total: count ?? 0 };
		},
		staleTime: 0,
		gcTime: 60 * 1000,
		refetchOnWindowFocus: true,
		placeholderData: (prev: { data: Asset[]; total: number } | undefined) => prev,
	});
}

export function useAssets(filter: AssetsFilter = {}) {
	return useQuery<Asset[]>({
		queryKey: ['assets', filter],
		queryFn: async () => {
			let q = supabase
				.from('assets')
				.select(
					'*, allotted_user:profiles!allotted_user_id(id,name,email,avatar_url)',
				)
				.order('created_at', { ascending: false });

			if (filter.classification)
				q = q.eq('classification', filter.classification);
			if (filter.asset_type) q = q.eq('asset_type', filter.asset_type);
			if (Array.isArray(filter.status)) {
				q = q.in('status', filter.status);
			} else if (filter.status) {
				q = q.eq('status', filter.status);
			}
			if (filter.search) {
				q = q.or(
					`asset_tag.ilike.%${filter.search}%,specs.ilike.%${filter.search}%,serial_number.ilike.%${filter.search}%`,
				);
			}

			const { data, error } = await q;
			if (error) throw error;
			return data ?? [];
		},
		staleTime: 0,
		gcTime: 60 * 1000,
		refetchOnWindowFocus: true,
	});
}

export function useAsset(id: string | null) {
	return useQuery<Asset>({
		queryKey: ['assets', id],
		queryFn: async () => {
			const { data, error } = await supabase
				.from('assets')
				.select(
					'*, allotted_user:profiles!allotted_user_id(id,name,email,avatar_url)',
				)
				.eq('id', id!)
				.single();
			if (error) throw error;
			return data;
		},
		enabled: !!id,
		staleTime: 0,
		gcTime: 60 * 1000,
		refetchOnWindowFocus: true,
	});
}

async function insertAuditLog(params: {
	asset_id: string;
	action: AuditAction;
	actor_id: string;
	before_state?: Record<string, unknown> | null;
	after_state?: Record<string, unknown> | null;
}) {
	await supabase.from('asset_audit_log').insert({
		asset_id: params.asset_id,
		action: params.action,
		actor_id: params.actor_id,
		before_state: params.before_state ?? null,
		after_state: params.after_state ?? null,
	});
}

export function useCreateAsset() {
	const qc = useQueryClient();
	const { user, profile } = useAuth();

	return useMutation({
		mutationFn: async (
			values: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'allotted_user'>,
		): Promise<{ id: string }> => {
			const actorId = profile?.id ?? user!.id;
			const newId = crypto.randomUUID();
			const { error } = await supabase
				.from('assets')
				.insert({ ...values, id: newId, created_by: actorId });
			if (error) throw error;

			await insertAuditLog({
				asset_id: newId,
				action: 'created',
				actor_id: actorId,
				after_state: { ...values, id: newId, created_by: actorId } as Record<string, unknown>,
			});
			if (values.allotted_user_id) {
				await insertAuditLog({
					asset_id: newId,
					action: 'assigned',
					actor_id: actorId,
					after_state: { allotted_user_id: values.allotted_user_id },
				});
			}
			return { id: newId };
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
	});
}

export function useUpdateAsset() {
	const qc = useQueryClient();
	const { user, profile } = useAuth();

	return useMutation({
		mutationFn: async ({
			id,
			before,
			updates,
		}: {
			id: string;
			before: Asset;
			updates: Partial<Asset>;
		}) => {
			const { error } = await supabase
				.from('assets')
				.update(updates)
				.eq('id', id);
			if (error) throw error;

			await insertAuditLog({
				asset_id: id,
				action: 'updated',
				actor_id: profile?.id ?? user!.id,
				before_state: before as unknown as Record<string, unknown>,
				after_state: { ...before, ...updates } as Record<string, unknown>,
			});
		},
		onSuccess: (_data, vars) => {
			qc.invalidateQueries({ queryKey: ['assets'] });
			qc.invalidateQueries({ queryKey: ['assets', vars.id] });
		},
	});
}

export function useChangeAssetStatus() {
	const qc = useQueryClient();
	const { user, profile } = useAuth();

	return useMutation({
		mutationFn: async ({
			id,
			newStatus,
			before,
			extra,
		}: {
			id: string;
			newStatus: AssetStatus;
			before: Asset;
			extra?: Partial<Asset>;
		}) => {
			const actorId = profile?.id ?? user!.id;
			const updates: Partial<Asset> = { status: newStatus, ...extra };
			const { error } = await supabase
				.from('assets')
				.update(updates)
				.eq('id', id);
			if (error) throw error;

			await insertAuditLog({
				asset_id: id,
				action: 'status_changed',
				actor_id: actorId,
				before_state: { status: before.status },
				after_state: { status: newStatus },
			});

			if (newStatus === 'retired') {
				await insertAuditLog({
					asset_id: id,
					action: 'retired',
					actor_id: actorId,
					after_state: { retirement_reason: extra?.retirement_reason },
				});
			}
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['assets'] });
			qc.invalidateQueries({ queryKey: ['repairs'] });
		},
	});
}

export function useDeleteAsset() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error: repairErr } = await supabase
				.from('repair_records')
				.delete()
				.eq('asset_id', id);
			if (repairErr && repairErr.code !== '42501') throw repairErr;

			const { error } = await supabase.from('assets').delete().eq('id', id);
			if (error) throw error;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['assets'] });
			qc.invalidateQueries({ queryKey: ['repairs'] });
		},
	});
}

export function useAssetAuditLog(assetId: string | null) {
	return useQuery({
		queryKey: ['audit', assetId],
		queryFn: async () => {
			const { data, error } = await supabase
				.from('asset_audit_log')
				.select('*, actor:profiles!actor_id(name,email)')
				.eq('asset_id', assetId!)
				.order('created_at', { ascending: false });
			if (error) throw error;
			return data ?? [];
		},
		enabled: !!assetId,
	});
}

export async function generateAssetTag(prefix: string): Promise<string> {
	const { data } = await supabase
		.from('assets')
		.select('asset_tag')
		.ilike('asset_tag', `${prefix}-%`)
		.order('asset_tag', { ascending: false })
		.limit(1);

	if (!data || data.length === 0) return `${prefix}-0001`;

	const lastTag = data[0].asset_tag;
	const parts = lastTag.split('-');
	const lastNum = parseInt(parts[parts.length - 1], 10);
	const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
	return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}
