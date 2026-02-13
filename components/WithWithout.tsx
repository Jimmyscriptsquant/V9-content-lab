const WithWithout = () => {
  return (
    <section className="bg-base-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 sm:py-16 md:py-32">
        <h2 className="text-center font-extrabold text-2xl sm:text-3xl md:text-5xl tracking-tight mb-8 sm:mb-12 md:mb-20">
          The old way vs. the V9 way
        </h2>

        <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-4 sm:gap-8 md:gap-12">
          <div className="bg-error/20 text-error p-5 sm:p-8 md:p-12 rounded-lg w-full">
            <h3 className="font-bold text-lg mb-4">
              Without V9 Content Lab
            </h3>

            <ul className="list-disc list-inside space-y-1.5">
              {[
                "Switch between 5+ tools to create content",
                "Manually resize and reformat for each platform",
                "Copy-paste captions across Twitter, IG, LinkedIn...",
                "No API access - your agents can't automate anything",
                "Pay separately for text AI, image AI, video AI, scheduling",
                "Locked into proprietary models with no flexibility",
              ].map((item, index) => (
                <li key={index} className="flex gap-2 items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-4 h-4 shrink-0 opacity-75"
                  >
                    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-success/20 text-success p-5 sm:p-8 md:p-12 rounded-lg w-full">
            <h3 className="font-bold text-lg mb-4">
              With V9 Content Lab
            </h3>

            <ul className="list-disc list-inside space-y-1.5">
              {[
                "One dashboard for text, images, video, and voice",
                "Auto-format for every platform with live preview",
                "Publish to all platforms in a single click",
                "Full REST API - let your AI agents run the show",
                "One subscription covers all AI generation types",
                "Use OpenClaw, open-source models, or any provider",
              ].map((item, index) => (
                <li key={index} className="flex gap-2 items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-4 h-4 shrink-0 opacity-75"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WithWithout;
