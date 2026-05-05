import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
	Eye,
	Pencil,
	ArrowLeft,
	Plus,
	Wrench,
	Archive,
	Trash2,
} from 'lucide-react';
import {
	Table,
	TableHead,
	TableBody,
	Th,
	Td,
	Tr,
	TableSkeleton,
} from '@/components/ui/Table';
import { AssetStatusBadge } from '@/components/shared/AssetStatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Tooltip } from '@/components/ui/Tooltip';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AssetDetailDrawer } from './AssetDetailDrawer';
import { EditAssetModal } from './EditAssetModal';
import { StartRepairModal } from '@/features/repair/StartRepairModal';
import { RetireAssetModal } from './RetireAssetModal';
import { useAssets, useDeleteAsset } from '@/hooks/useAssets';
import { useCategories } from '@/hooks/useCategories';
import { STATUS_OPTIONS } from '@/lib/constants';
import { formatPKR } from '@/lib/utils';
import type { Asset, Classification, AssetStatus } from '@/types';
import { Package } from 'lucide-react';

interface AssetTableProps {
	classification: Classification;
	assetType: string;
	onBack: () => void;
	onAddAsset: () => void;
	statusFilter: string;
	onStatusFilterChange: (v: string) => void;
	searchQuery: string;
	onSearchChange: (v: string) => void;
}

const PAGE_SIZE = 15;

