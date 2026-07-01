import { NavLink, useLocation } from 'react-router-dom';
import {
	LayoutDashboard,
	Package,
	Wrench,
	MessageSquare,
	Users,
	BarChart2,
	Settings,
	ChevronLeft,
	ChevronRight,
	LogOut,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Tooltip } from '@/components/ui/Tooltip';
import { useAuth } from '@/features/auth/useAuth';
import { useRepairs } from '@/hooks/useRepairs';
import { useUnreadCount } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface SidebarProps {
	collapsed: boolean;
	onToggle: () => void;
}

const navItems = [
	{ path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
	{ path: '/assets', icon: Package, label: 'Assets' },
	{ path: '/repair', icon: Wrench, label: 'Repair', badgeKey: 'repair' as const },
	{ path: '/queries', icon: MessageSquare, label: 'Queries', badgeKey: 'queries' as const },
	{ path: '/users', icon: Users, label: 'Users' },
	{ path: '/summary', icon: BarChart2, label: 'Summary' },
	{ path: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
	const { profile, signOut } = useAuth();
	const { data: openRepairs } = useRepairs({ status: 'open' });
	const repairCount = openRepairs?.length ?? 0;
	const { data: unreadQueryCount } = useUnreadCount();
	const queryBadge = unreadQueryCount ?? 0;
	const location = useLocation();

	const badgeCounts: Record<string, number> = {
		repair: repairCount,
		queries: queryBadge,
	};

	return (
		<motion.aside
			className='fixed left-0 top-0 h-screen bg-[var(--color-sidebar)] flex flex-col z-30'
			animate={{ width: collapsed ? 64 : 240 }}
			transition={{ duration: 0.2, ease: 'easeInOut' }}
		>
			{/* Logo */}
			<div className='h-16 flex items-center px-4 border-b border-white/10 flex-shrink-0'>
				{collapsed ? (
					<img
						src='/favicon.png'
						alt='C'
						className='h-6 w-6 object-contain mx-auto'
						// style={{ filter: 'brightness(0) invert(1)' }}
					/>
				) : (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.05 }}
						className='flex items-center gap-2'
					>
						<img
							src='/cogent-labs-logo.webp'
							alt='Cogent Assets'
							className='h-7 w-auto'
							// style={{ filter: 'brightness(0) invert(1)' }}
						/>
						<span
							style={{ fontFamily: 'Playwrite NO, cursive' }}
							className='text-white font-bold text-[1.25rem] '
						>
							assets
						</span>
					</motion.div>
				)}
			</div>

			{/* Nav */}
			<nav className='flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto'>
				{navItems.map(({ path, icon: Icon, label, badgeKey }) => {
					const isActive = location.pathname.startsWith(path);
					const badgeCount = badgeKey ? badgeCounts[badgeKey] ?? 0 : 0;
					const item = (
						<NavLink
							key={path}
							to={path}
							className={cn(
								'flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors duration-100 relative',
								isActive
									? 'text-white'
									: 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-white',
							)}
						>
							{isActive && (
								<motion.div
									layoutId='nav-active-bg'
									className='absolute inset-0 rounded bg-sidebar-active border-l-[3px] border-royal-blue'
									transition={{ type: 'spring', stiffness: 400, damping: 35 }}
								/>
							)}
							<Icon className='w-5 h-5 flex-shrink-0 relative z-10' />
							{!collapsed && (
								<motion.span
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.05 }}
									className='flex-1 truncate relative z-10'
								>
									{label}
								</motion.span>
							)}
							{!collapsed && badgeCount > 0 && (
								<motion.span
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ type: 'spring', stiffness: 500, damping: 30 }}
									className='ml-auto min-w-5 h-5 px-1.5 rounded-full bg-[var(--color-primary)] text-white text-xs font-semibold flex items-center justify-center relative z-10'
								>
									{badgeCount > 99 ? '99+' : badgeCount}
								</motion.span>
							)}
							{collapsed && badgeCount > 0 && (
								<span className='absolute top-1 right-1 w-2 h-2 bg-[var(--color-primary)] rounded-full z-10' />
							)}
						</NavLink>
					);

					return collapsed ? (
						<Tooltip key={path} content={label} side='right'>
							{item}
						</Tooltip>
					) : (
						item
					);
				})}
			</nav>
			<Tooltip
				content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				side='right'
			>
				<button
					onClick={onToggle}
					className='flex justify-center items-center absolute -right-[0.625rem] top-1/2 -translate-y-1/2 ml-auto text-[var(--color-sidebar-text)] bg-[var(--color-sidebar-active)] h-6 w-6  p-1.5 rounded hover:bg-[var(--color-sidebar-hover)] transition-colors'
				>
					{collapsed ? (
						<ChevronRight className='w-4 h-4' />
					) : (
						<ChevronLeft className='w-4 h-4' />
					)}
				</button>
			</Tooltip>
			{/* Bottom */}
			<div className='border-t border-white/10 p-3 flex-shrink-0'>
				{!collapsed && profile && (
					<div className='flex items-center gap-2 mb-3 px-1'>
						<Avatar src={profile.avatar_url} name={profile.name} size='sm' />
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className='flex-1 min-w-0'
						>
							<p className='text-xs font-semibold text-white truncate'>
								{profile.name}
							</p>
							<p className='text-xs text-[var(--color-sidebar-text)] truncate'>
								{profile.role}
							</p>
						</motion.div>
					</div>
				)}
				<div className='flex items-center gap-2'>
					{!collapsed && (
						<button
							onClick={signOut}
							className='flex items-center gap-2 px-3 py-2 rounded text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-white transition-all text-sm'
						>
							<LogOut className='w-4 h-4 flex-shrink-0' />
							<span>Sign out</span>
						</button>
					)}
					{collapsed && (
						<Tooltip content='Sign out' side='right'>
							<button
								onClick={signOut}
								className='flex items-center justify-center p-2 rounded text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-white transition-all'
							>
								<LogOut className='w-4 h-4' />
							</button>
						</Tooltip>
					)}
				</div>
			</div>
		</motion.aside>
	);
}
