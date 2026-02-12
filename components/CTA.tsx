import Link from "next/link";

const CTA = () => {
  return (
    <section className="bg-neutral text-neutral-content">
      <div className="max-w-4xl mx-auto px-8 py-24 md:py-32 text-center">
        <h2 className="font-bold text-3xl md:text-5xl tracking-tight mb-6">
          Stop juggling tools. Start shipping content.
        </h2>
        <p className="text-lg opacity-80 mb-10 max-w-2xl mx-auto">
          Whether you&apos;re a solo creator, an agency managing 50 brands, or
          an AI agent that never sleeps - V9 Content Lab is your single API for
          the entire content pipeline.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard" className="btn btn-primary btn-lg px-10">
            Get Started Free
          </Link>
          <Link
            href="/#pricing"
            className="btn btn-outline btn-lg px-10 text-neutral-content border-neutral-content/30 hover:bg-neutral-content hover:text-neutral"
          >
            View Pricing
          </Link>
        </div>

        <p className="text-sm opacity-60 mt-8">
          Free tier includes 10 posts/month. No credit card required.
        </p>
      </div>
    </section>
  );
};

export default CTA;