export function AssetTable({
	classification,
	assetType,
	onBack,
	onAddAsset,
	statusFilter,
	onStatusFilterChange,
	searchQuery,
	onSearchChange,
}: AssetTableProps) {
	const [viewAssetId, setViewAssetId] = useState<string | null>(null);
	const [editAsset, setEditAsset] = useState<Asset | null>(null);
	const [repairAsset, setRepairAsset] = useState<Asset | null>(null);
	const [retireAsset, setRetireAsset] = useState<Asset | null>(null);
	const [page, setPage] = useState(1);
	const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);
	const deleteAssetMutation = useDeleteAsset();
	const { data: allCategories } = useCategories();
	const categoryLabel = (allCategories ?? []).find((c) => c.type_key === assetType)?.label ?? assetType;

	const { data: rawData, isLoading } = useAssets({
		classification,
		asset_type: assetType,
		status: statusFilter !== 'all' ? (statusFilter as AssetStatus) : undefined,
	});

	const searchLower = searchQuery.toLowerCase();
	const assets = [...(rawData ?? [])]
		.filter((a) => {
			if (!searchQuery) return true;
			return (
				a.asset_tag.toLowerCase().includes(searchLower) ||
				(a.specs ?? '').toLowerCase().includes(searchLower) ||
				(a.serial_number ?? '').toLowerCase().includes(searchLower) ||
				(a.allotted_user?.name ?? '').toLowerCase().includes(searchLower) ||
				(a.allotted_user?.email ?? '').toLowerCase().includes(searchLower) ||
				(a.location ?? '').toLowerCase().includes(searchLower)
			);
		})
		.sort((a, b) => a.asset_tag.localeCompare(b.asset_tag));
	const total = assets.length;
	const pagedAssets = assets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	useEffect(() => {
		setPage(1);
	}, [searchQuery, statusFilter, assetType]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2 }}
		>
			{/* Header */}
			<div className='flex items-center justify-between mb-4'>
				<button
					onClick={onBack}
					className='flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors font-medium'
				>
					<ArrowLeft className='w-4 h-4' />
					All Categories
				</button>
				<Button variant='primary' onClick={onAddAsset}>
					<Plus className='w-4 h-4' />
					Add {categoryLabel}
				</Button>
			</div>

			<div className='card p-0 overflow-hidden'>
				{/* Filters */}
				<div className='flex items-center gap-3 p-4 border-b border-[var(--color-border)]'>
					<h2 className='section-title flex-1'>
						{categoryLabel}
						{!isLoading && (
							<span className='ml-2 text-sm font-normal text-[var(--color-text-secondary)]'>
								Showing {total} {total === 1 ? 'asset' : 'assets'}
							</span>
						)}
					</h2>
					<SearchInput
						value={searchQuery}
						onChange={onSearchChange}
						placeholder='Search tag, specs, serial...'
						className='w-64'
					/>
					<Select
						options={[
							{ value: 'all', label: 'All Statuses' },
							...STATUS_OPTIONS,
						]}
						value={statusFilter}
						onValueChange={onStatusFilterChange}
						placeholder='All Statuses'
						className='w-40'
					/>
				</div>

				<Table>
					<TableHead>
						<tr>
							<Th>#</Th>
							<Th>Tag</Th>
							<Th>Specs</Th>
							<Th>Price</Th>
							<Th>Vendor</Th>
							{classification !== 'company_allocated' && (
								<Th>{assetType === 'mobile' ? 'IMEI' : 'Serial No.'}</Th>
							)}
							<Th>
								{classification === 'employee_allocated'
									? 'Allotted To'
									: 'Location'}
							</Th>
							<Th>Status</Th>
							<Th>Actions</Th>
						</tr>
					</TableHead>
					<TableBody>
						{isLoading && (
							<TableSkeleton
								rows={5}
								cols={classification === 'company_allocated' ? 8 : 9}
							/>
						)}
						{!isLoading &&
							pagedAssets.map((asset, i) => (
								<Tr key={asset.id} onClick={() => setViewAssetId(asset.id)}>
									<Td className='text-[var(--color-text-secondary)] text-xs'>
										{(page - 1) * PAGE_SIZE + i + 1}
									</Td>
									<Td>
										<span className='font-mono font-semibold text-[var(--color-primary)]'>
											{asset.asset_tag}
										</span>
									</Td>
									<Td>
										<Tooltip content={asset.specs}>
											<span className='line-clamp-2 max-w-[200px] text-xs'>
												{asset.specs}
											</span>
										</Tooltip>
									</Td>
									<Td className='whitespace-nowrap'>
										{formatPKR(asset.price_pkr)}
									</Td>
									<Td>{asset.vendor_name}</Td>
									{classification !== 'company_allocated' && (
										<Td>
											<span className='font-mono text-xs'>
												{asset.serial_number ?? '—'}
											</span>
										</Td>
									)}
									<Td>
										{classification === 'employee_allocated' ? (
											asset.status === 'allotted' && asset.allotted_user ? (
												<div className='flex items-center gap-2'>
													<Avatar
														src={asset.allotted_user.avatar_url}
														name={asset.allotted_user.name}
														size='sm'
													/>
													<span className='text-xs'>
														{asset.allotted_user.name}
													</span>
												</div>
											) : asset.status === 'allotted' &&
											  asset.allotted_user_name ? (
												<span className='text-xs'>
													{asset.allotted_user_name}
												</span>
											) : (
												<span className='text-gray-400 text-xs'>—</span>
											)
										) : (
											<span className='text-xs'>{asset.location ?? '—'}</span>
										)}
									</Td>
									<Td>
										<AssetStatusBadge status={asset.status} />
									</Td>
									<Td onClick={(e: React.MouseEvent) => e.stopPropagation()}>
										<div className='flex items-center gap-1'>
											<Tooltip content='View details'>
												<button
													className='p-1.5 rounded hover:bg-gray-100 transition-colors text-slate-500 hover:text-[var(--color-primary)]'
													onClick={() => setViewAssetId(asset.id)}
												>
													<Eye className='w-4 h-4' />
												</button>
											</Tooltip>
											<Tooltip content='Edit'>
												<button
													className='p-1.5 rounded hover:bg-gray-100 transition-colors text-slate-500 hover:text-[var(--color-primary)]'
													onClick={() => setEditAsset(asset)}
												>
													<Pencil className='w-4 h-4' />
												</button>
											</Tooltip>
											{asset.status !== 'in_repair' &&
												asset.status !== 'retired' && (
													<Tooltip content='Send to repair'>
														<button
															className='p-1.5 rounded hover:bg-[var(--color-repair-light)] transition-colors text-slate-500 hover:text-[var(--color-repair)]'
															onClick={() => setRepairAsset(asset)}
														>
															<Wrench className='w-4 h-4' />
														</button>
													</Tooltip>
												)}
											{asset.status !== 'retired' && (
												<Tooltip content='Retire asset'>
													<button
														className='p-1.5 rounded hover:bg-amber-50 transition-colors text-slate-500 hover:text-amber-600'
														onClick={() => setRetireAsset(asset)}
														aria-label='Retire asset'
													>
														<Archive className='w-4 h-4' />
													</button>
												</Tooltip>
											)}
											<Tooltip content='Delete asset'>
												<button
													className='p-1.5 rounded hover:bg-red-50 transition-colors text-slate-500 hover:text-red-600'
													onClick={() => setDeleteAsset(asset)}
													aria-label='Delete asset'
												>
													<Trash2 className='w-4 h-4' />
												</button>
											</Tooltip>
										</div>
									</Td>
								</Tr>
							))}
					</TableBody>
				</Table>

				{!isLoading && assets.length === 0 && (
					<EmptyState
						icon={Package}
						title='No assets found'
						description={
							searchQuery
								? 'Try adjusting your search'
								: `No ${categoryLabel} assets yet`
						}
						actionLabel='Add Asset'
						onAction={onAddAsset}
					/>
				)}
				{!isLoading && assets.length > 0 && (
					<Pagination
						page={page}
						pageSize={PAGE_SIZE}
						total={total}
						onPageChange={setPage}
					/>
				)}
			</div>

			<AssetDetailDrawer
				assetId={viewAssetId}
				open={!!viewAssetId}
				onClose={() => setViewAssetId(null)}
				onEdit={(a) => {
					setViewAssetId(null);
					setEditAsset(a);
				}}
			/>

			{editAsset && (
				<EditAssetModal
					open={!!editAsset}
					onClose={() => setEditAsset(null)}
					asset={editAsset}
				/>
			)}

			{repairAsset && (
				<StartRepairModal
					open={!!repairAsset}
					onClose={() => setRepairAsset(null)}
					asset={repairAsset}
				/>
			)}

			{retireAsset && (
				<RetireAssetModal
					open={!!retireAsset}
					onClose={() => setRetireAsset(null)}
					asset={retireAsset}
				/>
			)}

			<ConfirmDialog
				open={!!deleteAsset}
				onClose={() => setDeleteAsset(null)}
				onConfirm={async () => {
					if (!deleteAsset) return;
					try {
						await deleteAssetMutation.mutateAsync(deleteAsset.id);
						toast.success(`Asset ${deleteAsset.asset_tag} deleted`);
						setDeleteAsset(null);
					} catch (err) {
						toast.error(
							err instanceof Error ? err.message : 'Failed to delete asset',
						);
					}
				}}
				title='Delete this asset?'
				description={
					deleteAsset
						? `${deleteAsset.asset_tag} will be permanently deleted along with its repair history. This cannot be undone — use Retire instead if you want to keep records.`
						: ''
				}
				confirmLabel='Delete permanently'
				variant='danger'
				loading={deleteAssetMutation.isPending}
			/>
		</motion.div>
	);
}
