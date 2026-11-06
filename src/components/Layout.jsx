import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

const linkClass = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

export default function Layout() {
  const { isLoggedIn, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-5 md:px-10 md:py-6">
        <Link to="/" className="flex items-center gap-2 no-underline" aria-label="Saraha home">
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-mist" />
          <span className="text-[14px] font-medium uppercase tracking-[0.15em] text-platinum">Saraha</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Main">
          {isLoggedIn ? (
            <>
              <NavLink to="/messages" className={linkClass}>Messages</NavLink>
              <NavLink to="/profile" className={linkClass}>Profile</NavLink>
              <button type="button" className="nav-link" onClick={() => signOut(false)}>Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Log in</NavLink>
              <Link to="/signup" className="btn-primary !py-[10px]">Sign up</Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 md:px-10">
        <Outlet />
      </main>

      <footer className="mt-[68px] bg-deep px-5 py-10 md:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
          <span className="eyebrow">Saraha · say it honestly</span>
          <span className="text-sm">Built by <strong className="font-medium text-mist">Eslam 3laa</strong></span>
        </div>
      </footer>
    </div>
  );
}
