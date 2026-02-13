"use client";

import { useRef, useState } from "react";
import type { JSX } from "react";

interface FAQItemProps {
  question: string;
  answer: JSX.Element;
}

const faqList: FAQItemProps[] = [
  {
    question: "What exactly is V9 Content Lab?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        V9 Content Lab is an AI-powered content creation and publishing platform.
        You can generate text, images, videos, and voiceovers, then publish directly
        to Twitter/X, Instagram, Facebook, LinkedIn, and TikTok. Everything is
        accessible both through a visual dashboard and a REST API.
      </div>
    ),
  },
  {
    question: "What does 'agent-ready' mean? How does it work with AI agents?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        Every feature in V9 Content Lab is exposed via a REST API with API key
        authentication. This means AI agents (like OpenClaw, AutoGPT, LangChain
        agents, or your own custom agent) can programmatically create content,
        plan reel storyboards, and publish to social platforms - completely
        autonomously. Your agent just needs an API key.
      </div>
    ),
  },
  {
    question: "What AI models do you support?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        We support OpenAI (GPT-4o, DALL-E 3, TTS), Anthropic Claude, Kling AI
        for video generation, and ElevenLabs for voice. We&apos;re also adding support
        for open-source models via OpenClaw, so you can bring your own models
        and avoid vendor lock-in.
      </div>
    ),
  },
  {
    question: "Can I use my own API keys for AI providers?",
    answer: (
      <p>
        Yes. You can bring your own OpenAI, Anthropic, or other provider API keys.
        This gives you full control over costs and model selection. On the Enterprise
        plan, you can also configure custom model endpoints.
      </p>
    ),
  },
  {
    question: "Is there a free tier?",
    answer: (
      <p>
        Yes. The free tier includes 10 posts per month, 2 connected platforms,
        and basic AI text generation. No credit card required. Upgrade when you
        need more.
      </p>
    ),
  },
  {
    question: "How is this different from Buffer, Hootsuite, or Later?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        Those tools are scheduling tools - they help you schedule posts you&apos;ve
        already created. V9 Content Lab creates the content for you using AI
        (text, images, videos, voiceovers), then publishes it. Plus, everything
        is API-first, so AI agents can drive the entire workflow autonomously.
        Traditional tools weren&apos;t built for the agent economy.
      </div>
    ),
  },
];

const FaqItem = ({ item }: { item: FAQItemProps }) => {
  const accordion = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <button
        className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <span
          className={`flex-1 text-base-content ${isOpen ? "text-primary" : ""}`}
        >
          {item?.question}
        </span>
        <svg
          className={`flex-shrink-0 w-4 h-4 ml-auto fill-current`}
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center transition duration-200 ease-out ${
              isOpen && "rotate-180"
            }`}
          />
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center rotate-90 transition duration-200 ease-out ${
              isOpen && "rotate-180 hidden"
            }`}
          />
        </svg>
      </button>

      <div
        ref={accordion}
        className={`transition-all duration-300 ease-in-out opacity-80 overflow-hidden`}
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className="pb-5 leading-relaxed">{item?.answer}</div>
      </div>
    </li>
  );
};

const FAQ = () => {
  return (
    <section className="bg-base-200" id="faq">
      <div className="py-12 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8 sm:gap-12">
        <div className="flex flex-col text-left basis-1/2">
          <p className="inline-block font-semibold text-primary mb-4">FAQ</p>
          <p className="sm:text-4xl text-3xl font-extrabold text-base-content">
            Frequently Asked Questions
          </p>
        </div>

        <ul className="basis-1/2">
          {faqList.map((item, i) => (
            <FaqItem key={i} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FAQ;
