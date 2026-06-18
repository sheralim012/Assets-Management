import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Loader2 } from 'lucide-react';
import { useManufacturers } from '@/hooks/useManufacturers';
import { cn } from '@/lib/utils';
import type { Classification } from '@/types';
import toast from 'react-hot-toast';

interface ManufacturerSelectProps {
	label?: string;
	value: string;
	onChange: (value: string) => void;
	assetType?: string;
	classification?: Classification;
	error?: string;
	disabled?: boolean;
}

export function ManufacturerSelect({
	label,
	value,
	onChange,
	assetType,
	classification,
	error,
	disabled,
}: ManufacturerSelectProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');
	const [adding, setAdding] = useState(false);
	const [newName, setNewName] = useState('');
	const containerRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const newInputRef = useRef<HTMLInputElement>(null);

	const { manufacturers, addManufacturer, isLoading, isAdding } =
		useManufacturers(assetType);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
				setAdding(false);
				setNewName('');
				setSearch('');
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, []);

	useEffect(() => {
		if (open && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [open]);

	useEffect(() => {
		if (adding && newInputRef.current) {
			newInputRef.current.focus();
		}
	}, [adding]);

	const filtered = manufacturers.filter((m) =>
		m.name.toLowerCase().includes(search.toLowerCase()),
	);

	async function handleAdd() {
		const trimmed = newName.trim();
		if (!trimmed || !assetType || !classification) return;

		const exists = manufacturers.some(
			(m) => m.name.toLowerCase() === trimmed.toLowerCase(),
		);
		if (exists) {
			toast.error('Manufacturer already exists');
			return;
		}

		try {
			const created = await addManufacturer(trimmed, assetType, classification);
			onChange(created.name);
			setAdding(false);
			setNewName('');
			setOpen(false);
			setSearch('');
			toast.success(`Added "${created.name}"`);
		} catch {
			toast.error('Failed to add manufacturer');
		}
	}

	if (!assetType) {
		return (
			<div className='flex flex-col gap-1'>
				{label && (
					<label className='text-sm font-medium text-[var(--color-text)]'>
						{label}
					</label>
				)}
				<div className='input-field flex items-center text-sm text-[var(--color-text-secondary)] opacity-60 cursor-not-allowed'>
					Select asset type first
				</div>
				{error && (
					<p className='text-xs text-[var(--color-danger)]'>{error}</p>
				)}
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-1'>
			{label && (
				<label className='text-sm font-medium text-[var(--color-text)]'>
					{label}
				</label>
			)}
			<div ref={containerRef} className='relative'>
				<button
					type='button'
					onClick={() => !disabled && setOpen((v) => !v)}
					className={cn(
						'input-field w-full flex items-center justify-between text-left',
						error && 'border-[var(--color-danger)]',
						disabled && 'opacity-50 cursor-not-allowed',
					)}
				>
					<span
						className={
							value
								? 'text-[var(--color-text)]'
								: 'text-[var(--color-text-secondary)]'
						}
					>
						{value || 'Select manufacturer...'}
					</span>
					<ChevronDown className='w-4 h-4 text-[var(--color-text-secondary)] shrink-0' />
				</button>

				{open && (
					<div className='absolute z-50 w-full mt-1 bg-white border border-[var(--color-border)] rounded-lg shadow-lg'>
						<div className='p-2 border-b border-[var(--color-border)]'>
							<input
								ref={searchInputRef}
								type='text'
								placeholder='Search manufacturers...'
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className='w-full text-sm px-2 py-1.5 border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)]'
							/>
						</div>

						<div className='max-h-52 overflow-y-auto'>
							{isLoading && (
								<div className='flex items-center justify-center py-4'>
									<Loader2 className='w-4 h-4 animate-spin text-[var(--color-text-secondary)]' />
								</div>
							)}

							{!isLoading && filtered.length === 0 && (
								<div className='px-3 py-3 text-sm text-[var(--color-text-secondary)] text-center'>
									No manufacturers found. Add one?
								</div>
							)}

							{!isLoading &&
								filtered.map((m) => (
									<button
										key={m.id}
										type='button'
										onClick={() => {
											onChange(m.name);
											setOpen(false);
											setSearch('');
											setAdding(false);
										}}
										className={cn(
											'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-[var(--color-border)] last:border-0 flex items-center justify-between',
											m.name === value && 'bg-blue-50',
										)}
									>
										<span>{m.name}</span>
									</button>
								))}
						</div>

						<div className='border-t border-[var(--color-border)]'>
							{!adding ? (
								<button
									type='button'
									onClick={() => setAdding(true)}
									className='w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors font-medium'
								>
									<Plus className='w-4 h-4' />
									Add new manufacturer
								</button>
							) : (
								<div className='p-2 flex gap-2'>
									<input
										ref={newInputRef}
										type='text'
										placeholder='Manufacturer name'
										value={newName}
										onChange={(e) => setNewName(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												handleAdd();
											}
											if (e.key === 'Escape') {
												setAdding(false);
												setNewName('');
											}
										}}
										className='flex-1 text-sm px-2 py-1.5 border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)]'
									/>
									<button
										type='button'
										onClick={handleAdd}
										disabled={!newName.trim() || isAdding}
										className='px-3 py-1.5 text-sm font-medium rounded bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1'
									>
										{isAdding && (
											<Loader2 className='w-3 h-3 animate-spin' />
										)}
										Save
									</button>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
			{error && (
				<p className='text-xs text-[var(--color-danger)]'>{error}</p>
			)}
		</div>
	);
}
