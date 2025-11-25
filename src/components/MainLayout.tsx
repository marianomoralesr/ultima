import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';
import AnimatedBlobs from './AnimatedBlobs';

const MainLayout: React.FC = () => {
    const location = useLocation();
    const isExplorarPage = location.pathname.startsWith('/explorar');

    if (isExplorarPage) {
        return <Outlet />; // Render only the page content for a full-screen experience
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 overflow-x-hidden relative">
            <AnimatedBlobs />
            <Header />
            <main className="flex-grow pt-16 lg:pt-28 pb-0 relative z-10 w-full max-w-full">
                <Outlet />
            </main>
            <Footer />
            <BottomNav />
        </div>
    );
};

export default MainLayout;