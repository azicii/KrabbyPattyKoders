import { NavLink } from "react-router-dom";

export default function BottomNav() {
    return (
        <nav className="bottom-nav">
            <NavLink to="/home" className="bottom-nav-item">
                <span>🔥</span>
                <small>Streaks</small>
            </NavLink>

            <NavLink to="/friends" className="bottom-nav-item">
                <span>👥</span>
                <small>Friends</small>
            </NavLink>

            <NavLink to="/public-feed" className="bottom-nav-item">
                <span>🌎</span>
                <small>Feed</small>
            </NavLink>
        </nav>
    );
}