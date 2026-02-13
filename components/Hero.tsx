import Link from "next/link";

const Hero = () => {
  return (
    <section className="max-w-7xl mx-auto bg-base-100 flex flex-col items-center justify-center gap-10 sm:gap-16 px-4 sm:px-8 py-12 sm:py-16 lg:py-28">
      <div className="flex flex-col gap-6 sm:gap-8 items-center justify-center text-center max-w-4xl">
        <div className="badge badge-primary badge-outline gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium">
          Now with OpenClaw &amp; open-source model support
        </div>

        <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-7xl tracking-tight">
          One API to create, publish, and
          <span className="text-primary"> automate content</span>
        </h1>
        <p className="text-base sm:text-lg lg:text-xl opacity-80 leading-relaxed max-w-2xl">
          Generate text, images, videos, and voiceovers with AI. Publish to
          every platform in one click. Built for creators, agencies, and the
          agent economy.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 sm:mt-4 w-full sm:w-auto">
          <Link href="/dashboard" className="btn btn-primary btn-md sm:btn-lg px-6 sm:px-8">
            Start Creating Free
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <Link href="/#features" className="btn btn-outline btn-md sm:btn-lg px-6 sm:px-8">
            See How It Works
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 sm:mt-6 text-xs sm:text-sm text-base-content/60">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-success">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            No credit card required
          </div>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-success">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            API-first &amp; agent-ready
          </div>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-success">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            Works with OpenClaw &amp; open-source models
          </div>
        </div>
      </div>

      {/* API Code Preview */}
      <div className="w-full max-w-3xl overflow-hidden">
        <div className="mockup-code bg-neutral text-neutral-content shadow-2xl text-xs sm:text-sm overflow-x-auto">
          <pre data-prefix="$" className="text-success">
            <code>curl -X POST /v1/generate \</code>
          </pre>
          <pre data-prefix=" ">
            <code>  -H &quot;Authorization: Bearer v9cf_your_key&quot; \</code>
          </pre>
          <pre data-prefix=" ">
            <code>
              {`  -d '{"type":"text","prompt":"Write a viral tweet about AI"}'`}
            </code>
          </pre>
          <pre data-prefix=" " className="text-warning">
            <code></code>
          </pre>
          <pre data-prefix=">" className="text-info">
            <code>
              {`{"text":"AI agents don't sleep, don't complain..."`}
            </code>
          </pre>
          <pre data-prefix=">" className="text-info">
            <code>{` "contentId":"abc123", "status":"ready"}`}</code>
          </pre>
        </div>
        <p className="text-center text-sm text-base-content/50 mt-4">
          One API call. Your agent creates and publishes content autonomously.
        </p>
      </div>
    </section>
  );
};

export default Hero;
