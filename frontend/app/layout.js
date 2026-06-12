import Navbar from './components/Navbar';
import './components/GuessThePlayer/styles.css';

export const metadata = {
	title: 'GuessThePlayer',
	description: 'Zgadnij zawodnika dnia!',
};

export default function RootLayout({ children }) {
	return (
		<html lang="pl">
			<body>
				<Navbar />
				<main className="site-main">{children}</main>
			</body>
		</html>
	);
}
