import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border-2 border-black bg-white p-6">
      <h2 className="text-3xl font-black tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-lg font-bold text-[#444]">{children}</div>
    </section>
  );
}

function Step({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border-2 border-black bg-[#F8F8F8] p-5">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-[#5B2BE8]">{title}</p>
      <p className="mt-3 text-lg font-bold text-[#444]">{description}</p>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <section className="rounded-[32px] border-2 border-black bg-black p-8 text-white">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[#A78BFA]">
            Proof Of Tiredness
          </p>

          <h1 className="mt-3 text-5xl font-black tracking-tight md:text-7xl">
            Too Tired To Quit
          </h1>

          <p className="mt-6 max-w-3xl text-xl font-bold text-white/80">
            Most systems reward hype.
            <br />
            TOW rewards endurance.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/too-tired-to-quit"
              className="rounded-2xl border-2 border-white bg-white px-5 py-3 text-sm font-black text-black transition hover:-translate-y-0.5"
            >
              Check Your Status
            </Link>

            <Link
              href="/too-tired-to-quit/leaderboard"
              className="rounded-2xl border-2 border-white px-5 py-3 text-sm font-black transition hover:-translate-y-0.5"
            >
              View Survivors
            </Link>
          </div>
        </section>

        <Section title="What is Too Tired To Quit?">
          <p>
            Too Tired To Quit is a survival-based TOW system built around endurance, participation, and identity.
          </p>

          <p>
            It is not designed to reward fast flipping or passive farming.
          </p>

          <p>
            It rewards the people who stayed.
          </p>
        </Section>

        <Section title="How It Works">
          <div className="grid gap-4 md:grid-cols-4">
            <Step
              title="1. Commit"
              description="Hold qualifying TOW and begin your survival streak."
            />

            <Step
              title="2. Survive"
              description="The longer you survive without resetting, the stronger your commitment becomes."
            />

            <Step
              title="3. Participate"
              description="Make memes, Share TOW posts on X, Play the game, and build your permanent TOW history."
            />

            <Step
              title="4. Choose"
              description="Claim and reset your streak, or continue surviving toward higher milestones."
            />
          </div>
        </Section>

        <Section title="Survival Milestones">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border-2 border-black bg-[#EFE9FF] p-6 text-center">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#5B2BE8]">
                4 Weeks
              </p>

              <p className="mt-3 text-5xl font-black">2.5%</p>

              <p className="mt-3 text-sm font-bold text-[#555]">
                Your first survival milestone.
              </p>
            </div>

            <div className="rounded-3xl border-2 border-black bg-[#EFE9FF] p-6 text-center">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#5B2BE8]">
                8 Weeks
              </p>

              <p className="mt-3 text-5xl font-black">7%</p>

              <p className="mt-3 text-sm font-bold text-[#555]">
                Commitment begins to matter.
              </p>
            </div>

            <div className="rounded-3xl border-2 border-black bg-black p-6 text-center text-white">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#A78BFA]">
                12 Weeks
              </p>

              <p className="mt-3 text-5xl font-black">15%</p>

              <p className="mt-3 text-sm font-bold text-white/70">
                True survivor tier.
              </p>
            </div>
          </div>

          <p>
            Claiming ends your current commitment streak.
            <br />
            Continuing keeps your survival progression alive.
          </p>
        </Section>

        <Section title="Activity Matters">
          <p>
            Too Tired To Quit rewards more than holding.
          </p>

          <p>
            Posting TOW content on X, Playing the game, and maintaining consistent activity contribute toward your identity and progression.
          </p>

          <p>
            Recent activity matters more than old activity, but your permanent history still contributes to your profile.
          </p>
        </Section>

        <Section title="What Resets?">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border-2 border-black bg-[#F8F8F8] p-5">
              <p className="text-lg font-black">Selling</p>
              <p className="mt-2 text-base font-bold text-[#555]">
                Selling disqualifies the current commitment.
              </p>
            </div>

            <div className="rounded-3xl border-2 border-black bg-[#F8F8F8] p-5">
              <p className="text-lg font-black">Claiming</p>
              <p className="mt-2 text-base font-bold text-[#555]">
                Claiming closes the current commitment and resets its survival progression.
              </p>
            </div>
          </div>

          <p>
            Your raids, game history, profile identity, and survivor reputation remain part of your permanent TOW history.
          </p>
        </Section>

        <Section title="Why TOW Built This">
          <p>
            Most systems reward volume.
            <br />
            Most systems reward hype.
          </p>

          <p>
            Too Tired To Quit was built around a different idea:
          </p>

          <div className="rounded-3xl border-2 border-black bg-black p-8 text-center text-white">
            <p className="text-3xl font-black leading-tight md:text-5xl">
              Reward the people who stayed.
            </p>
          </div>

          <p>
            TOW is not just another meme. 
            <br />
            TOW is bringing those who are too tired to quit... together.
          </p>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
