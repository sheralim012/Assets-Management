import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, CheckCircle, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
	Table,
	TableHead,
	TableBody,
	Th,
	Td,
	Tr,
	TableSkeleton,
} from '@/components/ui/Table';
import { Tooltip } from '@/components/ui/Tooltip';
import { EmptyState } from '@/components/ui/EmptyState';
import { RepairDetailDrawer } from './RepairDetailDrawer';
import { CompleteRepairModal } from './CompleteRepairModal';
import { EditRepairModal } from './EditRepairModal';
import { useRepairs, useRepairHistory } from '@/hooks/useRepairs';
import { ASSET_TYPE_LABELS } from '@/lib/constants';
import { formatDate, formatPKR } from '@/lib/utils';
import type { RepairRecord } from '@/types';
import { Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'active' | 'history';
type ClassTab = 'employee' | 'company';

function getRepairDuration(
	dateSent: string | null | undefined,
	expectedReturn: string | null | undefined,
): number {
	if (!dateSent || !expectedReturn) return 0;
	const sent = new Date(dateSent);
	const expected = new Date(expectedReturn);
	if (isNaN(sent.getTime()) || isNaN(expected.getTime())) return 0;
	return Math.max(0, Math.floor(
		(expected.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24),
	));
}

function getDaysTaken(
	dateSent: string | null | undefined,
	returnDate: string | null | undefined,
): number {
	if (!dateSent || !returnDate) return 0;
	const sent = new Date(dateSent);
	const returned = new Date(returnDate);
	if (isNaN(sent.getTime()) || isNaN(returned.getTime())) return 0;
	return Math.max(0, Math.floor(
		(returned.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24),
	));
}

const resolvedStatusLabel: Record<string, string> = {
	available: 'Available',
	allotted: 'Allotted',
	retired: 'Retired',
};

export function RepairPage() {
	const [classTab, setClassTab] = useState<ClassTab>('employee');
	const [tab, setTab] = useState<Tab>('active');
	const [viewRepair, setViewRepair] = useState<RepairRecord | null>(null);
	const [completeRepair, setCompleteRepair] = useState<RepairRecord | null>(
		null,
	);
	const [editRepair, setEditRepair] = useState<RepairRecord | null>(null);

	const { data: openRepairs, isLoading: loadingActive } = useRepairs({
		status: 'open',
	});
	const { data: history, isLoading: loadingHistory } = useRepairHistory();

	const classFilter = classTab === 'company' ? 'company_allocated' : 'employee_allocated';
	const filteredOpen = (openRepairs ?? []).filter(
		(r) => r.asset?.classification === classFilter,
	);
	const filteredHistory = (history ?? []).filter(
		(r) => r.asset?.classification === classFilter,
	);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2 }}
		>
			<PageHeader
				title='Repair Tracking'
				description='All assets currently under repair'
			/>

			{/* Classification Tabs */}
			<div className='flex gap-1 mb-3'>
				{(['employee', 'company'] as const).map((ct) => (
					<button
						key={ct}
						onClick={() => setClassTab(ct)}
						className={cn(
							'px-4 py-2 rounded text-sm font-medium border transition-all',
							classTab === ct
								? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
								: 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]',
						)}
					>
						{ct === 'employee' ? 'Employee Allocated' : 'Company Allocated'}
					</button>
				))}
			</div>

			{/* Active / History Tabs */}
			<div className='flex gap-1 mb-4'>
				{(['active', 'history'] as const).map((t) => (
					<button
						key={t}
						onClick={() => setTab(t)}
						className={cn(
							'px-4 py-2 rounded text-sm font-medium border transition-all',
							tab === t
								? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
								: 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]',
						)}
					>
						{t === 'active' ? 'Active Repairs' : 'Repair History'}
						{t === 'active' && filteredOpen.length > 0 && (
							<span className='ml-2 min-w-5 h-5 px-1.5 rounded-full bg-white/20 text-xs font-semibold inline-flex items-center justify-center'>
								{filteredOpen.length}
							</span>
						)}
					</button>
				))}
			</div>

			{/* Active Repairs Tab */}
			{tab === 'active' && (
				<div className='card p-0 overflow-hidden'>
					<Table>
						<TableHead>
							<tr>
								<Th>Asset Tag</Th>
								<Th>Type</Th>
								<Th>Specs</Th>
								<Th>Fault</Th>
								<Th>Vendor</Th>
								<Th>Date Sent</Th>
								<Th>Expected Return</Th>
								<Th>Days</Th>
								<Th>Actions</Th>
							</tr>
						</TableHead>
						<TableBody>
							{loadingActive && <TableSkeleton rows={5} cols={9} />}
							{!loadingActive &&
								filteredOpen.map((repair) => {
									const duration = getRepairDuration(repair.date_sent, repair.expected_return_date);
									const isOverdue = !!repair.expected_return_date && new Date() > new Date(repair.expected_return_date);
									const isDueSoon = !!repair.expected_return_date && !isOverdue && getRepairDuration(new Date().toISOString(), repair.expected_return_date) <= 2;
									return (
										<Tr
											key={repair.id}
											onClick={() => setViewRepair(repair)}
											className={isOverdue ? 'border-l-4 border-[var(--color-danger)]' : isDueSoon ? 'border-l-4 border-amber-400' : ''}
										>
											<Td>
												<span className='font-mono font-semibold text-[var(--color-primary)]'>
													{repair.asset?.asset_tag ?? '—'}
												</span>
											</Td>
											<Td>
												{repair.asset
													? (ASSET_TYPE_LABELS[repair.asset.asset_type] ?? repair.asset.asset_type)
													: '—'}
											</Td>
											<Td>
												<Tooltip content={repair.asset?.specs ?? ''}>
													<span className='line-clamp-1 max-w-[160px] text-xs'>
														{repair.asset?.specs ?? '—'}
													</span>
												</Tooltip>
											</Td>
											<Td>
												<Tooltip content={repair.fault_description}>
													<span className='line-clamp-1 max-w-[160px] text-xs'>
														{repair.fault_description}
													</span>
												</Tooltip>
											</Td>
											<Td>{repair.repair_vendor_name}</Td>
											<Td>{formatDate(repair.date_sent)}</Td>
											<Td>{formatDate(repair.expected_return_date)}</Td>
											<Td>
												<span className={isOverdue ? 'text-red-600 font-semibold' : isDueSoon ? 'text-amber-600 font-semibold' : 'text-gray-700'}>
													{duration}d{isOverdue && ' ⚠️'}
												</span>
											</Td>
											<Td
												onClick={(e: React.MouseEvent) => e.stopPropagation()}
											>
												<div className='flex items-center gap-1'>
													<Tooltip content='View details'>
														<button
															className='p-1.5 rounded hover:bg-[var(--color-bg)] text-slate-500 hover:text-[var(--color-primary)] transition-colors'
															onClick={() => setViewRepair(repair)}
														>
															<Eye className='w-4 h-4' />
														</button>
													</Tooltip>
													<Tooltip content='Edit repair'>
														<button
															className='p-1.5 rounded hover:bg-[var(--color-bg)] text-slate-500 hover:text-[var(--color-primary)] transition-colors'
															onClick={() => setEditRepair(repair)}
														>
															<Pencil className='w-4 h-4' />
														</button>
													</Tooltip>
													<Tooltip content='Mark complete'>
														<button
															className='p-1.5 rounded hover:bg-[var(--color-available-light)] text-slate-500 hover:text-[var(--color-available)] transition-colors'
															onClick={() => setCompleteRepair(repair)}
														>
															<CheckCircle className='w-4 h-4' />
														</button>
													</Tooltip>
												</div>
											</Td>
										</Tr>
									);
								})}
						</TableBody>
					</Table>

					{!loadingActive && filteredOpen.length === 0 && (
						<EmptyState
							icon={Wrench}
							title='No open repairs'
							description='All assets are accounted for and no repairs are in progress'
						/>
					)}
				</div>
			)}

			{/* Repair History Tab */}
			{tab === 'history' && (
				<div className='card p-0 overflow-hidden'>
					<Table>
						<TableHead>
							<tr>
								<Th>Asset Tag</Th>
								<Th>Type</Th>
								<Th>Fault</Th>
								<Th>Date Sent</Th>
								<Th>Returned</Th>
								<Th>Days Taken</Th>
								<Th>Final Cost</Th>
								<Th>Resolved As</Th>
								<Th>
									<Tooltip content='The employee who had this asset when it was sent for repair'>
										<span>Responsible</span>
									</Tooltip>
								</Th>
							</tr>
						</TableHead>
						<TableBody>
							{loadingHistory && <TableSkeleton rows={5} cols={9} />}
							{!loadingHistory &&
								filteredHistory.map((repair) => {
									return (<Tr key={repair.id}>
										<Td>
											<span className='font-mono font-semibold text-[var(--color-primary)]'>
												{repair.asset?.asset_tag ?? '—'}
											</span>
										</Td>
										<Td>
											{repair.asset
												? (ASSET_TYPE_LABELS[repair.asset.asset_type] ?? repair.asset.asset_type)
												: '—'}
										</Td>
										<Td>
											<Tooltip content={repair.fault_description}>
												<span className='line-clamp-1 max-w-[160px] text-xs'>
													{repair.fault_description}
												</span>
											</Tooltip>
										</Td>
										<Td>{formatDate(repair.date_sent)}</Td>
										<Td>{formatDate(repair.actual_return_date)}</Td>
										<Td>
											{getDaysTaken(repair.date_sent, repair.actual_return_date)}d
										</Td>
										<Td>{formatPKR(repair.final_cost_pkr)}</Td>
										<Td>
											{repair.resolved_status ? (
												<span
													className={cn(
														'text-xs font-medium px-2 py-0.5 rounded',
														repair.resolved_status === 'available' &&
															'bg-green-100 text-green-700',
														repair.resolved_status === 'allotted' &&
															'bg-blue-100 text-blue-700',
														repair.resolved_status === 'retired' &&
															'bg-red-100 text-red-700',
													)}
												>
													{resolvedStatusLabel[repair.resolved_status] ??
														repair.resolved_status}
												</span>
											) : (
												'—'
											)}
										</Td>
										<Td>{repair.original_user?.name ?? 'Company'}</Td>
									</Tr>
								); })}
						</TableBody>
					</Table>

					{!loadingHistory && filteredHistory.length === 0 && (
						<EmptyState
							icon={Wrench}
							title='No repair history'
							description='Completed repairs will appear here'
						/>
					)}
				</div>
			)}

			<RepairDetailDrawer
				repair={viewRepair}
				open={!!viewRepair}
				onClose={() => setViewRepair(null)}
			/>

			{completeRepair && (
				<CompleteRepairModal
					open={!!completeRepair}
					onClose={() => setCompleteRepair(null)}
					repair={completeRepair}
				/>
			)}

			{editRepair && (
				<EditRepairModal
					open={!!editRepair}
					onClose={() => setEditRepair(null)}
					repair={editRepair}
				/>
			)}
		</motion.div>
	);
}
