import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Classification } from '@/types';

export interface Manufacturer {
	id: string;
	name: string;
	asset_type: string;
	classification: Classification;
	created_at: string;
}

export function useManufacturers(assetType?: string) {
	const qc = useQueryClient();

	const { data: manufacturers = [], isLoading } = useQuery<Manufacturer[]>({
		queryKey: ['manufacturers', assetType],
		queryFn: async () => {
			let q = supabase
				.from('manufacturers')
				.select('*')
				.order('name', { ascending: true });

			if (assetType) q = q.eq('asset_type', assetType);

			const { data, error } = await q;
			if (error) throw error;
			return data ?? [];
		},
	});

	const addManufacturerMutation = useMutation({
		mutationFn: async ({
			name,
			assetType: type,
			classification,
		}: {
			name: string;
			assetType: string;
			classification: Classification;
		}) => {
			const { data, error } = await supabase
				.from('manufacturers')
				.insert({ name, asset_type: type, classification })
				.select()
				.single();
			if (error) throw error;
			return data as Manufacturer;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['manufacturers'] });
		},
	});

	const addManufacturer = async (
		name: string,
		assetType: string,
		classification: Classification,
	) => {
		return addManufacturerMutation.mutateAsync({
			name,
			assetType,
			classification,
		});
	};

	return {
		manufacturers,
		addManufacturer,
		isLoading,
		isAdding: addManufacturerMutation.isPending,
	};
}
