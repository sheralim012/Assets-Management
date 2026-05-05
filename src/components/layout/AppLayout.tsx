import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
	Menu,
	X,
	Package,
	Wrench,
	Users,
	BarChart2,
	Settings,
	LogOut,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Avatar } from '@/components/ui/Avatar';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/features/auth/useAuth';
import { useRepairs } from '@/hooks/useRepairs';
import { cn } from '@/lib/utils';

const COLLAPSED_KEY = 'sidebar_collapsed';

const navItems = [
	{ path: '/assets', icon: Package, label: 'Assets' },
	{ path: '/repair', icon: Wrench, label: 'Repair', showBadge: true },
	{ path: '/users', icon: Users, label: 'Users' },
	{ path: '/summary', icon: BarChart2, label: 'Summary' },
	{ path: '/settings', icon: Settings, label: 'Settings' },
];

export function AppLayout() {
	const [collapsed, setCollapsed] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const isMobile = useMediaQuery('(max-width: 767px)');
	const location = useLocation();
	const { profile, signOut } = useAuth();
	const { data: openRepairs } = useRepairs({ status: 'open' });
	const openCount = openRepairs?.length ?? 0;

	useEffect(() => {
		localStorage.setItem(COLLAPSED_KEY, String(collapsed));
	}, [collapsed]);

	const sidebarWidth = collapsed ? 64 : 240;

	if (isMobile) {
		return (
			<div className='min-h-screen bg-[var(--color-bg)]'>
				{/* Mobile top bar */}
				<header className='fixed top-0 left-0 right-0 h-14 bg-[var(--color-sidebar)] z-30 flex items-center justify-between px-4 flex-shrink-0'>
					<img
						src='/cogent-labs-logo.webp'
						alt='Cogent'
						className='h-6 w-auto'
						// style={{ filter: 'brightness(0) invert(1)' }}
					/>
					<button
						onClick={() => setMobileMenuOpen(true)}
						className='text-white p-2'
						aria-label='Open menu'
					>
						<Menu className='w-6 h-6' />
					</button>
				</header>

				{/* Overlay drawer */}
				<AnimatePresence>
					{mobileMenuOpen && (
						<>
							<motion.div
								className='fixed inset-0 bg-black/40 z-40'
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								onClick={() => setMobileMenuOpen(false)}
							/>
							<motion.aside
								className='fixed top-0 left-0 h-screen w-72 bg-[var(--color-sidebar)] z-50 flex flex-col'
								initial={{ x: '-100%' }}
								animate={{ x: 0 }}
								exit={{ x: '-100%' }}
								transition={{ type: 'tween', duration: 0.25 }}
							>
								{/* Drawer header */}
								<div className='h-16 flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0'>
									<div className='flex items-center gap-2'>
										<img
											src='/cogent-labs-logo.webp'
											alt='Cogent Assets'
											className='h-7 w-auto'
											// style={{ filter: 'brightness(0) invert(1)' }}
										/>
										<span
											style={{ fontFamily: 'Playwrite NO, cursive' }}
											className='text-white font-bold text-lg '
										>
											assets
										</span>
									</div>
									<button
										onClick={() => setMobileMenuOpen(false)}
										className='p-2 rounded text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-white transition-colors'
										aria-label='Close menu'
									>
										<X className='w-5 h-5' />
									</button>
								</div>

								{/* Nav items */}
								<nav className='flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto'>
									{navItems.map(({ path, icon: Icon, label, showBadge }) => {
										const isActive = location.pathname.startsWith(path);
										return (
											<NavLink
												key={path}
												to={path}
												onClick={() => setMobileMenuOpen(false)}
												className={cn(
													'flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors duration-100 relative',
													isActive
														? 'text-white bg-sidebar-active border-l-[3px] border-royal-blue'
														: 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-white',
												)}
											>
												<Icon className='w-5 h-5 flex-shrink-0' />
												<span className='flex-1 truncate'>{label}</span>
												{showBadge && openCount > 0 && (
													<span className='bg-[var(--color-primary)] text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center'>
														{openCount}
													</span>
												)}
											</NavLink>
										);
									})}
								</nav>

								{/* Profile + sign out */}
								<div className='border-t border-white/10 p-3 flex-shrink-0'>
									{profile && (
										<div className='flex items-center gap-2 mb-3 px-1'>
											<Avatar
												src={profile.avatar_url}
												name={profile.name}
												size='sm'
											/>
											<div className='flex-1 min-w-0'>
												<p className='text-xs font-semibold text-white truncate'>
													{profile.name}
												</p>
												<p className='text-xs text-[var(--color-sidebar-text)] truncate'>
													{profile.role}
												</p>
											</div>
										</div>
									)}
									<button
										onClick={signOut}
										className='flex items-center gap-2 px-3 py-2 rounded text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-white transition-all text-sm w-full'
									>
										<LogOut className='w-4 h-4 flex-shrink-0' />
										<span>Sign out</span>
									</button>
								</div>
							</motion.aside>
						</>
					)}
				</AnimatePresence>

				{/* Main content */}
				<main className='min-h-screen pt-14'>
					<div className='p-4 overflow-x-hidden'>
						<AnimatePresence mode='wait'>
							<motion.div
								key={location.pathname}
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -6 }}
								transition={{ duration: 0.15 }}
							>
								<Outlet />
							</motion.div>
						</AnimatePresence>
					</div>
				</main>
			</div>
		);
	}

	// Desktop layout
	return (
		<div className='min-h-screen bg-bg'>
			<Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
			<main
				className='min-h-screen transition-all duration-200'
				style={{ marginLeft: sidebarWidth }}
			>
				<div className='p-6'>
					<AnimatePresence mode='wait'>
						<motion.div
							key={location.pathname}
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -6 }}
							transition={{ duration: 0.15 }}
						>
							<Outlet />
						</motion.div>
					</AnimatePresence>
				</div>
			</main>
		</div>
	);
}
