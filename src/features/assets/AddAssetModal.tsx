import { useEffect, useState, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, User, ChevronDown, Paperclip } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { UserSelectDropdown } from '@/components/ui/UserSelectDropdown';
import { ManufacturerSelect } from '@/components/ui/ManufacturerSelect';
import { AssetFileUploader } from '@/components/assets/AssetFileUploader';
import { assetSchema, type AssetFormValues } from '@/lib/validations';
import { useCreateAsset } from '@/hooks/useAssets';
import { useUsers } from '@/hooks/useUsers';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/lib/supabase';
import { PTA_STATUS_OPTIONS, STATUS_OPTIONS } from '@/lib/constants';
import type { Classification, AssetType } from '@/types';
import { cn } from '@/lib/utils';

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
];

interface AddAssetModalProps {
	open: boolean;
	onClose: () => void;
	defaultClassification?: Classification;
	defaultType?: AssetType;
}

export function AddAssetModal({
	open,
	onClose,
	defaultClassification,
	defaultType,
}: AddAssetModalProps) {
	const [step, setStep] = useState<1 | 2>(defaultClassification ? 2 : 1);
	const [classification, setClassification] = useState<Classification | null>(
		defaultClassification ?? null,
	);
	const [tagError, setTagError] = useState<string | null>(null);
	const [serialError, setSerialError] = useState<string | null>(null);
	const [tagNumber, setTagNumber] = useState('');
	const [locationOpen, setLocationOpen] = useState(false);
	const [locationSearch, setLocationSearch] = useState('');
	const [savedAssetId, setSavedAssetId] = useState<string | null>(null);
	const [savedAssetTag, setSavedAssetTag] = useState<string>('');
	const locationRef = useRef<HTMLDivElement>(null);

	const { data: users } = useUsers({ status: 'active' });
	const { data: allCategories } = useCategories();
	const createAsset = useCreateAsset();

	const {
		register,
		handleSubmit,
		watch,
		control,
		setValue,
		reset,
		formState: { errors },
	} = useForm<AssetFormValues>({
		resolver: zodResolver(assetSchema),
		defaultValues: {
			classification: defaultClassification ?? 'employee_allocated',
			asset_type: defaultType ?? 'laptop',
			price_pkr: 0,
			vendor_name: '',
			vendor_phone: '',
			invoice_number: '',
			purchase_date: '',
			specs: '',
			status: 'available',
			manufacturer: '',
			asset_tag: '',
		},
	});

	const assetType = watch('asset_type');
	const selectedStatus = watch('status');
	const allottedUserId = watch('allotted_user_id');
	const serialNumber = watch('serial_number');
	const location = watch('location');

	useEffect(() => {
		setSerialError(null);
	}, [serialNumber]);

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

	// Derive tag prefix from DB categories (fallback to empty string)
	const tagPrefix = useMemo(() => {
		const cat = (allCategories ?? []).find((c) => c.type_key === assetType);
		return cat?.tag_prefix ?? '';
	}, [allCategories, assetType]);

	// Keep asset_tag form field in sync with the split input
	useEffect(() => {
		const full = tagPrefix ? `${tagPrefix}-${tagNumber}` : tagNumber;
		setValue('asset_tag', full);
	}, [tagNumber, tagPrefix, setValue]);

	// Reset number part when asset type changes
	useEffect(() => {
		setTagNumber('');
		setTagError(null);
	}, [assetType]);

	useEffect(() => {
		if (open) {
			const cls = defaultClassification ?? null;
			setClassification(cls);
			setStep(cls ? 2 : 1);
			setTagError(null);
			setSerialError(null);
			setTagNumber('');
			setLocationOpen(false);
			setLocationSearch('');
			const filteredCats = (allCategories ?? []).filter(
				(c) => (cls ? c.classification === cls : true) && c.is_active,
			);
			const initialType = (defaultType ??
				filteredCats[0]?.type_key ??
				'laptop') as AssetType;
			reset({
				classification: cls ?? 'employee_allocated',
				asset_type: initialType,
				price_pkr: 0,
				vendor_name: '',
				vendor_phone: '',
				invoice_number: '',
				purchase_date: '',
				specs: '',
				status: 'available',
				manufacturer: '',
				asset_tag: '',
			});
		}
	}, [open]); // eslint-disable-line react-hooks/exhaustive-deps

	function handleClassificationSelect(c: Classification) {
		setClassification(c);
		setValue('classification', c);
		const firstType =
			(allCategories ?? []).filter(
				(cat) => cat.classification === c && cat.is_active,
			)[0]?.type_key ?? 'laptop';
		setValue('asset_type', firstType as AssetType);
		setStep(2);
	}

	const typeOptions = (allCategories ?? [])
		.filter((c) => c.classification === classification && c.is_active)
		.map((c) => ({ value: c.type_key, label: c.label }));

	const filteredLocations = OFFICE_LOCATIONS.filter((l) =>
		l.toLowerCase().includes(locationSearch.toLowerCase()),
	);

	const isCompany = classification === 'company_allocated';

	async function onSubmit(values: AssetFormValues) {
		if (!tagNumber.trim()) {
			setTagError('Tag number is required');
			return;
		}

		// Duplicate tag check
		const { data: tagExists } = await supabase
			.from('assets')
			.select('id')
			.eq('asset_tag', values.asset_tag)
			.maybeSingle();
		if (tagExists) {
			setTagError(`Tag ${values.asset_tag} already exists in the system`);
			return;
		}

		// Duplicate serial number check (only if provided)
		const cleanedSerial = values.serial_number?.trim() || null;
		if (cleanedSerial) {
			const { data: snExists } = await supabase
				.from('assets')
				.select('id')
				.eq('serial_number', cleanedSerial)
				.maybeSingle();
			if (snExists) {
				setSerialError('This serial number already exists on another asset');
				return;
			}
		}

		if (values.status !== 'allotted') values.allotted_user_id = null;

		try {
			const result = await createAsset.mutateAsync({
				...values,
				serial_number: isCompany ? null : cleanedSerial,
				purchase_date: values.purchase_date || null,
				created_by: '',
			} as Parameters<typeof createAsset.mutateAsync>[0]);
			toast.success('Asset added successfully');
			setSavedAssetId(result.id);
			setSavedAssetTag(values.asset_tag);
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Failed to add asset');
		}
	}

	function handleClose() {
		reset();
		setTagNumber('');
		setStep(defaultClassification ? 2 : 1);
		setClassification(defaultClassification ?? null);
		setTagError(null);
		setSerialError(null);
		setLocationOpen(false);
		setLocationSearch('');
		setSavedAssetId(null);
		setSavedAssetTag('');
		onClose();
	}

	return (
		<Modal
			open={open}
			onClose={handleClose}
			title={
				savedAssetId
					? `Files — ${savedAssetTag}`
					: step === 1
						? 'Add Asset — Choose Classification'
						: 'Add New Asset'
			}
			size='lg'
			footer={
				savedAssetId ? (
					<Button variant='primary' onClick={handleClose}>
						Done
					</Button>
				) : step === 2 ? (
					<>
						{!defaultClassification && (
							<Button variant='secondary' onClick={() => setStep(1)}>
								Back
							</Button>
						)}
						<Button variant='secondary' onClick={handleClose}>
							Cancel
						</Button>
						<Button
							variant='primary'
							onClick={handleSubmit(onSubmit)}
							loading={createAsset.isPending}
						>
							Add Asset
						</Button>
					</>
				) : undefined
			}
		>
			<AnimatePresence mode='wait' initial={false}>
				{savedAssetId ? (
					<motion.div
						key='uploader'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.15 }}
					>
						<div className='flex items-center gap-2 mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200'>
							<Paperclip className='w-4 h-4 text-emerald-600 shrink-0' />
							<p className='text-sm text-emerald-700'>
								<span className='font-semibold'>{savedAssetTag}</span> was
								created. Attach files below, or click Done to finish.
							</p>
						</div>
						<AssetFileUploader assetId={savedAssetId} />
					</motion.div>
				) : (
					<motion.div
						key='form'
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
					>
						{step === 1 && (
							<div className='grid grid-cols-2 gap-4'>
								{(
									[
										{
											value: 'employee_allocated',
											label: 'Employee Allocated',
											icon: User,
											desc: 'Laptops, mobiles, accessories',
										},
										{
											value: 'company_allocated',
											label: 'Company Allocated',
											icon: Building2,
											desc: 'Furniture, equipment, AV',
										},
									] as const
								).map(({ value, label, icon: Icon, desc }) => (
									<button
										key={value}
										onClick={() => handleClassificationSelect(value)}
										className={cn(
											'p-6 rounded-lg border-2 text-left transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]',
											classification === value
												? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
												: 'border-[var(--color-border)]',
										)}
									>
										<Icon className='w-8 h-8 text-[var(--color-primary)] mb-3' />
										<p className='font-semibold text-[var(--color-primary)]'>
											{label}
										</p>
										<p className='text-xs text-[var(--color-text-secondary)] mt-1'>
											{desc}
										</p>
									</button>
								))}
							</div>
						)}

						{step === 2 && (
							<form className='space-y-4' onSubmit={handleSubmit(onSubmit)}>
								<div className='grid grid-cols-2 gap-4'>
									{/* Split tag input */}
									<div>
										<label className='text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block'>
											Asset Tag *
										</label>
										{tagPrefix ? (
											<div
												className={cn(
													'flex rounded-lg border overflow-hidden transition-colors',
													tagError
														? 'border-[var(--color-danger)]'
														: 'border-[var(--color-border)] focus-within:border-[var(--color-primary)]',
												)}
											>
												<span className='px-3 py-2 bg-gray-100 text-gray-500 font-mono text-sm border-r select-none flex items-center whitespace-nowrap'>
													{tagPrefix}-
												</span>
												<input
													type='text'
													value={tagNumber}
													onChange={(e) => {
														setTagNumber(
															e.target.value
																.replace(/[^0-9A-Za-z]/g, '')
																.toUpperCase(),
														);
														setTagError(null);
													}}
													placeholder='0081'
													className='flex-1 px-3 py-2 text-sm font-mono focus:outline-none min-w-0 bg-white'
												/>
											</div>
										) : (
											<input
												type='text'
												value={tagNumber}
												onChange={(e) => {
													setTagNumber(e.target.value);
													setTagError(null);
												}}
												placeholder='e.g. MIC-PDR1-002'
												className={cn(
													'input-field font-mono w-full',
													tagError ? 'border-[var(--color-danger)]' : '',
												)}
											/>
										)}
										{tagError && (
											<p className='mt-1 text-xs text-[var(--color-danger)] font-medium'>
												{tagError}
											</p>
										)}
									</div>

									{defaultType ? (
										<div className='flex flex-col gap-1'>
											<label className='text-xs font-medium text-[var(--color-text-secondary)]'>
												Asset Type
											</label>
											<div className='px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-medium text-[var(--color-text)]'>
												{(allCategories ?? []).find(
													(c) => c.type_key === defaultType,
												)?.label ?? defaultType}
											</div>
										</div>
									) : (
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
									)}
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
											classification={classification ?? undefined}
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
									label={
										isCompany ? 'Specs / Description' : 'Specs / Description *'
									}
									rows={3}
									{...register('specs')}
									error={errors.specs?.message}
								/>

								{/* Serial number: employee assets only, and not for accessory types */}
								{!isCompany &&
									!['mouse', 'keyboard', 'bag', 'other'].includes(
										assetType,
									) && (
										<div>
											<Input
												label={
													assetType === 'mobile'
														? 'IMEI Number'
														: 'Serial Number'
												}
												placeholder={
													assetType === 'mobile'
														? 'e.g. 867034051060102'
														: undefined
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
											options={STATUS_OPTIONS.filter(
												(s) => s.value !== 'retired',
											)}
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

								{selectedStatus === 'allotted' && !isCompany && (
									<UserSelectDropdown
										label='Allotted To *'
										profiles={users ?? []}
										value={allottedUserId ?? ''}
										onSelect={(uid) =>
											setValue('allotted_user_id', uid || null)
										}
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
															onChange={(e) =>
																setLocationSearch(e.target.value)
															}
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
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</Modal>
	);
}
