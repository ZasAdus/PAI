export default function LoadingSpinner({ label = 'Ładowanie...', size = 'md' }) {
	return (
		<div className={`loading-state loading-state-${size}`} role="status" aria-live="polite">
			<div className="loading-spinner" aria-hidden="true" />
			<span>{label}</span>
		</div>
	);
}
