import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import ParticleSphere from "../components/ParticleSphere.jsx";

const FEATURES = [
  ["Anonymous messages", "Anyone with your link can send you honest feedback, with images, without an account."],
  ["Secure accounts", "Email verification, optional two-factor codes, and sign-in with Google."],
  ["A private inbox", "Search, filter and delete the messages you receive, and see what you sent."],
];

export default function HomePage() {
  const { isLoggedIn } = useAuth();

  return (
    <>
      <section className="relative flex min-h-[calc(100vh-200px)] flex-col items-center justify-center overflow-hidden py-16 text-center">
        <ParticleSphere className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />
        <div className="relative max-w-[600px]">
          <p className="eyebrow mb-5">Saraha</p>
          <h1 className="text-[clamp(2.5rem,9vw,6rem)] tracking-[-0.04em]">Say it honestly.</h1>
          <p className="mt-6 text-base">
            An anonymous messaging platform for honest, constructive feedback.
            Share your link, read what people really think.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to={isLoggedIn ? "/messages" : "/signup"} className="btn-primary !py-5">
              {isLoggedIn ? "Open my inbox" : "Get started"}
            </Link>
            {!isLoggedIn && <Link to="/login" className="btn-secondary !py-5">Log in</Link>}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[900px] gap-5 pb-8" aria-label="Features">
        {FEATURES.map(([title, text]) => (
          <div key={title} className="card-deep flex items-center justify-between gap-6">
            <div>
              <h2 className="mb-2 text-2xl tracking-[-0.02em]">{title}</h2>
              <p className="text-base">{text}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
