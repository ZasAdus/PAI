import Navbar from './components/Navbar/Navbar';
import { AuthProvider } from './components/AuthContext';
import './components/GuessThePlayer/styles.css';

export const metadata = {
	title: 'GuessThePlayer',
	description: 'Zgadnij zawodnika dnia!',
};

export default function RootLayout({ children }) {
	return (
		<html lang="pl">
			<body>
				<AuthProvider>
					<Navbar />
					<main className="site-main">{children}</main>
				</AuthProvider>
			</body>
		</html>
	);
}
