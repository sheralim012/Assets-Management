import { useState, useEffect } from 'react';
import {
	Clock,
	Eye,
	Paperclip,
	File,
	FileText,
	FileSpreadsheet,
	Image as ImageIcon,
} from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { AssetStatusBadge } from '@/components/shared/AssetStatusBadge';
import { RepairStatusBadge } from '@/components/shared/RepairStatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { AssetFileUploader } from '@/components/assets/AssetFileUploader';
import { useAsset, useAssetAuditLog } from '@/hooks/useAssets';
import { useRepairs } from '@/hooks/useRepairs';
import { useAssetFiles } from '@/hooks/useAssetFiles';
import { ASSET_TYPE_LABELS } from '@/lib/constants';
import { formatDate, formatPKR, cn } from '@/lib/utils';
import { AssetHistoryModal } from './AssetHistoryModal';
import type { Asset, AssetFile } from '@/types';

interface AssetDetailDrawerProps {
	assetId: string | null;
	open: boolean;
	onClose: () => void;
	onEdit: (asset: Asset) => void;
}

function getFileIcon(fileType: string) {
	if (fileType.startsWith('image/'))
		return { Icon: ImageIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' };
	if (fileType === 'application/pdf')
		return { Icon: FileText, color: 'text-red-600', bg: 'bg-red-50' };
	if (fileType.includes('word') || fileType.includes('doc'))
		return { Icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' };
	if (
		fileType.includes('sheet') ||
		fileType.includes('excel') ||
		fileType.includes('csv')
	)
		return {
			Icon: FileSpreadsheet,
			color: 'text-emerald-600',
			bg: 'bg-emerald-50',
		};
	return { Icon: File, color: 'text-gray-500', bg: 'bg-gray-50' };
}

function FileThumbnail({
	file,
	getSignedUrl,
}: {
	file: AssetFile;
	getSignedUrl: (path: string) => Promise<string | null>;
}) {
	const [url, setUrl] = useState<string | null>(null);
	const isImage = file.file_type.startsWith('image/');
	const { Icon, color, bg } = getFileIcon(file.file_type);
	const ext = file.file_name.split('.').pop()?.toUpperCase() ?? 'FILE';

	useEffect(() => {
		if (isImage) {
			getSignedUrl(file.storage_path).then((u) => u && setUrl(u));
		}
	}, [file.id]); // eslint-disable-line react-hooks/exhaustive-deps

	async function handleView() {
		const resolvedUrl = url ?? (await getSignedUrl(file.storage_path));
		if (!resolvedUrl) return;
		if (file.file_type === 'application/pdf' || !isImage) {
			const a = document.createElement('a');
			a.href = resolvedUrl;
			if (!file.file_type.startsWith('image/')) a.download = file.file_name;
			else a.target = '_blank';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} else {
			window.open(resolvedUrl, '_blank');
		}
	}

	return (
		<button
			onClick={handleView}
			title={file.file_name}
			className='group relative w-[72px] h-[72px] rounded-lg overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all flex-shrink-0'
		>
			{isImage && url ? (
				<img
					src={url}
					alt={file.file_name}
					className='w-full h-full object-cover'
				/>
			) : (
				<div
					className={cn(
						'w-full h-full flex flex-col items-center justify-center gap-0.5',
						bg,
					)}
				>
					<Icon className={cn('w-6 h-6', color)} />
					<span className={cn('text-[9px] font-bold px-1', color)}>{ext}</span>
				</div>
			)}
			<div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
				<Eye className='w-4 h-4 text-white' />
			</div>
		</button>
	);
}

export function AssetDetailDrawer({
	assetId,
	open,
	onClose,
	onEdit,
}: AssetDetailDrawerProps) {
	const [historyOpen, setHistoryOpen] = useState(false);
	const [filesOpen, setFilesOpen] = useState(false);
	const { data: asset, isLoading } = useAsset(assetId);
	const { data: auditLog } = useAssetAuditLog(assetId);
	const { data: repairs } = useRepairs({});
	const { files, getSignedUrl } = useAssetFiles(assetId);

	const assetRepairs = repairs?.filter((r) => r.asset_id === assetId) ?? [];

	return (
		<>
			<Drawer open={open} onClose={onClose} title='Asset Details' width={480}>
				{isLoading && (
					<div className='flex items-center justify-center py-16'>
						<Spinner size='md' className='text-[var(--color-primary)]' />
					</div>
				)}
				{asset && (
					<div className='px-6 py-4 space-y-6'>
						{/* Actions */}
						<div className='flex gap-2 flex-wrap items-center'>
							<Button
								variant='secondary'
								size='sm'
								onClick={() => onEdit(asset)}
							>
								Edit Asset
							</Button>
							<Button
								variant='secondary'
								size='sm'
								onClick={() => setFilesOpen(true)}
							>
								<Paperclip className='w-3.5 h-3.5' />
								Files
								{files.length > 0 && (
									<span className='ml-0.5 text-[var(--color-primary)] font-semibold'>
										({files.length})
									</span>
								)}
							</Button>
							<button
								onClick={() => setHistoryOpen(true)}
								className='flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:underline'
							>
								<Clock className='w-4 h-4' />
								View Asset History
							</button>
						</div>

						{/* Asset Info */}
						<section>
							<h3 className='section-title mb-3'>Asset Information</h3>
							<div className='space-y-2'>
								<Row
									label='Asset Tag'
									value={
										<span className='font-mono font-bold text-[var(--color-primary)]'>
											{asset.asset_tag}
										</span>
									}
								/>
								<Row label='Type' value={ASSET_TYPE_LABELS[asset.asset_type]} />
								<Row
									label='Status'
									value={<AssetStatusBadge status={asset.status} />}
								/>
								<Row
									label='Classification'
									value={
										<Badge variant={asset.classification}>
											{asset.classification === 'employee_allocated'
												? 'Employee Allocated'
												: 'Company Allocated'}
										</Badge>
									}
								/>
								<Row label='Specs' value={asset.specs} />
								{asset.serial_number &&
									asset.classification !== 'company_allocated' && (
										<Row
											label='Serial No.'
											value={
												<span className='font-mono'>{asset.serial_number}</span>
											}
										/>
									)}
								{asset.asset_type === 'mobile' && asset.pta_status && (
									<Row
										label='PTA Status'
										value={asset.pta_status.replace('_', ' ')}
									/>
								)}
							</div>
						</section>

						{/* Vendor Details */}
						<section>
							<h3 className='section-title mb-3'>Vendor Details</h3>
							<div className='space-y-2'>
								<Row label='Manufacturer' value={asset.manufacturer} />
								<Row label='Vendor' value={asset.vendor_name} />
								<Row label='Phone' value={asset.vendor_phone} />
								<Row label='Price' value={formatPKR(asset.price_pkr)} />
								<Row
									label='Purchase Date'
									value={formatDate(asset.purchase_date)}
								/>
							</div>
						</section>

						{/* Assignment */}
						{asset.status === 'allotted' && asset.allotted_user && (
							<section>
								<h3 className='section-title mb-3'>Assigned To</h3>
								<div className='flex items-center gap-3 p-3 bg-[var(--color-bg)] rounded-lg'>
									<Avatar
										src={asset.allotted_user.avatar_url}
										name={asset.allotted_user.name}
										size='md'
									/>
									<div>
										<p className='font-medium text-sm text-[var(--color-text)]'>
											{asset.allotted_user.name}
										</p>
										<p className='text-xs text-[var(--color-text-secondary)]'>
											{asset.allotted_user.email}
										</p>
									</div>
								</div>
							</section>
						)}

						{asset.status === 'retired' && asset.retirement_reason && (
							<section>
								<h3 className='section-title mb-3'>Retirement</h3>
								<div className='space-y-2'>
									<Row
										label='Reason'
										value={asset.retirement_reason.replace(/_/g, ' ')}
									/>
									{asset.retirement_reason === 'sold' && (
										<Row label='Sale Price' value={formatPKR(asset.sale_price)} />
									)}
								</div>
							</section>
						)}

						{asset.location && (
							<section>
								<h3 className='section-title mb-3'>Location</h3>
								<p className='text-sm text-[var(--color-text)]'>
									{asset.location}
								</p>
							</section>
						)}

						{/* Repair History */}
						{assetRepairs.length > 0 && (
							<section>
								<h3 className='section-title mb-3'>Repair History</h3>
								<div className='space-y-2'>
									{assetRepairs.map((r) => (
										<div
											key={r.id}
											className='p-3 bg-[var(--color-bg)] rounded-lg text-sm'
										>
											<div className='flex items-center justify-between mb-1'>
												<span className='font-medium'>
													{r.repair_vendor_name}
												</span>
												<RepairStatusBadge status={r.status} />
											</div>
											<p className='text-[var(--color-text-secondary)] text-xs'>
												{r.fault_description}
											</p>
											<p className='text-[var(--color-text-secondary)] text-xs mt-1'>
												Sent: {formatDate(r.date_sent)}
											</p>
										</div>
									))}
								</div>
							</section>
						)}

						{/* Audit Log */}
						{auditLog && auditLog.length > 0 && (
							<section>
								<h3 className='section-title mb-3'>Audit Log</h3>
								<div className='space-y-2'>
									{auditLog.map((log) => (
										<div key={log.id} className='flex gap-3 text-sm'>
											<div className='w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-2 flex-shrink-0' />
											<div>
												<span className='font-medium text-[var(--color-primary)]'>
													{log.action.replace(/_/g, ' ')}
												</span>
												{log.actor && (
													<span className='text-[var(--color-text-secondary)]'>
														{' '}
														by {log.actor.name}
													</span>
												)}
												<p className='text-xs text-[var(--color-text-secondary)]'>
													{formatDate(log.created_at)}
												</p>
											</div>
										</div>
									))}
								</div>
							</section>
						)}

						{asset.notes && (
							<section>
								<h3 className='section-title mb-2'>Notes</h3>
								<p className='text-sm text-[var(--color-text-secondary)]'>
									{asset.notes}
								</p>
							</section>
						)}

						{/* Files & Documents — inline thumbnails */}
						<section>
							<div className='flex items-center justify-between mb-3'>
								<h3 className='section-title'>
									Files & Documents
									{files.length > 0 && (
										<span className='ml-1.5 text-sm font-normal text-[var(--color-text-secondary)]'>
											({files.length})
										</span>
									)}
								</h3>
								{files.length > 0 && (
									<button
										onClick={() => setFilesOpen(true)}
										className='text-xs text-[var(--color-primary)] hover:underline'
									>
										Manage
									</button>
								)}
							</div>
							{files.length === 0 ? (
								<p className='text-sm text-[var(--color-text-secondary)]'>
									No files attached
								</p>
							) : (
								<div className='flex flex-wrap gap-2'>
									{files.map((file) => (
										<FileThumbnail
											key={file.id}
											file={file}
											getSignedUrl={getSignedUrl}
										/>
									))}
								</div>
							)}
						</section>
					</div>
				)}
			</Drawer>

			{/* Full file management modal */}
			{asset && (
				<Modal
					open={filesOpen}
					onClose={() => setFilesOpen(false)}
					title={`Files — ${asset.asset_tag}`}
					size='lg'
				>
					<AssetFileUploader assetId={asset.id} />
				</Modal>
			)}

			{historyOpen && asset && (
				<AssetHistoryModal
					assetId={asset.id}
					assetTag={asset.asset_tag}
					onClose={() => setHistoryOpen(false)}
				/>
			)}
		</>
	);
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className='flex gap-2 text-sm'>
			<span className='text-[var(--color-text-secondary)] w-28 flex-shrink-0'>
				{label}
			</span>
			<span className='text-sm text-[var(--color-text)] flex-1 break-words min-w-0'>
				{value ?? '—'}
			</span>
		</div>
	);
}
