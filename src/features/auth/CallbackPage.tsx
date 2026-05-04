import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';

export function CallbackPage() {
	const navigate = useNavigate();
	// useRef so the timeout ID is reachable by both the event callback
	// and the useEffect cleanup, regardless of async timing.
	const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		// Supabase redirects here with ?error=... when OAuth fails at the DB level
		// (e.g. "Database error saving new user"). Detect it immediately so we don't
		// wait for the 8-second fallback timeout.
		const urlParams = new URLSearchParams(window.location.search)
		const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
		const urlError = urlParams.get('error') || hashParams.get('error')
		if (urlError) {
			const desc = urlParams.get('error_description') || hashParams.get('error_description') || ''
			const isTriggerFailure = desc.toLowerCase().includes('database error saving new user')
			navigate(
				isTriggerFailure ? '/login?error=trigger_conflict' : '/login?error=auth',
				{ replace: true }
			)
			return
		}

		async function handleSession(session: Session) {
			// Clear the fallback timer FIRST — before any async work.
			if (fallbackTimeoutRef.current) {
				clearTimeout(fallbackTimeoutRef.current);
				fallbackTimeoutRef.current = null;
			}

			try {
				const email = session.user.email ?? '';
				const allowedDomain =
					import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN ?? 'cogentlabs.co';

				if (!email.endsWith('@' + allowedDomain)) {
					await supabase.auth.signOut();
					navigate('/login?error=wrong_domain', { replace: true });
					return;
				}

				let { data: profile } = await supabase
					.from('profiles')
					.select('id, role, status')
					.eq('id', session.user.id)
					.maybeSingle();

				// Retry once — DB trigger for new users can lag by ~1s
				if (!profile) {
					await new Promise((resolve) => setTimeout(resolve, 1500));
					const { data: retryProfile } = await supabase
						.from('profiles')
						.select('id, role, status')
						.eq('id', session.user.id)
						.maybeSingle();
					profile = retryProfile;
				}

				// Manually-created profiles have a random UUID — look up by email instead
				if (!profile && email) {
					const { data: emailProfile } = await supabase
						.from('profiles')
						.select('id, role, status')
						.eq('email', email.toLowerCase())
						.maybeSingle();

					if (emailProfile) {
						// Reconcile: update the profile's id to match the real auth user id
						// so future logins resolve by id without needing the email fallback
						await supabase
							.from('profiles')
							.update({ id: session.user.id })
							.eq('email', email.toLowerCase());
						profile = { ...emailProfile, id: session.user.id };
					}
				}

				if (!profile || profile.role !== 'admin') {
					await supabase.auth.signOut();
					navigate('/login?error=not_admin', { replace: true });
					return;
				}

				navigate('/assets', { replace: true });
			} catch (err) {
				console.error('Auth callback error:', err);
				navigate('/login?error=auth', { replace: true });
			}
		}

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'SIGNED_IN' && session) {
				// Primary path: OAuth code exchange just completed
				handleSession(session);
			} else if (event === 'INITIAL_SESSION') {
				if (session) {
					// Returning user already has a valid session cookie
					handleSession(session);
				} else {
					// No session yet — OAuth is still in progress.
					// Start fallback in case the redirect never completes.
					fallbackTimeoutRef.current = setTimeout(() => {
						navigate('/login?error=no_session', { replace: true });
					}, 8000);
				}
			}
		});

		return () => {
			// Both must be cleaned up. The timeout MUST be cleared here
			// because returning from handleSession (after navigate) unmounts
			// this component — and the timeout would otherwise fire on the
			// new page, overwriting the successful navigation.
			subscription.unsubscribe();
			if (fallbackTimeoutRef.current) {
				clearTimeout(fallbackTimeoutRef.current);
				fallbackTimeoutRef.current = null;
			}
		};
	}, [navigate]);

	return (
		<div className='min-h-screen bg-[var(--color-bg)] flex items-center justify-center'>
			<div className='text-center'>
				<Spinner size='lg' className='text-[var(--color-primary)] mx-auto' />
				<p className='mt-4 text-sm text-[var(--color-text-secondary)] font-medium'>
					Verifying credentials...
				</p>
			</div>
		</div>
	);
}
