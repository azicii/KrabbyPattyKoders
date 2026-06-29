import "./AppLayout.css";
import BottomNav from "./BottomNav";

type AppLayoutProps = {
    children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="app-layout">
            <main className="app-main">
                <div className="page-container">
                    {children}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}