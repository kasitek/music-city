interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
}

export const PageHero = ({ eyebrow, title, description }: PageHeroProps) => {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
        {eyebrow}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        {title}
      </h1>
      <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
        {description}
      </p>
    </div>
  );
};
