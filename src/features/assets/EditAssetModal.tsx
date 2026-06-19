import { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { ChevronDown, Paperclip } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { UserSelectDropdown } from '@/components/ui/UserSelectDropdown';
import { ManufacturerSelect } from '@/components/ui/ManufacturerSelect';
import { AssetFileUploader } from '@/components/assets/AssetFileUploader';
import { assetSchema, type AssetFormValues } from '@/lib/validations';
import { useUpdateAsset } from '@/hooks/useAssets';
import { useUsers } from '@/hooks/useUsers';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/lib/supabase';
import {
	PTA_STATUS_OPTIONS,
	STATUS_OPTIONS,
	RETIREMENT_REASON_OPTIONS,
} from '@/lib/constants';
import type { Asset, AssetType } from '@/types';

const OFFICE_LOCATIONS = [
	'General / Not Trackable',
	'Basement Hall',
	"Django's Den (Floor B)",
	"Ehmad's Office (Floor 2)",
	'First Floor Hall',
	'Git Orbit (Floor 2)',
	'Ground Floor Hall',
	'Ground Floor (Reception Area)',
	'Ground Floor (Guest Room)',
	'Podcast Room (Floor 2)',
	'React Retreat (Floor B)',
	'Rooftop',
	'Second Floor Hall',
	"Ahmed's Office (Floor G)",
	"Sher's Office (Floor B)",
	'Third Floor Hall',
	'Ground Floor Parking Area',
];

interface EditAssetModalProps {
	open: boolean;
	onClose: () => void;
	asset: Asset;
}

export function EditAssetModal({ open, onClose, asset }: EditAssetModalProps) {
	const updateAsset = useUpdateAsset();
	const { data: users } = useUsers({ status: 'active' });
	const { data: allCategories } = useCategories();
	const [tagError, setTagError] = useState<string | null>(null);
	const [serialError, setSerialError] = useState<string | null>(null);
	const [locationOpen, setLocationOpen] = useState(false);
	const [locationSearch, setLocationSearch] = useState('');
	const locationRef = useRef<HTMLDivElement>(null);

	const isCompany = asset.classification === 'company_allocated';

	const {
		register,
		handleSubmit,
		control,
		watch,
		reset,
		setValue,
		formState: { errors },
	} = useForm<AssetFormValues>({
		resolver: zodResolver(assetSchema),
		defaultValues: {
			asset_tag: asset.asset_tag,
			classification: asset.classification,
			asset_type: asset.asset_type,
			manufacturer: asset.manufacturer ?? '',
			price_pkr: asset.price_pkr,
			vendor_name: asset.vendor_name,
			vendor_phone: asset.vendor_phone,
			invoice_number: asset.invoice_number,
			purchase_date: asset.purchase_date ?? '',
			specs: asset.specs,
			serial_number: asset.serial_number ?? undefined,
			pta_status: asset.pta_status ?? undefined,
			allotted_user_id: asset.allotted_user_id ?? undefined,
			location: asset.location ?? undefined,
			status: asset.status,
			retirement_reason: asset.retirement_reason ?? undefined,
		},
	});

	useEffect(() => {
		if (open) {
			reset({
				asset_tag: asset.asset_tag,
				classification: asset.classification,
				asset_type: asset.asset_type,
				manufacturer: asset.manufacturer ?? '',
				price_pkr: asset.price_pkr,
				vendor_name: asset.vendor_name,
				vendor_phone: asset.vendor_phone,
				invoice_number: asset.invoice_number,
				purchase_date: asset.purchase_date ?? '',
				specs: asset.specs,
				serial_number: asset.serial_number ?? undefined,
				pta_status: asset.pta_status ?? undefined,
				allotted_user_id: asset.allotted_user_id ?? undefined,
				location: asset.location ?? undefined,
				status: asset.status,
				retirement_reason: asset.retirement_reason ?? undefined,
			});
			setTagError(null);
			setSerialError(null);
			setLocationOpen(false);
			setLocationSearch('');
		}
	}, [open, asset, reset]);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				locationRef.current &&
				!locationRef.current.contains(e.target as Node)
			) {
				setLocationOpen(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, []);

	const assetType = watch('asset_type');
	const selectedStatus = watch('status');
	const allottedUserId = watch('allotted_user_id');
	const assetTag = watch('asset_tag');
	const serialNumber = watch('serial_number');
	const location = watch('location');

	useEffect(() => {
		setTagError(null);
	}, [assetTag]);
	useEffect(() => {
		setSerialError(null);
	}, [serialNumber]);

	const typeOptions = (allCategories ?? [])
		.filter((c) => c.classification === asset.classification && c.is_active)
		.map((c) => ({ value: c.type_key, label: c.label }));

	const filteredLocations = OFFICE_LOCATIONS.filter((l) =>
		l.toLowerCase().includes(locationSearch.toLowerCase()),
	);

	async function onSubmit(values: AssetFormValues) {
		// Duplicate tag check (exclude current asset)
		const { data: tagExists } = await supabase
			.from('assets')
			.select('id')
			.eq('asset_tag', values.asset_tag)
			.neq('id', asset.id)
			.maybeSingle();
		if (tagExists) {
			setTagError(`Tag ${values.asset_tag} already exists in the system`);
			return;
		}

		// Duplicate serial number check (only if provided and not company)
		const cleanedSerial = isCompany
			? null
			: values.serial_number?.trim() || null;
		if (cleanedSerial) {
			const { data: snExists } = await supabase
				.from('assets')
				.select('id')
				.eq('serial_number', cleanedSerial)
				.neq('id', asset.id)
				.maybeSingle();
			if (snExists) {
				setSerialError('This serial number already exists on another asset');
				return;
			}
		}

		if (values.status !== 'allotted') values.allotted_user_id = null;

		try {
			await updateAsset.mutateAsync({
				id: asset.id,
				before: asset,
				updates: {
					...values,
					asset_type: values.asset_type as AssetType,
					serial_number: cleanedSerial,
					purchase_date: values.purchase_date || null,
				},
			});
			toast.success('Asset updated');
			onClose();
		} catch (err: unknown) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to update asset',
			);
		}
	}

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={`Edit Asset — ${asset.asset_tag}`}
			size='lg'
			footer={
				<>
					<Button variant='secondary' onClick={onClose}>
						Cancel
					</Button>
					<Button
						variant='primary'
						onClick={handleSubmit(onSubmit)}
						loading={updateAsset.isPending}
					>
						Save Changes
					</Button>
				</>
			}
		>
			<form
				className='space-y-4 pb-6 border-b border-[var(--color-border)]'
				onSubmit={handleSubmit(onSubmit)}
			>
				<div className='grid grid-cols-2 gap-4'>
					<div>
						<Input
							label='Asset Tag *'
							placeholder='e.g. LT-0081'
							{...register('asset_tag')}
							error={errors.asset_tag?.message}
						/>
						{tagError && (
							<p className='mt-1 text-xs text-[var(--color-danger)] font-medium'>
								{tagError}
							</p>
						)}
					</div>
					<Controller
						name='asset_type'
						control={control}
						render={({ field }) => (
							<Select
								label='Asset Type *'
								options={typeOptions}
								value={field.value}
								onValueChange={field.onChange}
								error={errors.asset_type?.message}
							/>
						)}
					/>
				</div>

				<Controller
					name='manufacturer'
					control={control}
					render={({ field }) => (
						<ManufacturerSelect
							label={isCompany ? 'Manufacturer' : 'Manufacturer *'}
							value={field.value ?? ''}
							onChange={field.onChange}
							assetType={assetType}
							classification={asset.classification}
							error={errors.manufacturer?.message}
						/>
					)}
				/>

				<div className='grid grid-cols-2 gap-4'>
					<Input
						label='Price (PKR) *'
						type='number'
						min={0}
						{...register('price_pkr', { valueAsNumber: true })}
						error={errors.price_pkr?.message}
					/>
					<Input
						label='Invoice Number'
						{...register('invoice_number')}
						error={errors.invoice_number?.message}
					/>
				</div>

				<div className='grid grid-cols-2 gap-4'>
					<Input
						label='Vendor Name'
						{...register('vendor_name')}
						error={errors.vendor_name?.message}
					/>
					<Input
						label='Vendor Phone'
						{...register('vendor_phone')}
						error={errors.vendor_phone?.message}
					/>
				</div>

				<Input
					label='Purchase Date'
					type='date'
					{...register('purchase_date')}
					error={errors.purchase_date?.message}
				/>

				<Textarea
					label={isCompany ? 'Specs / Description' : 'Specs / Description *'}
					rows={3}
					{...register('specs')}
					error={errors.specs?.message}
				/>

				{/* Serial number: employee assets only, not for accessory types */}
				{!isCompany &&
					!['mouse', 'keyboard', 'bag', 'other'].includes(assetType) && (
						<div>
							<Input
								label={assetType === 'mobile' ? 'IMEI Number' : 'Serial Number'}
								placeholder={
									assetType === 'mobile' ? 'e.g. 867034051060102' : undefined
								}
								{...register('serial_number')}
								error={errors.serial_number?.message}
							/>
							{serialError && (
								<p className='mt-1 text-xs text-[var(--color-danger)] font-medium'>
									{serialError}
								</p>
							)}
						</div>
					)}

				{assetType === 'mobile' && (
					<Controller
						name='pta_status'
						control={control}
						render={({ field }) => (
							<Select
								label='PTA Status *'
								options={PTA_STATUS_OPTIONS}
								value={field.value ?? 'unknown'}
								onValueChange={field.onChange}
								error={errors.pta_status?.message}
							/>
						)}
					/>
				)}

				<Controller
					name='status'
					control={control}
					render={({ field }) => (
						<Select
							label='Status *'
							options={STATUS_OPTIONS.filter((s) => s.value !== 'in_repair')}
							value={field.value}
							onValueChange={(v) => {
								field.onChange(v);
								if (v !== 'allotted') {
									setValue('allotted_user_id', null);
									setValue('location', null);
								}
							}}
							error={errors.status?.message}
						/>
					)}
				/>

				{selectedStatus === 'retired' && (
					<Controller
						name='retirement_reason'
						control={control}
						render={({ field }) => (
							<Select
								label='Retirement Reason *'
								options={RETIREMENT_REASON_OPTIONS}
								value={field.value ?? 'end_of_life'}
								onValueChange={field.onChange}
								error={errors.retirement_reason?.message}
							/>
						)}
					/>
				)}

				{selectedStatus === 'allotted' && !isCompany && (
					<UserSelectDropdown
						label='Allotted To *'
						profiles={users ?? []}
						value={allottedUserId ?? ''}
						onSelect={(uid) => setValue('allotted_user_id', uid || null)}
						error={errors.allotted_user_id?.message}
					/>
				)}

				{/* Location dropdown: company assets only, when allotted */}
				{selectedStatus === 'allotted' && isCompany && (
					<div className='flex flex-col gap-1'>
						<label className='text-xs font-medium text-[var(--color-text-secondary)]'>
							Location *
						</label>
						<div ref={locationRef} className='relative'>
							<button
								type='button'
								onClick={() => setLocationOpen((v) => !v)}
								className='w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-left text-sm flex justify-between items-center bg-white hover:border-[var(--color-primary)] transition-colors'
							>
								<span
									className={
										location
											? 'text-[var(--color-text)]'
											: 'text-[var(--color-text-secondary)]'
									}
								>
									{location || 'Select office location...'}
								</span>
								<ChevronDown className='w-4 h-4 text-gray-400 shrink-0' />
							</button>
							{locationOpen && (
								<div className='absolute z-50 w-full mt-1 bg-white border border-[var(--color-border)] rounded-lg shadow-lg'>
									<div className='p-2 border-b border-[var(--color-border)]'>
										<input
											autoFocus
											type='text'
											placeholder='Search location...'
											value={locationSearch}
											onChange={(e) => setLocationSearch(e.target.value)}
											className='w-full text-sm px-2 py-1.5 border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)]'
										/>
									</div>
									<div className='max-h-52 overflow-y-auto'>
										{filteredLocations.length === 0 && (
											<div className='px-3 py-2 text-sm text-[var(--color-text-secondary)]'>
												No locations found
											</div>
										)}
										{filteredLocations.map((loc) => (
											<button
												key={loc}
												type='button'
												onClick={() => {
													setValue('location', loc);
													setLocationOpen(false);
													setLocationSearch('');
												}}
												className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-[var(--color-border)] last:border-0 ${loc === location ? 'bg-blue-50' : ''}`}
											>
												{loc}
											</button>
										))}
									</div>
								</div>
							)}
						</div>
						{errors.location && (
							<p className='text-xs text-[var(--color-danger)]'>
								{errors.location.message}
							</p>
						)}
					</div>
				)}
			</form>

			<div className='mt-6'>
				<div className='flex items-center gap-2 mb-3'>
					<Paperclip className='w-4 h-4 text-[var(--color-text-secondary)]' />
					<h3 className='text-sm font-semibold text-[var(--color-text)]'>
						Files & Documents
					</h3>
				</div>
				<AssetFileUploader assetId={asset.id} />
			</div>
		</Modal>
	);
}
