import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/features/auth/useAuth';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export function EmployeeLayout() {
	const { profile, signOut } = useAuth();
	const navigate = useNavigate();
	const [profileMenuOpen, setProfileMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	useRealtimeNotifications();

	async function handleSignOut() {
		setProfileMenuOpen(false);
		await signOut();
		navigate('/login', { replace: true });
	}

	// Close on outside click
	useEffect(() => {
		if (!profileMenuOpen) return;
		function handleClick(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setProfileMenuOpen(false);
			}
		}
		function handleEsc(e: KeyboardEvent) {
			if (e.key === 'Escape') setProfileMenuOpen(false);
		}
		document.addEventListener('mousedown', handleClick);
		document.addEventListener('keydown', handleEsc);
		return () => {
			document.removeEventListener('mousedown', handleClick);
			document.removeEventListener('keydown', handleEsc);
		};
	}, [profileMenuOpen]);

	return (
		<div className='min-h-screen bg-[var(--color-bg)]'>
			<header className='bg-white border-b border-[var(--color-border)] sticky top-0 z-40'>
				<div className='max-w-6xl mx-auto px-6 py-3 flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<img src='/cogent-logo.png' alt='Cogent' className='h-8 w-auto' />
						<span
							className='text-lg font-bold text-[var(--color-royal-blue)]'
							style={{ fontFamily: 'Playwrite NO, cursive' }}
						>
							assets
						</span>
					</div>
					<div className='flex items-center gap-3'>
						<NotificationBell />
						{profile && (
							<div ref={menuRef} className='relative'>
								<button
									onClick={() => setProfileMenuOpen(!profileMenuOpen)}
									className='flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--color-bg)] transition-colors'
								>
									<Avatar
										src={profile.avatar_url}
										name={profile.name}
										size='sm'
									/>
									<span className='text-sm font-medium text-[var(--color-text)] hidden sm:inline'>
										{profile.name}
									</span>
									<ChevronDown
										className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`}
									/>
								</button>

								<AnimatePresence>
									{profileMenuOpen && (
										<motion.div
											initial={{ opacity: 0, y: -4, scale: 0.95 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											exit={{ opacity: 0, y: -4, scale: 0.95 }}
											transition={{ duration: 0.12 }}
											className='absolute right-0 top-12 w-56 bg-white rounded-xl shadow-[var(--shadow-dropdown)] ring-1 ring-[var(--color-border)] z-50 overflow-hidden'
										>
											<div className='px-4 py-3 border-b border-[var(--color-border)]'>
												<p className='text-sm font-medium text-[var(--color-text)] truncate'>
													{profile.name}
												</p>
												<p className='text-xs text-[var(--color-text-secondary)] truncate'>
													{profile.email}
												</p>
											</div>
											<div className='py-1'>
												<button
													onClick={handleSignOut}
													className='w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors'
												>
													<LogOut className='w-4 h-4' />
													Sign out
												</button>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						)}
					</div>
				</div>
			</header>
			<main className='max-w-6xl mx-auto px-6 py-8'>
				<Outlet />
			</main>
		</div>
	);
}
